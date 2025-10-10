import { GoogleGenAI, Type } from '@google/genai';
import { Flashcard } from '../types';

// This `declare` block informs TypeScript that the `process` object is globally available.
// Vite's `define` configuration will replace these variables with their actual values
// at build time, preventing runtime errors.
declare var process: {
  env: {
    // This variable is provided by the execution environment, not Vite's define config.
    API_KEY: string;
    // These variables are injected by Vite's define config.
    VITE_AI_PROVIDER: string;
    VITE_AI_GATEWAY_URL: string;
    VITE_AI_GATEWAY_API_KEY: string;
    VITE_AI_GATEWAY_MODEL: string;
  }
};

const GEMINI_MODEL = 'gemini-2.5-flash';

// Read configuration from the process.env object. Vite's `define` config replaces these
// variable names with their literal string values during the build.
const aiProvider = process.env.VITE_AI_PROVIDER;
const gatewayUrl = process.env.VITE_AI_GATEWAY_URL;
const gatewayApiKey = process.env.VITE_AI_GATEWAY_API_KEY;
const gatewayModel = process.env.VITE_AI_GATEWAY_MODEL;


// Per project guidelines, the Gemini API key MUST come exclusively from the execution
// environment's `process.env.API_KEY`.
const geminiApiKey = process.env.API_KEY;

// --- Startup Logging: Log the configuration as soon as the module is loaded ---
console.groupCollapsed('[AI Service] Configuration Loaded');
console.info(`AI Provider: %c${aiProvider}`, 'font-weight: bold;');
if (aiProvider === 'GATEWAY') {
    console.log(`Gateway URL: ${gatewayUrl || 'Not Set'}`);
    console.log(`Gateway Model: ${gatewayModel || `(default: ${GEMINI_MODEL})`}`);
    console.log(`Gateway API Key Set: %c${!!gatewayApiKey}`, `font-weight: bold; color: ${!!gatewayApiKey ? 'green' : 'red'};`);
} else {
     console.log(`Gemini API Key Set: %c${!!geminiApiKey}`, `font-weight: bold; color: ${!!geminiApiKey ? 'green' : 'red'};`);
}
console.groupEnd();

if (aiProvider === 'GATEWAY' && (!gatewayUrl || !gatewayApiKey)) {
    console.error('[AI Service] CRITICAL: AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing in your .env file.');
} else if (aiProvider === 'GEMINI' && !geminiApiKey) {
    console.error('[AI Service] CRITICAL: Gemini is the configured provider, but the API_KEY was not found in the environment. This must be configured in the execution environment where the app is hosted.');
}
// --- End of Startup Logging ---

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
            const errorMsg = 'AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing in the .env file.';
            console.error(`[AI Service] Aborting request. ${errorMsg}`);
            throw new Error(errorMsg);
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
        
        const requestBody = {
            model: modelToUse,
            messages: messages,
        };

        console.log('[AI Service] Sending request to Gateway with body:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await fetch(gatewayUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${gatewayApiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            const responseText = await response.text();
            console.log(`[AI Service] Gateway response status: ${response.status}`);
            console.log('[AI Service] Raw gateway response body:', responseText);

            if (!response.ok) {
                throw new Error(`AI Gateway request failed with status ${response.status}: ${responseText}`);
            }

            const data = JSON.parse(responseText);
            console.log('[AI Service] Parsed gateway response data:', data);
            
            // Handle standard OpenAI/LiteLLM response format.
            if (data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
                return data.choices[0].message.content;
            }

            // Fallback for non-standard or older gateway implementations.
            if (typeof data.text === 'string') {
                 return data.text;
            }
            
            throw new Error('The AI Gateway response was successful but did not contain the expected content in "choices[0].message.content" or "text" format.');
        } catch (error) {
            console.error('[AI Service] Error during Gateway fetch operation:', error);
            throw error;
        }

    } else { // Default to the 'GEMINI' provider
        if (!geminiApiKey) {
            const errorMsg = 'Gemini is the configured provider, but the API_KEY is missing in the execution environment.';
            console.error(`[AI Service] Aborting request. ${errorMsg}`);
            throw new Error(errorMsg);
        }
        console.log(`[AI Service] Using direct Gemini API with model: ${GEMINI_MODEL}`);
        
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const genAIResponse = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt,
            });

            // The `text` accessor on GenerateContentResponse can be undefined.
            // Provide a fallback empty string to satisfy the function's string return type.
            const responseText = genAIResponse.text || '';
            console.log('[AI Service] Received response from Gemini API.');
            return responseText;
        } catch (error) {
            console.error('[AI Service] Error calling Gemini API:', error);
            throw error;
        }
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
        const errorMsg = 'Direct Gemini is required for flashcard generation, but the API_KEY is missing in the execution environment.';
        console.error(`[AI Service] Aborting flashcard generation. ${errorMsg}`);
        throw new Error(errorMsg);
    }
    
    try {
        console.log('[AI Service] Generating flashcards using Gemini API.');
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
        console.log('[AI Service] Raw JSON response for flashcards:', jsonString);

        const flashcards = JSON.parse(jsonString);

        if (!Array.isArray(flashcards)) {
            console.error('[AI Service] Flashcard generation returned non-array data:', flashcards);
            throw new Error('AI response was not a valid JSON array.');
        }
        
        console.log(`[AI Service] Successfully generated ${flashcards.length} flashcards.`);
        return flashcards as Omit<Flashcard, 'id'>[];

    } catch (error) {
        console.error("[AI Service] Error generating flashcards:", error);
        throw new Error("Failed to generate flashcards from the provided text.");
    }
};