require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    console.log("Testing gemini-embedding-001...");
    const model1 = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const res1 = await model1.embedContent('Hello world');
    console.log(`gemini-embedding-001 dimensions: ${res1.embedding.values.length}`);
  } catch(e) {
    console.error("Error with gemini-embedding-001:", e.message);
  }

  try {
    console.log("Testing gemini-embedding-2...");
    const model2 = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const res2 = await model2.embedContent('Hello world');
    console.log(`gemini-embedding-2 dimensions (default): ${res2.embedding.values.length}`);
  } catch(e) {
    console.error("Error with gemini-embedding-2:", e.message);
  }

  try {
    console.log("Testing gemini-embedding-2 with outputDimensionality...");
    const model3 = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    // In @google/generative-ai, outputDimensionality can sometimes be passed in the model configuration
    const res3 = await model3.embedContent({
      content: { role: 'user', parts: [{ text: 'Hello world' }] },
      outputDimensionality: 768
    });
    console.log(`gemini-embedding-2 dimensions (explicit): ${res3.embedding.values.length}`);
  } catch(e) {
    console.error("Error with gemini-embedding-2 explicit:", e.message);
  }
}
main();
