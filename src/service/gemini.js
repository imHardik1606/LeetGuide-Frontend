import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;

export const getAIResponse = async (prompt) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: "text/plain",
    },
  });

  return result.response.text();
};
