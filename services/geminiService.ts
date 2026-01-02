import { GoogleGenAI, Type } from "@google/genai";
import { Note, Subject } from "../types";

// Ensure API Key is loaded safely
const apiKey = process.env.API_KEY || '';

// Initialize client only if key exists
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Mock data for demo mode
const MOCK_RESULT = {
  title: "Photosynthesis: Process & Importance",
  subject: "Science",
  summary: "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
  originalText: "Photosynthesis occurs in the chloroplasts of plant cells. Chlorophyll absorbs sunlight. \nEquation: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2.\nIt is essential for life on Earth as it produces oxygen.",
  cues: ["Chloroplasts", "Chlorophyll", "Chemical Equation", "Oxygen Production"],
  quiz: [
    { question: "Where does photosynthesis occur?", answer: "In the chloroplasts." },
    { question: "What is the primary byproduct relevant to humans?", answer: "Oxygen." },
    { question: "What pigment absorbs sunlight?", answer: "Chlorophyll." }
  ],
  tags: ["biology", "plants", "energy"]
};

export const analyzeImage = async (base64Image: string): Promise<Partial<Note>> => {
  // --- DEMO MODE (No API Key) ---
  if (!ai || !apiKey) {
    console.warn("⚠️ No Gemini API Key found. Using Mock Data.");
    // Simulate network delay for the loading animation
    await new Promise(resolve => setTimeout(resolve, 2500));
    return MOCK_RESULT;
  }

  // --- REAL AI MODE ---
  try {
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      You are an expert tutor for Indian CBSE/ICSE students (Grades 4-12).
      Analyze this image of a student's handwritten or printed notes.
      
      Tasks:
      1. Extract the text precisely (Support both English and Hindi/Devanagari script).
      2. Identify the Subject.
      3. Create a concise summary. IMPORTANT: The summary MUST BE written in the SAME LANGUAGE as the original text found in the image. If the notes are in Hindi, the summary must be in Hindi. If the notes are in English, use English.
      4. CORNELL METHOD: Generate 3-5 short "Cues" or keywords that would appear in the left margin (in the language of the notes).
      5. QUIZ: Generate 3 short conceptual questions with answers based on the text (in the language of the notes).
      6. Generate 3 relevant tags.

      Return ONLY valid JSON.
    `;

    // Create a timeout promise to prevent hanging indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 30000)
    );

    const apiCallPromise = ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', 
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
            cues: { type: Type.ARRAY, items: { type: Type.STRING } },
            quiz: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                } 
              } 
            },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "subject", "summary", "originalText", "tags", "cues", "quiz"]
        }
      }
    });

    // Race against the timeout
    const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    // Clean up potential Markdown formatting which breaks JSON.parse
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();

    return JSON.parse(cleanedText) as Partial<Note>;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback to mock on error so the app doesn't break
    return MOCK_RESULT;
  }
};

export const generateQuiz = async (noteContent: string) => {
    // Placeholder for future specific quiz generation
};