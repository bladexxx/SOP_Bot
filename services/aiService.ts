import { GoogleGenAI } from '@google/genai';

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
