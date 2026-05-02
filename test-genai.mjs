import { GoogleGenAI } from "@google/genai";
try {
  const ai = new GoogleGenAI({ apiKey: "" });
  console.log("Initialized OK");
} catch (e) {
  console.error("ERROR", e);
}
