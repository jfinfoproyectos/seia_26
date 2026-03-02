import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SettingsForm } from "@/app/dashboard/admin/settings/SettingsForm";

export default async function AdminSettingsPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || session.user.role !== "admin") {
        redirect("/dashboard");
    }

    const settings = await prisma.systemSettings.findUnique({
        where: { id: "settings" }
    });

    const hasGlobalKey = !!settings?.encryptedGeminiApiKey;
    const allowUserKeys = settings?.allowUserApiKeys ?? true;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h2>
                    <p className="text-muted-foreground">
                        Administra la configuración global de la plataforma, incluyendo la integración de Inteligencia Artificial.
                    </p>
                </div>
            </div>

            <SettingsForm
                hasGlobalKey={hasGlobalKey}
                allowUserKeys={allowUserKeys}
                appTitle={settings?.appTitle || "SmartClass"}
            />
        </div>
    );
}
