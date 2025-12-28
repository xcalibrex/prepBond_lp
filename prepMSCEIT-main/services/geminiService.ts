
import { GoogleGenAI, Type } from "@google/genai";
import { Branch, Question, QuestionType } from "../types";

// Helper to get a random branch if none specified
const getRandomBranch = (): Branch => {
  const branches = Object.values(Branch);
  return branches[Math.floor(Math.random() * branches.length)];
};

export const generateAssessment = async (
  requestedBranch?: Branch
): Promise<Question[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API Key found. Returning mock data.");
    return []; // The App will fallback to mock data if this returns empty
  }

  // Always initialize GoogleGenAI inside the service call to ensure the latest API Key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const branch = requestedBranch || getRandomBranch();
  
  const systemPrompt = `
    You are an expert psychometrician specializing in Emotional Intelligence (EI) based on the MSCEIT framework.
    Generate 3 original, unique, high-quality assessment items for the EI branch: "${branch}".
    
    The items must be structurally similar to professional EI tests but use completely original scenarios.
    
    For "Perceiving Emotions", use Type "Image" (I will supply a placeholder image, just describe the emotion to look for).
    For "Understanding Emotions", focus on emotional blends, transitions, and definitions.
    For "Managing Emotions", present a social or personal scenario and ask for the most effective strategy.
    For "Using Emotions", ask how a specific mood aids a specific cognitive task.

    Provide "consensus scoring" where the best answer is 1.0, and others are weighted 0.0 to 0.9 based on plausibility.
  `;

  try {
    const response = await ai.models.generateContent({
      // Fixed: Using gemini-3-flash-preview for Basic Text Tasks (summarization/Q&A)
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 questions for branch: ${branch}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["MC", "Likert", "Image"] },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    score: { type: Type.NUMBER, description: "Between 0.0 and 1.0" },
                  },
                  required: ["id", "text", "score"],
                },
              },
              explanation: { type: Type.STRING },
            },
            required: ["scenario", "type", "options"],
          },
        },
      },
    });

    // Directly access .text property from response
    let text = response.text || "[]";
    // Sanitize response: Remove markdown code blocks if present (common LLM behavior)
    text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

    const rawData = JSON.parse(text);
    
    // Map to internal Question type with IDs
    return rawData.map((item: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      branch: branch,
      type: item.type as QuestionType,
      scenario: item.scenario,
      imageUrl: item.type === 'Image' ? `https://picsum.photos/600/400?random=${index}` : undefined,
      options: item.options,
      explanation: item.explanation
    }));

  } catch (error) {
    console.error("Gemini generation failed", error);
    return [];
  }
};
