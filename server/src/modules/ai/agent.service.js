/**
 * agent.service.js
 * Core AI orchestration: Gemini + RAG + Function Calling + Memory.
 *
 * Flow for each user message:
 *  1. Load session history from DB (last N turns for context window)
 *  2. Classify intent → RAG or tool-calling or both
 *  3. If RAG path: retrieve relevant knowledge chunks → inject as system context
 *  4. Call Gemini with history + tools + (optionally) RAG context
 *  5. If Gemini requests tool calls → execute tools → feed results back → re-call Gemini
 *  6. Stream or return final text response
 *  7. Persist user + assistant messages to DB
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TOOL_DECLARATIONS, executeTool } = require('./agent.tools');
const { retrieveRelevantChunks } = require('./knowledge.service');
const chatService = require('./chat.service');
const logger = require('../../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------------------------------------------------------------------
// System instruction — defines the AI persona & hard rules
// ---------------------------------------------------------------------------
const buildSystemInstruction = (isAuthenticated, userName) => `
You are the official AI customer service assistant for Adane Hotel, providing professional, warm, and personalized customer service to every guest.

Provide exceptional hospitality with a warm, professional, courteous, and efficient tone. Be concise, natural, and solution-oriented. Always respond in the guest's language.

You have access to:
- Backend tools (dynamic data)
- Hotel knowledge base (RAG)

Rules:
1. Backend tools are the ONLY source of truth for prices, availability, reservations, reservation status, and payments. Never guess, estimate, or invent this information.
2. ALWAYS use the appropriate tool for:
   - Prices & room availability (getRoomAvailability)
   - Room reservations (createRoomReservation)
   - Restaurant reservations (createRestaurantReservation)
   - Event hall reservations (createHallReservation)
   - Reservation inquiries (getMyReservations)
   - Payments (createPayment)
3. Use the knowledge base ONLY for static hotel information such as amenities, services, room descriptions, policies, restaurants, facilities, and FAQs.
4. If the knowledge base does not contain the requested static information, politely say you couldn't find it. Never make up an answer.
5. When a guest wants to book a room, collect or confirm: room type, check-in date, check-out date, and number of guests.
6. Once the guest confirms (e.g. "yes go ahead", "confirm", "book it", "please proceed"), IMMEDIATELY call createRoomReservation with the confirmed details.
7. After creating a reservation, createRoomReservation will return the reservation ID and a Chapa payment link (checkoutUrl). ALWAYS provide the payment link prominently in your response as a markdown link: [Click here to Pay with Chapa](checkoutUrl), display the total amount, and explain that payment is completed securely through Chapa.
8. If a booking is requested and the guest is not logged in, politely ask them to log in before proceeding: [Log In](/login).
9. Present room or hall options clearly using bullet points and include the exact price and availability returned by the backend tool.
10. Do not discuss or compare competing hotels.

Current guest status: ${isAuthenticated ? `Authenticated as ${userName}` : 'Guest (not logged in)'}
`.trim();

// ---------------------------------------------------------------------------
// Intent classifier — determines if we need RAG, tools, or both
// ---------------------------------------------------------------------------
const RAG_KEYWORDS = [
  'policy', 'policies', 'check-in time', 'checkout time', 'amenities', 'parking',
  'wifi', 'gym', 'pool', 'spa', 'breakfast', 'cancellation', 'pet', 'children',
  'location', 'address', 'phone', 'email', 'contact', 'about the hotel',
  'facilities', 'services', 'restaurant menu', 'hours', 'opening',
];

const TOOL_KEYWORDS = [
  'available', 'availability', 'book', 'reserve', 'reservation', 'check',
  'payment', 'pay', 'price', 'cost', 'how much', 'room for', 'nights',
  'my reservation', 'my booking', 'cancel', 'confirm', 'status',
  'event', 'hall', 'wedding', 'conference', 'dinner',
];

const classifyIntent = (message) => {
  const lower = message.toLowerCase();
  
  const matchedRAG = RAG_KEYWORDS.filter(k => lower.includes(k));
  const matchedTools = TOOL_KEYWORDS.filter(k => lower.includes(k));

  const needsRAG = matchedRAG.length > 0;
  const needsTools = matchedTools.length > 0;

  logger.info(`[Intent Classifier] Message: "${message.substring(0, 50)}..."`);
  logger.info(`[Intent Classifier] RAG Keywords matched: [${matchedRAG.join(', ')}] -> needsRAG: ${needsRAG}`);
  logger.info(`[Intent Classifier] TOOL Keywords matched: [${matchedTools.join(', ')}] -> needsTools: ${needsTools}`);

  return { needsRAG, needsTools };
};

// ---------------------------------------------------------------------------
// Convert stored DB messages to Gemini history format
// ---------------------------------------------------------------------------
const toGeminiHistory = (dbMessages) => {
  const history = [];

  for (const msg of dbMessages) {
    let role = '';
    let part = null;

    if (msg.role === 'user') {
      const text = msg.content?.trim();
      if (!text) continue;
      role = 'user';
      part = { text };
    } else if (msg.role === 'assistant') {
      role = 'model';
      if (msg.tool_calls) {
        try {
          const toolCalls = typeof msg.tool_calls === 'string'
            ? JSON.parse(msg.tool_calls)
            : msg.tool_calls;
          if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            part = toolCalls.map(tc => ({
              functionCall: { name: tc.name, args: tc.args || {} },
            }));
          }
        } catch {
          // ignore corrupted tool_calls
        }
      }
      if (!part) {
        const text = msg.content?.trim();
        if (!text) continue; // Ignore empty assistant messages from broken turns
        part = { text };
      }
    } else if (msg.role === 'tool') {
      role = 'function';
      const toolResult = msg.tool_result
        ? (typeof msg.tool_result === 'string' ? JSON.parse(msg.tool_result) : msg.tool_result)
        : {};
      part = {
        functionResponse: {
          name: msg.tool_name,
          response: toolResult,
        },
      };
    }

    if (!role || !part) continue;

    // Ensure strict alternation and starting with user
    if (history.length === 0) {
      if (role === 'user') {
        history.push({ role, parts: Array.isArray(part) ? part : [part] });
      }
    } else {
      const last = history[history.length - 1];
      if (last.role === role) {
        // Merge into the previous message to maintain alternation
        if (Array.isArray(part)) {
          last.parts.push(...part);
        } else {
          // If we are merging texts, add a newline
          if (part.text && last.parts[last.parts.length - 1]?.text) {
             last.parts[last.parts.length - 1].text += '\n' + part.text;
          } else {
             last.parts.push(part);
          }
        }
      } else {
        history.push({ role, parts: Array.isArray(part) ? part : [part] });
      }
    }
  }

  return history;
};

// ---------------------------------------------------------------------------
// Main chat handler
// ---------------------------------------------------------------------------
const chat = async ({ message, sessionId, userId, userName, guestToken }) => {
  const isAuthenticated = !!userId;

  // 1. Get or create session
  const session = await chatService.getOrCreateSession({ sessionId, userId, guestToken });
  const currentSessionId = session.id;

  // 2. Save user message
  await chatService.saveMessage({ sessionId: currentSessionId, role: 'user', content: message });

  // 3. Set session title from first message
  if (!session.title) {
    const title = message.slice(0, 80);
    await chatService.updateSessionTitle(currentSessionId, title);
  }

  // 4. Load recent history
  const dbHistory = await chatService.getSessionMessages(currentSessionId, 20);
  // Exclude the message we just saved (it's the last one)
  const historyForContext = dbHistory.slice(0, -1);

  // 5. Classify intent
  const { needsRAG, needsTools } = classifyIntent(message);

  // 6. Retrieve RAG context if needed
  let ragContext = '';
  if (needsRAG || (!needsTools)) {
    const chunks = await retrieveRelevantChunks(message, 4);
    if (chunks.length > 0) {
      ragContext = '\n\n---\nRELEVANT HOTEL KNOWLEDGE BASE:\n' +
        chunks.map(c => c.chunk_text).join('\n\n') +
        '\n---\n';
    }
  }

  // 7. Build the model — ALWAYS provide tools so multi-turn booking and payment never get stripped
  const systemInstruction = buildSystemInstruction(isAuthenticated, userName || 'Guest');
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const model = genAI.getGenerativeModel({
    model: primaryModel,
    systemInstruction: systemInstruction + ragContext,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });

  // 8. Start chat with history
  const geminiHistory = toGeminiHistory(historyForContext);
  const geminiChat = model.startChat({ history: geminiHistory });

  // 9. Send user message and handle tool calls in a loop
  let currentMessage = message;
  let assistantText = '';
  let allToolCalls = [];
  let paymentUrl = null;
  let paymentAmount = null;
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let result;
    try {
      result = await geminiChat.sendMessage(currentMessage);
    } catch (err) {
      logger.error('Gemini API error: ' + err.message);
      throw new Error('AI service temporarily unavailable: ' + err.message);
    }

    const response = result.response;
    const candidate = response.candidates?.[0];
    if (!candidate) break;

    const parts = candidate.content?.parts || [];
    const functionCallParts = parts.filter(p => p.functionCall);
    const textParts = parts.filter(p => p.text);

    if (functionCallParts.length === 0) {
      // Final text response
      assistantText = textParts.map(p => p.text).join('');
      break;
    }

    // Save assistant turn with tool calls reference BEFORE executing tools
    await chatService.saveMessage({
      sessionId: currentSessionId,
      role: 'assistant',
      content: textParts.map(p => p.text).join('') || '[tool calls]',
      toolCalls: functionCallParts.map(p => ({ name: p.functionCall.name, args: p.functionCall.args })),
    });

    // Execute all requested tool calls
    const toolResponses = [];
    const toolCallsForDB = [];

    for (const part of functionCallParts) {
      const { name, args } = part.functionCall;
      logger.info(`AI tool call: ${name}`, args);

      const toolResult = await executeTool(name, args, userId);
      logger.info(`Tool result for ${name}:`, toolResult);

      if (toolResult?.checkoutUrl) {
        paymentUrl = toolResult.checkoutUrl;
        paymentAmount = toolResult.amount || toolResult.totalPrice || null;
      }

      toolResponses.push({
        functionResponse: { name, response: toolResult },
      });

      toolCallsForDB.push({ name, args });
      allToolCalls.push({ name, args, result: toolResult });

      // Persist tool call and result AFTER the assistant turn
      await chatService.saveMessage({
        sessionId: currentSessionId,
        role: 'tool',
        content: JSON.stringify(toolResult),
        toolName: name,
        toolResult,
      });
    }

    // Feed tool results back to Gemini
    currentMessage = toolResponses;
  }

  // Fallback: if Gemini returned empty text after tool execution, summarize tool result
  if (!assistantText || !assistantText.trim()) {
    const lastTool = allToolCalls[allToolCalls.length - 1];
    if (lastTool?.result?.checkoutUrl) {
      assistantText = `Your reservation has been created! Please complete your payment using the link below:\n\n[Pay with Chapa](${lastTool.result.checkoutUrl})`;
    } else if (lastTool?.result?.message) {
      assistantText = lastTool.result.message;
    }
  }

  // 10. Save final assistant message (only if non-empty)
  if (assistantText && assistantText.trim()) {
    await chatService.saveMessage({
      sessionId: currentSessionId,
      role: 'assistant',
      content: assistantText.trim(),
    });
  }

  return {
    sessionId: currentSessionId,
    message: assistantText,
    toolsUsed: allToolCalls.map(tc => tc.name),
    paymentUrl,
    paymentAmount,
  };
};

// ---------------------------------------------------------------------------
// Streaming version (SSE-compatible)
// ---------------------------------------------------------------------------
const chatStream = async ({ message, sessionId, userId, userName, guestToken, onChunk, onToolCall, onPayment, onDone }) => {
  const isAuthenticated = !!userId;

  const session = await chatService.getOrCreateSession({ sessionId, userId, guestToken });
  const currentSessionId = session.id;

  await chatService.saveMessage({ sessionId: currentSessionId, role: 'user', content: message });

  if (!session.title) {
    await chatService.updateSessionTitle(currentSessionId, message.slice(0, 80));
  }

  const dbHistory = await chatService.getSessionMessages(currentSessionId, 20);
  const historyForContext = dbHistory.slice(0, -1);

  const { needsRAG } = classifyIntent(message);

  let ragContext = '';
  if (needsRAG) {
    const chunks = await retrieveRelevantChunks(message, 4);
    if (chunks.length > 0) {
      ragContext = '\n\n---\nRELEVANT HOTEL KNOWLEDGE BASE:\n' +
        chunks.map(c => c.chunk_text).join('\n\n') +
        '\n---\n';
    }
  }

  const systemInstruction = buildSystemInstruction(isAuthenticated, userName || 'Guest');
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const model = genAI.getGenerativeModel({
    model: primaryModel,
    systemInstruction: systemInstruction + ragContext,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  const geminiHistory = toGeminiHistory(historyForContext);
  const geminiChat = model.startChat({ history: geminiHistory });

  let currentMessage = message;
  let fullText = '';
  let paymentUrl = null;
  let paymentAmount = null;
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let streamResult;
    try {
      streamResult = await geminiChat.sendMessageStream(currentMessage);
    } catch (err) {
      logger.error('Gemini stream error: ' + err.message);
      throw new Error('AI service temporarily unavailable: ' + err.message);
    }

    let roundText = '';
    const toolCallParts = [];

    for await (const chunk of streamResult.stream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          roundText += part.text;
          fullText += part.text;
          onChunk?.(part.text);
        }
        if (part.functionCall) {
          toolCallParts.push(part);
        }
      }
    }

    if (toolCallParts.length === 0) {
      // Done streaming
      break;
    }

    // Handle tool calls
    const toolResponses = [];
    const toolCallsForDB = [];

    for (const part of toolCallParts) {
      const { name, args } = part.functionCall;
      onToolCall?.({ name, args });

      const toolResult = await executeTool(name, args, userId);
      logger.info(`Tool result for ${name}:`, toolResult);

      if (toolResult?.checkoutUrl) {
        paymentUrl = toolResult.checkoutUrl;
        paymentAmount = toolResult.amount || toolResult.totalPrice || null;
        onPayment?.({
          url: toolResult.checkoutUrl,
          amount: paymentAmount,
          txRef: toolResult.txRef || null,
        });
      }

      toolResponses.push({ functionResponse: { name, response: toolResult } });
      toolCallsForDB.push({ name, args });

      await chatService.saveMessage({
        sessionId: currentSessionId,
        role: 'tool',
        content: JSON.stringify(toolResult),
        toolName: name,
        toolResult,
      });
    }

    await chatService.saveMessage({
      sessionId: currentSessionId,
      role: 'assistant',
      content: roundText || '[tool calls]',
      toolCalls: toolCallsForDB,
    });

    currentMessage = toolResponses;
  }

  // Fallback: if fullText is empty after tool calls, summarize tool result
  if (!fullText || !fullText.trim()) {
    if (paymentUrl) {
      fullText = `Your reservation has been created! Please complete your payment using the link below:\n\n[Pay with Chapa](${paymentUrl})`;
      onChunk?.(fullText);
    }
  }

  if (fullText && fullText.trim()) {
    await chatService.saveMessage({
      sessionId: currentSessionId,
      role: 'assistant',
      content: fullText.trim(),
    });
  }

  onDone?.({ sessionId: currentSessionId, fullText, paymentUrl, paymentAmount });

  return { sessionId: currentSessionId, message: fullText, paymentUrl, paymentAmount };
};

module.exports = { chat, chatStream };
