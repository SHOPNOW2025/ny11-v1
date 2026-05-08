import { GoogleGenAI } from '@google/genai';
try {
  const ai = new GoogleGenAI({ apiKey: undefined });
  console.log("Works!");
} catch(e) {
  console.error("Throws!", e.message);
}
