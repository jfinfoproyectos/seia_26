import { getGeminiClient, MODEL_NAME } from "./client";

/**
 * Improve teacher-written feedback using AI
 */
export async function improveFeedback(text: string, userId?: string): Promise<string> {
    try {
        const ai = await getGeminiClient();
        const prompt = `
        Actúa como un editor de texto profesional y empático.
        Tu tarea es mejorar la siguiente retroalimentación escrita por un profesor para un estudiante.
        
        **Texto original**:
        "${text}"
        
        **Objetivos**:
        1. Corregir gramática y ortografía.
        2. Mejorar la claridad y coherencia.
        3. Asegurar un tono profesional, constructivo y motivador.
        4. Mantener el mensaje original, no inventar información nueva.
        
        **SALIDA**: Solo el texto mejorado, sin comillas ni introducciones.
        `;

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });

        return result.text || "";
    } catch (error: any) {
        console.error("Gemini API Error (Improve Feedback):", error);
        throw new Error("No se pudo mejorar la retroalimentación en este momento.");
    }
}
