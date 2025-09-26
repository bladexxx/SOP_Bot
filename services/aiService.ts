import { GoogleGenAI, Type } from '@google/genai';
import { Flashcard } from '../types';

const GEMINI_MODEL = 'gemini-2.5-flash';

// Read configuration from environment variables, defaulting to 'GEMINI' provider.
const aiProvider = process.env.AI_PROVIDER || 'GEMINI';
const geminiApiKey = process.env.API_KEY;
const gatewayUrl = process.env.AI_GATEWAY_URL;
const gatewayApiKey = process.env.AI_GATEWAY_API_KEY;

/**
 * Generates content using the configured AI provider (Direct Gemini or an AI Gateway).
 * This function abstracts the API call, allowing for flexible backend configurations.
 * 
 * @param prompt - The full prompt string to send to the model.
 * @returns A promise that resolves with the generated text as a string.
 * @throws An error if the required environment variables for the selected provider are missing.
 */
export const generateContentFromPrompt = async (prompt: string): Promise<string> => {
    if (aiProvider === 'GATEWAY') {
        if (!gatewayUrl || !gatewayApiKey) {
            throw new Error('AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing in the .env.local file.');
        }
        console.log(`[AI Service] Using AI Gateway at: ${gatewayUrl}`);

        // This simulates a POST request to a unified AI Gateway.
        // The body structure is a common pattern for such gateways.
        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gatewayApiKey}`
            },
            body: JSON.stringify({
                model: GEMINI_MODEL,
                contents: prompt,
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`AI Gateway request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        
        // This assumes the gateway returns a JSON object with a 'text' property, similar to the direct SDK.
        if (typeof data.text !== 'string') {
             throw new Error('The AI Gateway response was successful but did not contain a "text" property in the expected format.');
        }
        return data.text;

    } else { // Default to the 'GEMINI' provider
        if (!geminiApiKey) {
            throw new Error('Direct Gemini is the configured provider, but VITE_API_KEY is missing in the .env.local file.');
        }
        console.log('[AI Service] Using direct Gemini API.');
        
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const genAIResponse = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
        });

        return genAIResponse.text;
    }
};

/**
 * Analyzes a given text and generates a set of flashcards (Q&A pairs) using the Gemini API.
 * 
 * @param text The knowledge base content to analyze.
 * @returns A promise that resolves with an array of flashcard objects (without IDs).
 */
export const generateFlashcardsFromText = async (text: string): Promise<Omit<Flashcard, 'id'>[]> => {
    const prompt = `
        SYSTEM INSTRUCTION: You are an assistant that creates helpful learning flashcards. Analyze the following text from a knowledge base. Generate 5 to 7 concise question-and-answer pairs that would be useful for a user trying to learn this material. The questions should be things a user might ask, and the answers should be direct and informative. Focus on the most important concepts, rules, or processes in the text. Format the output as a JSON array of objects, where each object has "question" and "answer" properties.

        KNOWLEDGE BASE TEXT:
        ${text}
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: {
                    type: Type.STRING,
                    description: "The question for the flashcard."
                },
                answer: {
                    type: Type.STRING,
                    description: "The answer to the question."
                }
            },
            required: ["question", "answer"]
        }
    };

    // This function must use the direct Gemini API because it relies on specific features like responseSchema.
    if (!geminiApiKey) {
        throw new Error('Direct Gemini is required for flashcard generation, but VITE_API_KEY is missing in the .env.local file.');
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const genAIResponse = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonString = genAIResponse.text;
        const flashcards = JSON.parse(jsonString);

        if (!Array.isArray(flashcards)) {
            throw new Error('AI response was not a valid JSON array.');
        }

        return flashcards as Omit<Flashcard, 'id'>[];

    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw new Error("Failed to generate flashcards from the provided text.");
    }
};
