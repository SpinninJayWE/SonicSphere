import { GoogleGenAI, Type } from "@google/genai";
import { Theme } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is assumed to be available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeAlbumArt = async (base64Image: string): Promise<Theme | null> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. Skipping AI analysis.");
    return null;
  }

  try {
    // Strip the data URL prefix if present to get raw base64
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
        {
          text: "Analyze this album art. Extract 3 dominant hex colors (primary, secondary, accent) and provide a one-word mood description (e.g., 'Energetic', 'Melancholic', 'Cyberpunk'). Return as JSON.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primary: { type: Type.STRING },
            secondary: { type: Type.STRING },
            accent: { type: Type.STRING },
            mood: { type: Type.STRING },
          },
          required: ["primary", "secondary", "accent", "mood"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Theme;
    }
    return null;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};