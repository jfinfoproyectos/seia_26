import { getGeminiClient, MODEL_NAME, extractJSON } from "./client";

export interface AIAnswerEvaluation {
    isCorrect: boolean;
    feedback: string;
    scoreContribution: number;
}

/**
 * Analyze a single student answer using Gemini.
 */
export async function evaluateStudentAnswer(
    questionText: string,
    questionType: string,
    studentAnswer: string,
    maxScore: number = 5.0
): Promise<AIAnswerEvaluation> {
    try {
        const ai = await getGeminiClient();

        let focusCriteria = "";
        if (questionType === "Code") {
            focusCriteria = "Evalúa la lógica del código, su eficiencia y si resuelve el problema planteado en el enunciado. No penalices severamente por falta de librerías externas o imports si la lógica central es correcta.";
        } else {
            focusCriteria = "Evalúa la coherencia, redacción y si la respuesta conceptual aborda correctamente el enunciado de la pregunta.";
        }

        const prompt = `
        Actúa como un profesor experto y evaluador justo y socrático.
        Tu tarea es evaluar la respuesta que un estudiante ha dado a la siguiente pregunta de un examen.
        
        **Pregunta (Enunciado)**:
        """
        ${questionText}
        """

        **Tipo de Pregunta**: ${questionType === "Code" ? "Código de Programación" : "Texto / Teórica"}
        
        **Respuesta del Estudiante**:
        """
        ${studentAnswer}
        """
        
        **Criterios de Evaluación**:
        ${focusCriteria}

        **REGLA DE ORO (MUY IMPORTANTE)**: 
        NO LE PROPORCIONES LA RESPUESTA CORRECTA NI ESCRIBAS EL CÓDIGO CON LA SOLUCIÓN. Si el estudiante comete errores, tu trabajo es guiarlo dando pistas claras sobre dónde falló, para que él mismo descubra la solución y lo intente de nuevo. 

        **TAREA**:
        1. Analiza si la respuesta del estudiante responde satisfactoriamente a la pregunta.
        2. Determina un puntaje de evaluación del 0 al ${maxScore} (donde ${maxScore} es perfecto). Puede tener decimales.
        3. Genera una retroalimentación constructiva (feedback) hacia el estudiante aplicando la REGLA DE ORO: indica qué hizo bien, qué está mal, y da sugerencias/pistas para que analice y resuelva su propio error.
        4. Determina si la respuesta en términos generales es correcta (isCorrect).
        
        **SALIDA REQUERIDA (Formato JSON estricto)**:
        {
            "isCorrect": <boolean: true si la respuesta es aceptable/buena, false si está muy mal enfocada o incompleta>,
            "feedback": "<string: retroalimentación con pistas, SIN la respuesta directa>",
            "scoreContribution": <number: puntaje asignado del 0.0 al ${maxScore}>
        }
        `;

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = result.text;
        if (!text) {
            throw new Error("No se recibió respuesta de la IA.");
        }

        let evaluation: AIAnswerEvaluation;
        try {
            evaluation = extractJSON<AIAnswerEvaluation>(text);
        } catch (parseError: any) {
            console.error("[EvaluationAnalysisService] JSON Parse Error");
            throw new Error("Error al procesar la respuesta de la IA.");
        }

        return evaluation;
    } catch (error: any) {
        console.error("Error evaluating answer:", error);

        const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "");

        if (
            errorString.includes("429") ||
            errorString.toLowerCase().includes("quota") ||
            errorString.toLowerCase().includes("exhausted") ||
            errorString.includes("RESOURCE_EXHAUSTED")
        ) {
            throw new Error("Has excedido la cuota gratuita de peticiones a la IA de Gemini.");
        }
        throw new Error(`No se pudo evaluar la respuesta: ${error.message}`);
    }
}

/**
 * Generate a general hint for a question without revealing the answer.
 * Used by the AI_HINT wildcard.
 */
