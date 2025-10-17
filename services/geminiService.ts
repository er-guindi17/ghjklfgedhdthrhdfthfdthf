import { GoogleGenAI, Type } from "@google/genai";

// According to the guidelines, the API key must be obtained exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates ice breaker lines for a dating app.
 * @returns A promise that resolves to an array of strings.
 */
export const generateIceBreakers = async (): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Genera 5 frases ingeniosas y coquetas para romper el hielo en una app de citas. Deben ser cortas, divertidas y originales.',
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ice_breakers: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'Una frase para romper el hielo.'
              },
              description: 'Una lista de frases para romper el hielo.'
            },
          },
          required: ['ice_breakers'],
        },
      },
    });

    // Per guidelines, access the text property directly.
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    // Validate the structure of the parsed result.
    if (result && Array.isArray(result.ice_breakers)) {
        return result.ice_breakers;
    }
    
    // Fallback if the response is not in the expected format.
    console.error('Unexpected response format from API:', jsonText);
    return ["Lo siento, la respuesta del modelo no tuvo el formato esperado. Inténtalo de nuevo."];

  } catch (error) {
    console.error('Error generating ice breakers:', error);
    return ["Lo siento, no pude generar frases en este momento. Inténtalo de nuevo."];
  }
};

const getToneDescription = (tone: number): string => {
    if (tone <= 20) return 'ingeniosa, sutil y un poco nerd. Usa referencias inteligentes.';
    if (tone <= 40) return 'divertida, casual y amigable. Haz preguntas abiertas.';
    if (tone <= 60) return 'juguetona y un poco coqueta, pero sin ser demasiado directo.';
    if (tone <= 80) return 'confiado, atrevido y con un toque de misterio, sugiriendo planes futuros sin ser explícito.';
    // Refined per user feedback for a clever, daring style.
    return 'atrevido, carismático y magnético. Usa humor juguetón y metáforas ingeniosas para crear respuestas inesperadas y memorables.';
};


/**
 * Generates a reply for a chat conversation based on an image screenshot.
 * @param base64Image The base64 encoded image of the chat.
 * @param mimeType The MIME type of the image.
 * @param tone A number from 0 to 100 indicating the desired tone of the reply.
 * @returns A promise that resolves to a string with the suggested reply.
 */
export const generateChatReply = async (base64Image: string, mimeType: string, tone: number): Promise<string> => {
    const toneDescription = getToneDescription(tone);
    
    // New, much more detailed prompt to ensure the AI understands its role correctly.
    const prompt = `
      **MISIÓN:** Eres un coach de ligue de clase mundial, un maestro del ingenio. Tu objetivo es crear la respuesta perfecta para un usuario en una app de citas.

      **CONTEXTO:** Te proporcionaré una captura de pantalla de una conversación.
      - Los mensajes de **TU USUARIO** (a quien estás ayudando) están en el lado **DERECHO**.
      - Los mensajes de la **OTRA PERSONA** están en el lado **IZQUIERDO**.

      **TAREA:**
      1.  **Analiza** la conversación completa para entender el tema, el ambiente y el contexto.
      2.  **Identifica** el último mensaje enviado por la persona de la **IZQUIERDA**. Este es el mensaje al que debes responder.
      3.  **Crea** una respuesta corta, ingeniosa y carismática para que tu usuario (el de la derecha) la envíe.
      4.  La respuesta debe tener un tono **${toneDescription}**.
      5.  La respuesta debe ser en español.

      **EJEMPLOS DE ORO DE RESPUESTAS ATREVIDAS:**
      - Si te preguntan "¿quién eres?", una buena respuesta es: "la persona que te va a invitar a salir, ¿quién más?"
      - Si te preguntan "¿cuál dinero???", una buena respuesta es: "¿crees que vivir en mi corazón es gratis? 👀"

      **REGLA CRÍTICA DE SALIDA:**
      Responde **ÚNICAMENTE** con el texto del mensaje que tu usuario debe enviar. No añadas comillas, ni "Respuesta:", ni "Aquí tienes una sugerencia:", ni ninguna otra explicación. Solo el texto puro de la respuesta.
    `;

    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        // Per guidelines, access the text property directly.
        // Also, clean up potential markdown or quotes the model might accidentally add.
        let reply = response.text.trim();
        if (reply.startsWith('"') && reply.endsWith('"')) {
            reply = reply.substring(1, reply.length - 1);
        }
        return reply;
    } catch (error) {
        console.error('Error generating chat reply:', error);
        return 'Lo siento, no pude analizar la imagen. Por favor, intenta de nuevo.';
    }
};
