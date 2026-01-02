import { GoogleGenAI, Type } from "@google/genai";
import { Note, Subject } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeImage = async (base64Image: string): Promise<Partial<Note>> => {
  if (!apiKey) {
    console.error("API Key missing");
    throw new Error("API Key is missing");
  }

  try {
    const model = 'gemini-2.5-flash-image';
    
    const prompt = `
      You are an expert tutor for Indian CBSE/ICSE students (Grades 4-12).
      Analyze this image of a student's handwritten or printed notes.
      
      Tasks:
      1. Extract the text precisely (Support both English and Hindi/Devanagari script).
      2. Identify the Subject from the content (Maths, Science, Hindi, English, Social Science).
      3. Create a concise, child-friendly summary of the key concepts.
      4. Generate 3 relevant tags.

      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity in this demo
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            summary: { type: Type.STRING },
            originalText: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "subject", "summary", "originalText", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as Partial<Note>;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateQuiz = async (noteContent: string) => {
    // Placeholder for future quiz generation feature
};
