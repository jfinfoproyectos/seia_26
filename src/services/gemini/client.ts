import { GoogleGenAI } from "@google/genai";
import { decrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";

export const MODEL_NAME = "gemini-2.5-flash";

/**
 * Get a configured GoogleGenAI instance
 * @returns GoogleGenAI instance configured with the appropriate API key
 */
export async function getGeminiClient(): Promise<GoogleGenAI> {
    const { auth } = await import("@/lib/auth");
    const { headers } = await import("next/headers");

    // 1. Get system settings
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "settings" }
    });

    let finalApiKey: string | null = null;
    let fallbackToGlobal = true;

    // 2. Check for User API Key if allowed
    if (settings?.allowUserApiKeys) {
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            if (session?.user?.id) {
                const user = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { encryptedGeminiApiKey: true }
                });

                if (user?.encryptedGeminiApiKey) {
                    finalApiKey = await decrypt(user.encryptedGeminiApiKey);
                    fallbackToGlobal = false;
                }
            }
        } catch (e) {
            console.warn("Could not retrieve session for user API Key overriding.");
        }
    }

    // 3. Fallback to global if needed
    if (fallbackToGlobal && settings?.encryptedGeminiApiKey) {
        finalApiKey = await decrypt(settings.encryptedGeminiApiKey);
    }

    // 4. Ultimate fallback to ENV (optional compatibility)
    if (!finalApiKey) {
        finalApiKey = process.env.GEMINI_API_KEY || null;
    }

    if (!finalApiKey) {
        throw new Error("Gemini API Key not configured globally nor by the user.");
    }

    return new GoogleGenAI({ apiKey: finalApiKey });
}

/**
 * Extract and parse JSON from AI response text
 * Handles cases where JSON is wrapped in markdown code blocks or has extra text
 */
export function extractJSON<T = any>(text: string): T {
    const firstOpenBrace = text.indexOf('{');
    const lastCloseBrace = text.lastIndexOf('}');

    let jsonStr = text;
    if (firstOpenBrace !== -1 && lastCloseBrace !== -1) {
        jsonStr = text.substring(firstOpenBrace, lastCloseBrace + 1);
    }

    return JSON.parse(jsonStr);
}

/**
 * Repair escaped characters in feedback text
 */
export function repairFeedbackText(text: string): string {
    if (typeof text !== 'string') return text;
    return text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}
