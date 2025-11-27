import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image.
 * @param base64Image The base64 string of the image (without data prefix if possible, or we strip it).
 * @param prompt The user's instruction (e.g., "Add a retro filter").
 * @returns The base64 string of the generated image.
 */
export const editImageWithGemini = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    // Clean base64 string if it contains the data prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const model = "gemini-2.5-flash-image";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
            {
                text: prompt
            },
            {
                inlineData: {
                    mimeType: "image/png", // Assuming PNG for output consistency or input generic
                    data: cleanBase64
                }
            }
        ]
      },
      config: {
        // No schema needed for image generation, but we look for the image part in response
      }
    });

    // Extract image from response
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw error;
  }
};
