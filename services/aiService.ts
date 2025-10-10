import { GoogleGenAI, Type } from '@google/genai';
import { Flashcard } from '../types';

// Define `process` for client-side type checking, as Vite's `define` makes it available at runtime.
declare var process: {
  env: {
    AI_PROVIDER: string;
    API_KEY: string;
    AI_GATEWAY_URL: string;
    AI_GATEWAY_API_KEY: string;
    AI_GATEWAY_MODEL: string;
  }
};

const GEMINI_MODEL = 'gemini-2.5-flash';

// Read configuration from environment variables, defaulting to 'GEMINI' provider.
const aiProvider = process.env.AI_PROVIDER || 'GEMINI';
const geminiApiKey = process.env.API_KEY;
const gatewayUrl = process.env.AI_GATEWAY_URL;
const gatewayApiKey = process.env.AI_GATEWAY_API_KEY;
const gatewayModel = process.env.AI_GATEWAY_MODEL;

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
        const modelToUse = gatewayModel || GEMINI_MODEL;
        console.log(`[AI Service] Using AI Gateway at: ${gatewayUrl} with model: ${modelToUse}`);

        // This implementation is now compatible with LiteLLM's OpenAI-proxy endpoint.
        // It parses the prompt into a structured message format.
        let systemContent = '';
        let userContent = prompt;

        const systemInstructionMatch = prompt.match(/SYSTEM INSTRUCTION:(.*?)---/s);
        if (systemInstructionMatch && systemInstructionMatch[1]) {
            systemContent = systemInstructionMatch[1].trim();
            userContent = prompt.substring(systemInstructionMatch[0].length).trim();
        }

        const messages = [];
        if (systemContent) {
            messages.push({ role: 'system', content: systemContent });
        }
        messages.push({ role: 'user', content: userContent });
        
        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gatewayApiKey}`
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: messages,
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`AI Gateway request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        
        // Handle standard OpenAI/LiteLLM response format.
        if (data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
            return data.choices[0].message.content;
        }

        // Fallback for non-standard or older gateway implementations.
        if (typeof data.text === 'string') {
             return data.text;
        }
        
        throw new Error('The AI Gateway response was successful but did not contain the expected content in "choices[0].message.content" or "text" format.');

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

        // FIX: The `text` accessor on GenerateContentResponse can be undefined.
        // Provide a fallback empty string to satisfy the function's string return type.
        return genAIResponse.text || '';
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

        // The `text` accessor on GenerateContentResponse is a property.
        const jsonString = genAIResponse.text || '[]';
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