require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  try {
    const result = await model.generateContent("Hello, what is 2+2?");
    console.log(result.response.text());
  } catch (e) {
    console.error("EXACT ERROR MESSAGE:", e.message);
  }
}

test();
