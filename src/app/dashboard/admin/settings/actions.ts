"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function updateSystemSettingsAction(formData: FormData) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || session.user.role !== "admin") {
        throw new Error("No estás autorizado para realizar esta acción.");
    }

    const apiKey = formData.get("geminiApiKey") as string | null;
    const appTitle = formData.get("appTitle") as string | null;
    const allowUserApiKeys = formData.get("allowUserApiKeys") === "on";

    const updateData: any = {
        allowUserApiKeys
    };

    if (appTitle) {
        updateData.appTitle = appTitle;
    }

    if (apiKey && apiKey.trim() !== "") {
        updateData.encryptedGeminiApiKey = await encrypt(apiKey.trim());
    } else if (apiKey === "") {
        updateData.encryptedGeminiApiKey = null;
    }

    try {
        await prisma.systemSettings.upsert({
            where: { id: "settings" },
            update: updateData,
            create: {
                id: "settings",
                ...updateData
            }
        });

        revalidatePath("/dashboard/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar la configuración:", error);
        throw new Error("No se pudo guardar la configuración.");
    }
}
