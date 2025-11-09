import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateN8nWorkflow(prompt: string, complexity: 'simple' | 'intermediate' | 'advanced', onChunk: (chunk: string) => void): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  let fullPrompt = prompt;
  switch (complexity) {
    case 'intermediate':
      fullPrompt += "\n\nInstruction: Please include necessary data transformation steps and conditional logic (e.g., using an IF node) if the workflow requires it.";
      break;
    case 'advanced':
      fullPrompt += "\n\nInstruction: Please design a robust, production-ready workflow. Include error handling branches (e.g., check for success/failure after an API call), add comments inside node parameters for complex logic, and consider potential edge cases in the workflow design.";
      break;
    case 'simple':
    default:
      fullPrompt += "\n\nInstruction: Keep the workflow straightforward and linear, focusing only on the core request.";
      break;
  }

  try {
    // FIX: Removed responseMimeType and responseSchema to fix API error.
    // The n8n workflow 'parameters' and 'connections' objects have dynamic keys,
    // which is not supported by the strict `responseSchema` validation for OBJECT types.
    // The model is guided by the system instruction to return JSON instead.
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    let fullResponse = '';
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullResponse += chunkText;
        onChunk(chunkText);
      }
    }

    if (!fullResponse) {
        throw new Error("The API returned an empty response.");
    }
    
    // FIX: Re-introduce markdown stripping as the model may wrap its JSON response.
    let cleanJson = fullResponse.trim();
    if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.substring(7, cleanJson.length - 3).trim();
    } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.substring(3, cleanJson.length - 3).trim();
    }
    
    // Validate the cleaned JSON.
    JSON.parse(cleanJson);

    return cleanJson;
  } catch (error: any) {
    console.error("Error generating n8n workflow:", error);
    if (error instanceof SyntaxError || (error.message && error.message.includes('JSON'))) {
        throw new Error("The AI failed to generate valid JSON. Please try rephrasing your prompt.");
    }
    throw new Error(`Failed to generate workflow. Reason: ${error.message}`);
  }
}