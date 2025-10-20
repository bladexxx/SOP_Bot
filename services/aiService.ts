import { GoogleGenAI, Type, Modality } from '@google/genai';
import { Flashcard, GeminiModel } from '../types';

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

const GEMINI_MODEL: GeminiModel = 'gemini-2.5-flash';

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
    console.log(`Gateway Base URL: ${gatewayUrl || 'Not Set'}`);
    console.info(`(Note: The final URL will be constructed as \`{Base URL}/{Model}/v1/chat/completions\`)`);
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
 * Internal helper to make a POST request to the AI Gateway, following an OpenAI-compatible /v1/chat/completions structure.
 * It centralizes fetch logic, authorization, error handling, and logging.
 *
 * @param callName - A name for the call, used for logging (e.g., 'content generation').
 * @param requestBody - The JSON object to send in the request body. Must include a 'model' property.
 * @returns The parsed JSON response from the gateway.
 */
const _callAiGateway = async (callName: string, requestBody: { model: string, [key: string]: any }): Promise<any> => {
    if (!gatewayUrl || !gatewayApiKey) {
        const errorMsg = 'AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing in the .env file.';
        console.error(`[AI Service] Aborting gateway request for ${callName}. ${errorMsg}`);
        throw new Error(errorMsg);
    }
    
    const modelInBody = requestBody.model;
    if (!modelInBody) {
        throw new Error('The request body for gateway calls must contain a "model" property.');
    }
    
    // Construct the dynamic URL based on the user's example: {base_url}/{model_name}/v1/chat/completions
    const fullGatewayUrl = `${gatewayUrl}/${modelInBody}/v1/chat/completions`;

    console.log(`[AI Service] Sending ${callName} request to Gateway URL: %c${fullGatewayUrl}`, 'font-weight: bold;');
    console.log(`[AI Service] Sending ${callName} request to Gateway with body:`, JSON.stringify(requestBody, null, 2));

    try {
        const response = await fetch(fullGatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gatewayApiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log(`[AI Service] Gateway response status for ${callName}: ${response.status}`);
        console.log(`[AI Service] Raw gateway response body for ${callName}:`, responseText);

        if (!response.ok) {
            throw new Error(`AI Gateway request for ${callName} failed with status ${response.status}: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log(`[AI Service] Parsed gateway response data for ${callName}:`, data);
        return data;
    } catch (error) {
        console.error(`[AI Service] Error during Gateway fetch operation for ${callName}:`, error);
        throw error;
    }
};


/**
 * Generates content using the configured AI provider (Direct Gemini or an AI Gateway).
 * This function abstracts the API call, allowing for flexible backend configurations.
 * 
 * @param prompt - The full prompt string to send to the model.
 * @param modelOverride - An optional model name to use for direct Gemini calls, overriding the default.
 * @returns A promise that resolves with the generated text as a string.
 * @throws An error if the required environment variables for the selected provider are missing.
 */
export const generateContentFromPrompt = async (prompt: string, modelOverride?: GeminiModel): Promise<string> => {
    if (aiProvider === 'GATEWAY') {
        const modelToUse = gatewayModel || GEMINI_MODEL;
        console.log(`[AI Service] Using AI Gateway. Base URL: ${gatewayUrl}, Model: ${modelToUse}`);

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
            stream: false, // Explicitly set stream to false as per user's example
        };

        const data = await _callAiGateway('content generation', requestBody);
        
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
            const errorMsg = 'Gemini is the configured provider, but the API_KEY is missing in the execution environment.';
            console.error(`[AI Service] Aborting request. ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const modelToUse = modelOverride || GEMINI_MODEL;
        console.log(`[AI Service] Using direct Gemini API with model: %c${modelToUse}`, 'font-weight: bold;');
        
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const genAIResponse = await ai.models.generateContent({
                model: modelToUse,
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
 * Analyzes a given text and generates a set of flashcards (Q&A pairs) using the configured AI Provider.
 * 
 * @param text The knowledge base content to analyze.
 * @param modelOverride - An optional model name to use for direct Gemini calls, overriding the default.
 * @returns A promise that resolves with an array of flashcard objects (without IDs).
 */
export const generateFlashcardsFromText = async (text: string, modelOverride?: GeminiModel): Promise<Omit<Flashcard, 'id'>[]> => {
    const prompt = `
        SYSTEM INSTRUCTION: You are an assistant that creates helpful learning flashcards. Analyze the following text from a knowledge base. Generate 5 to 7 concise question-and-answer pairs that would be useful for a user trying to learn this material. The questions should be things a user might ask, and the answers should be direct and informative. Focus on the most important concepts, rules, or processes in the text. Your response MUST be a single valid JSON array of objects, where each object has "question" and "answer" properties. Do not wrap the array in a parent object.

        KNOWLEDGE BASE TEXT:
        ${text}
    `;
    
    if (aiProvider === 'GATEWAY') {
        const modelToUse = gatewayModel || GEMINI_MODEL;
        console.log(`[AI Service] Generating flashcards via AI Gateway. Base URL: ${gatewayUrl}, Model: ${modelToUse}`);

        const requestBody = {
            model: modelToUse,
            messages: [{ role: 'user', content: prompt }],
            // For OpenAI-compatible endpoints, this hint greatly improves reliability of JSON output.
            response_format: { type: "json_object" }, 
            stream: false, // Explicitly set stream to false as per user's example
        };

        try {
            const data = await _callAiGateway('flashcard generation', requestBody);
            const jsonString = data.choices?.[0]?.message?.content;

            if (typeof jsonString !== 'string') {
                 throw new Error('AI Gateway response for flashcards did not contain a valid string in "choices[0].message.content".');
            }

            console.log('[AI Service] Raw JSON string for flashcards from gateway:', jsonString);
            
            // Attempt to parse the content string into a JSON array
            const flashcards = JSON.parse(jsonString);

            if (!Array.isArray(flashcards)) {
                console.error('[AI Service] Flashcard generation via gateway returned non-array data:', flashcards);
                throw new Error('The AI gateway response was not a valid JSON array.');
            }
            
            console.log(`[AI Service] Successfully generated ${flashcards.length} flashcards via Gateway.`);
            return flashcards as Omit<Flashcard, 'id'>[];

        } catch (error) {
            console.error("[AI Service] Error generating flashcards via Gateway:", error);
            throw new Error(`Failed to generate flashcards from the provided text via gateway. Details: ${error}`);
        }
    } else { // Direct Gemini logic
        if (!geminiApiKey) {
            const errorMsg = 'Direct Gemini is required for flashcard generation, but the API_KEY is missing in the execution environment.';
            console.error(`[AI Service] Aborting flashcard generation. ${errorMsg}`);
            throw new Error(errorMsg);
        }
        
        const modelToUse = modelOverride || GEMINI_MODEL;
        console.log(`[AI Service] Generating flashcards using direct Gemini API with model: %c${modelToUse}`, 'font-weight: bold;');
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The question for the flashcard." },
                    answer: { type: Type.STRING, description: "The answer to the question." }
                },
                required: ["question", "answer"]
            }
        };

        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const genAIResponse = await ai.models.generateContent({
                model: modelToUse,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });

            const jsonString = genAIResponse.text || '[]';
            console.log('[AI Service] Raw JSON response for flashcards from Gemini:', jsonString);
            const flashcards = JSON.parse(jsonString);

            if (!Array.isArray(flashcards)) {
                console.error('[AI Service] Flashcard generation from Gemini returned non-array data:', flashcards);
                throw new Error('AI response was not a valid JSON array.');
            }
            
            console.log(`[AI Service] Successfully generated ${flashcards.length} flashcards via Gemini.`);
            return flashcards as Omit<Flashcard, 'id'>[];
        } catch (error) {
            console.error("[AI Service] Error generating flashcards with Gemini:", error);
            throw new Error(`Failed to generate flashcards from the provided text. Details: ${error}`);
        }
    }
};

/**
 * Generates high-quality speech audio from text using the Gemini TTS model.
 * @param text The text to convert to speech.
 * @returns A promise that resolves with the base64 encoded audio data as a string.
 */
export const generateSpeechFromText = async (text: string): Promise<string> => {
    if (!geminiApiKey) {
        const errorMsg = 'Direct Gemini API is required for speech generation, but the API_KEY is missing in the execution environment.';
        console.error(`[AI Service] Aborting request. ${errorMsg}`);
        throw new Error(errorMsg);
    }

    console.log(`[AI Service] Generating speech for text: "${text.substring(0, 50)}..."`);
    
    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  // Using 'Kore' for a high-quality, professional-sounding voice.
                  prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from Gemini TTS API.");
        }
        
        console.log('[AI Service] Successfully received speech data from Gemini.');
        return base64Audio;

    } catch (error) {
        console.error('[AI Service] Error calling Gemini TTS API:', error);
        throw error;
    }
};
