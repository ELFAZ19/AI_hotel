require('dotenv').config();
const { pool } = require('./src/config/db');
const chatService = require('./src/modules/ai/chat.service');

const toGeminiHistory = (dbMessages) => {
  const history = [];
  for (const msg of dbMessages) {
    if (msg.role === 'user') {
      history.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls) {
        const toolCalls = typeof msg.tool_calls === 'string'
          ? JSON.parse(msg.tool_calls)
          : msg.tool_calls;
        history.push({
          role: 'model',
          parts: toolCalls.map(tc => ({
            functionCall: { name: tc.name, args: tc.args },
          })),
        });
      } else {
        history.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    } else if (msg.role === 'tool') {
      const toolResult = msg.tool_result
        ? (typeof msg.tool_result === 'string' ? JSON.parse(msg.tool_result) : msg.tool_result)
        : {};
      history.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: msg.tool_name,
            response: toolResult,
          },
        }],
      });
    }
  }
  return history;
};

async function main() {
  const res = await pool.query('SELECT id FROM chat_sessions ORDER BY updated_at DESC LIMIT 1');
  if (res.rows.length === 0) return console.log('No sessions');
  const sessionId = res.rows[0].id;
  
  const msgs = await chatService.getSessionMessages(sessionId, 20);
  console.log("DB Messages:");
  msgs.forEach(m => console.log(`[${m.created_at}] ${m.role}: ${m.content ? m.content.substring(0,50) : ''} | tool_calls: ${!!m.tool_calls}`));
  
  const history = toGeminiHistory(msgs.slice(0, -1)); // Like in code
  console.log("\nGemini History:");
  console.log(JSON.stringify(history, null, 2));

  // Let's try passing this to Gemini to see the actual error
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  try {
    const chat = model.startChat({ history });
    await chat.sendMessage("hello");
    console.log("SUCCESS!");
  } catch(e) {
    console.error("GEMINI ERROR:", e.message);
  }
}

main().then(() => process.exit(0));
