import { getGeminiClient, MODEL_NAME, extractJSON } from "./client";

/**
 * Generate a complete question (enunciated) based on a topic or evaluation title.
 */
export async function generateQuestion(
    topic: string,
    type: string,
    language?: string,
    customPrompt?: string,
    size: "short" | "medium" | "long" = "medium"
): Promise<string> {
    try {
        const ai = await getGeminiClient();

        const typeDesc = type === "Code"
            ? `una pregunta de programación en lenguaje ${language || "JavaScript"}. El enunciado DEBE pedir una solución técnica en este lenguaje.`
            : "una pregunta teórica o de razonamiento. El lenguaje de programación a usar NO es obligatorio a menos que el profesor lo mencione en su prompt; de lo contrario, usa conceptos generales.";

        const sizeDesc = {
            short: "Concisa y directa al punto (aprox 3-5 líneas).",
            medium: "Balanceada con contexto y requerimientos claros (aprox 6-10 líneas).",
            long: "Detallada, con escenario de fondo, múltiples requerimientos y restricciones (más de 10 líneas)."
        }[size];

        const prompt = `
        Actúa como un profesor universitario experto en pedagogía y evaluación.
        Tu tarea es generar el enunciado (en markdown) para una pregunta de examen.
        
        **Contexto General (Título de la Evaluación)**: ${topic}
        **Tipo de Pregunta**: ${typeDesc}
        **Tamaño/Profundidad**: ${sizeDesc}
        ${customPrompt ? `**Instrucciones/Estilo del Profesor**: ${customPrompt}` : ""}
        
        **INSTRUCCIONES DE GENERACIÓN**:
        1. Crea un enunciado claro, profesional y desafiante.
        2. Usa formato Markdown para que se vea bien (negritas, listas, bloques de código si es necesario).
        3. Si es de código, describe un problema específico que el estudiante deba resolver programando.
        4. Si es teórica, pide una explicación o análisis profundo.
        5. Respeta estrictamente el **Tamaño/Profundidad** solicitado.
        6. Evita dar la respuesta en el enunciado.
        7. Sé directo: no digas "Aquí tienes tu pregunta", solo devuelve el contenido de la pregunta.

        **SALIDA REQUERIDA (Formato JSON estricto)**:
        {"questionText": "<string formatted in markdown>"}
        `;

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = result.text;
        if (!text) throw new Error("No se recibió respuesta de la IA.");

        const parsed = extractJSON<{ questionText: string }>(text);
        return parsed.questionText;
    } catch (error: any) {
        console.error("Error generating question:", error);
        throw new Error(`No se pudo generar la pregunta: ${error.message}`);
    }
}

/**
 * Generate a sample (ideal) answer for a given question.
 */
export async function generateSampleAnswer(
    questionText: string,
    type: string,
    language?: string
): Promise<string> {
    try {
        const ai = await getGeminiClient();

        const formatDesc = type === "Code"
            ? `solo el fragmento de código funcional en ${language || "JavaScript"}.`
            : "un párrafo o lista con la respuesta teórica correcta y completa (usa el lenguaje de programación mencionado en el enunciado si aplica).";

        const prompt = `
        Eres un estudiante brillante o un asistente de enseñanza.
        Tu tarea es proporcionar una respuesta perfecta y concisa a la siguiente pregunta:
        
        **Enunciado de la Pregunta**:
        """
        ${questionText}
        """
        
        **Tipo**: ${type}
        
        **INSTRUCCIONES**:
        1. Genera la respuesta ideal que un profesor esperaría recibir.
        2. Para preguntas de código, devuelve únicamente el código, sin explicaciones adicionales ni bloques de markdown (el IDE ya formatea).
        3. Para preguntas de texto, sé preciso y usa un tono académico.
        4. La respuesta debe ser directamente utilizable como referencia.

        **SALIDA REQUERIDA (Formato JSON estricto)**:
        {
            "answer": "<string: la respuesta generada>"
        }
        `;

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = result.text;
        if (!text) throw new Error("No se recibió respuesta de la IA.");

        const parsed = extractJSON<{ answer: string }>(text);
        return parsed.answer;
    } catch (error: any) {
        console.error("Error generating answer:", error);
        throw new Error(`No se pudo generar la respuesta: ${error.message}`);
    }
}