export async function getAiHint(
    questionText: string,
    questionType: string,
    studentAnswer: string
): Promise<string> {
    try {
        const ai = await getGeminiClient();

        const codeSpecific = questionType === "Code"
            ? `
        - Menciona la estructura de datos, algoritmo o patrón de diseño más adecuado para resolver el problema (ej: "un bucle while con un acumulador", "recursión con caso base", "un diccionario/mapa para búsqueda rápida").
        - Si el estudiante ya escribió código, señala la sección específica donde puede mejorar y qué concepto debería revisar ahí.
        - Sugiere un pseudocódigo de alto nivel (máximo 3-4 líneas) que muestre la estructura lógica sin dar la implementación exacta.
        - Si hay un error lógico evidente, describe el tipo de error (ej: "off-by-one", "variable no inicializada", "condición invertida") sin dar la corrección literal.`
            : `
        - Indica qué conceptos teóricos o temas específicos debería consultar el estudiante para construir una buena respuesta.
        - Si el estudiante ya escribió algo, señala qué partes van bien encaminadas y qué aspectos faltan o necesitan más profundidad.
        - Sugiere una estructura de respuesta (ej: "primero define X, luego explica cómo se relaciona con Y, finalmente da un ejemplo de Z").
        - Menciona términos clave o palabras clave que deberían aparecer en una respuesta completa, sin dar las definiciones completas.`;

        const prompt = `
        Eres un tutor experto, paciente y genuinamente útil. Un estudiante necesita tu ayuda durante un examen.
        Tu objetivo es darle una pista que realmente lo desbloquee y lo guíe hacia la respuesta correcta, sin dársela directamente.
        
        **Pregunta del Examen**:
        """
        ${questionText}
        """

        **Tipo de Pregunta**: ${questionType === "Code" ? "Código de Programación" : "Texto / Teórica"}
        
        **Lo que el estudiante ha escrito hasta ahora**:
        """
        ${studentAnswer || "(Aún no ha escrito nada)"}
        """
        
        **INSTRUCCIONES PARA GENERAR LA PISTA**:
        
        1. **Analiza** dónde está atascado el estudiante basándote en lo que ha escrito (o no ha escrito).
        2. **Identifica** el concepto clave, patrón o enfoque que necesita para avanzar.
        3. **Redacta** una pista sustancial que incluya:
           - Una orientación clara sobre por dónde empezar o continuar.
           - Mención de conceptos específicos, funciones, métodos o patrones relevantes que debería investigar o aplicar.
           ${codeSpecific}
        
        **REGLAS**:
        - **NUNCA** des la respuesta completa, el código final ni la solución literal.
        - **SÍ** puedes mencionar nombres de funciones, métodos, operadores o conceptos que el estudiante debería usar.
        - **SÍ** puedes dar ejemplos análogos simplificados si ayudan a entender el enfoque (ej: "es similar a como harías X con Y").
        - Sé **concreto y específico**, evita pistas vagas como "piensa mejor" o "revisa la documentación".
        - Extensión: entre 3 y 6 oraciones. Lo suficiente para ser útil, no tan largo que abrume.
        - Tono: motivador, directo y de confianza, como un profesor que quiere que el estudiante aprenda.
        
        **SALIDA REQUERIDA (Formato JSON estricto)**:
        {
            "hint": "<string: la pista detallada y útil>"
        }
        `;

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = result.text;
        if (!text) throw new Error("No se recibió respuesta de la IA.");

        const parsed = extractJSON<{ hint: string }>(text);
        return parsed.hint;
    } catch (error: any) {
        console.error("Error getting AI hint:", error);
        const errorString = typeof error === 'string' ? error : (error.message || "");
        if (errorString.includes("429") || errorString.toLowerCase().includes("quota") || errorString.includes("RESOURCE_EXHAUSTED")) {
            throw new Error("Has excedido la cuota gratuita de peticiones a la IA de Gemini.");
        }
        throw new Error(`No se pudo obtener la pista: ${error.message}`);
    }
}
