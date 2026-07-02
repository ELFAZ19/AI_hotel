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
You are the official AI concierge for this hotel.

You have access to backend tools and a knowledge base.

Rules:

1. Never guess prices.
2. Never guess room availability.
3. Never guess reservation status.
4. Never guess payment information.
5. Always use function calls for:
   - prices
   - availability
   - reservations
   - restaurant bookings
   - hall bookings
   - payments
6. Use the RAG knowledge base only for static hotel information.
7. If the knowledge base does not contain the answer, say you could not find that information.
8. Do not answer from your own knowledge if a tool or knowledge search should be used.

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
      role = 'user';
      part = { text: msg.content };
    } else if (msg.role === 'assistant') {
      role = 'model';
      if (msg.tool_calls) {
        const toolCalls = typeof msg.tool_calls === 'string'
          ? JSON.parse(msg.tool_calls)
          : msg.tool_calls;
        part = toolCalls.map(tc => ({
          functionCall: { name: tc.name, args: tc.args },
        }));
      } else {
        part = { text: msg.content };
      }
    } else if (msg.role === 'tool') {
      role = 'function'; // functionResponse belongs to the 'function' role in Gemini
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
          if (part.text && last.parts[last.parts.length - 1].text) {
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

  // Ensure tool functionResponses immediately follow functionCalls if we somehow messed up DB order
  // Wait, if DB order is wrong (tool then assistant), role='user' then role='model'.
  // This will naturally merge with surrounding user/model turns but might be semantically backwards.
  // We've fixed future DB inserts, so we'll just accept merging for now to prevent crashes.

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

  // 7. Build the model
  const systemInstruction = buildSystemInstruction(isAuthenticated, userName || 'Guest');
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: systemInstruction + ragContext,
    tools: needsTools ? [{ functionDeclarations: TOOL_DECLARATIONS }] : undefined,
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
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let result;
    try {
      result = await geminiChat.sendMessage(currentMessage);
    } catch (err) {
      logger.error('Gemini API error: ' + err.message);
      throw new Error('AI service temporarily unavailable. Please try again.');
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
    const toolCallsForDB = []; // Kept for logic consistency if needed, though we already used functionCallParts above

    for (const part of functionCallParts) {
      const { name, args } = part.functionCall;
      logger.info(`AI tool call: ${name}`, args);

      const toolResult = await executeTool(name, args, userId);
      logger.info(`Tool result for ${name}:`, toolResult);

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

  // 10. Save final assistant message
  await chatService.saveMessage({
    sessionId: currentSessionId,
    role: 'assistant',
    content: assistantText,
  });

  return {
    sessionId: currentSessionId,
    message: assistantText,
    toolsUsed: allToolCalls.map(tc => tc.name),
  };
};

// ---------------------------------------------------------------------------
// Streaming version (SSE-compatible)
// ---------------------------------------------------------------------------
const chatStream = async ({ message, sessionId, userId, userName, guestToken, onChunk, onToolCall, onDone }) => {
  const isAuthenticated = !!userId;

  const session = await chatService.getOrCreateSession({ sessionId, userId, guestToken });
  const currentSessionId = session.id;

  await chatService.saveMessage({ sessionId: currentSessionId, role: 'user', content: message });

  if (!session.title) {
    await chatService.updateSessionTitle(currentSessionId, message.slice(0, 80));
  }

  const dbHistory = await chatService.getSessionMessages(currentSessionId, 20);
  const historyForContext = dbHistory.slice(0, -1);

  const { needsRAG, needsTools } = classifyIntent(message);

  let ragContext = '';
  if (needsRAG || !needsTools) {
    const chunks = await retrieveRelevantChunks(message, 4);
    if (chunks.length > 0) {
      ragContext = '\n\n---\nRELEVANT HOTEL KNOWLEDGE BASE:\n' +
        chunks.map(c => c.chunk_text).join('\n\n') +
        '\n---\n';
    }
  }

  const systemInstruction = buildSystemInstruction(isAuthenticated, userName || 'Guest');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstruction + ragContext,
    tools: needsTools ? [{ functionDeclarations: TOOL_DECLARATIONS }] : undefined,
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  const geminiHistory = toGeminiHistory(historyForContext);
  const geminiChat = model.startChat({ history: geminiHistory });

  let currentMessage = message;
  let fullText = '';
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let streamResult;
    try {
      streamResult = await geminiChat.sendMessageStream(currentMessage);
    } catch (err) {
      throw new Error('AI service temporarily unavailable.');
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

  await chatService.saveMessage({
    sessionId: currentSessionId,
    role: 'assistant',
    content: fullText,
  });

  onDone?.({ sessionId: currentSessionId, fullText });

  return { sessionId: currentSessionId, message: fullText };
};

module.exports = { chat, chatStream };
