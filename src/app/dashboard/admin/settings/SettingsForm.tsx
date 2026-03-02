"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { updateSystemSettingsAction } from "./actions";

export function SettingsForm({ hasGlobalKey, allowUserKeys, appTitle }: { hasGlobalKey: boolean, allowUserKeys: boolean, appTitle: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [allowUser, setAllowUser] = useState(allowUserKeys);
    const [title, setTitle] = useState(appTitle);

    // We don't fetch the real key to the client for security, we just know if it exists
    const [apiKeyInput, setApiKeyInput] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            await updateSystemSettingsAction(formData);
            toast.success("Ajustes Guardados", {
                description: "La configuración de Inteligencia Artificial se ha actualizado correctamente.",
            });
            // Clear input so they know it saved (the placeholder handles showing it's active)
            if (apiKeyInput) {
                setApiKeyInput("");
            }
        } catch (error: any) {
            toast.error("Error", {
                description: error.message || "Ocurrió un error guardando la configuración.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-primary" />
                        Ajustes de Inteligencia Artificial (Gemini)
                    </CardTitle>
                    <CardDescription>
                        Configura la integración centralizada con Google Gemini para habilitar el asistente de evaluaciones.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-3">
                        <Label htmlFor="appTitle">Título de la Aplicación</Label>
                        <Input
                            id="appTitle"
                            name="appTitle"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: SmartClass"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Este nombre aparecerá en el banner principal, la barra lateral y los correos electrónicos.
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label htmlFor="geminiApiKey">Llave API Global (Gemini API Key)</Label>
                        <Input
                            id="geminiApiKey"
                            name="geminiApiKey"
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder={hasGlobalKey ? "•••••••••••••••••••••••••••••••• (Actualmente configurada)" : "Pega tu clave API aquí..."}
                        />
                        <p className="text-xs text-muted-foreground">
                            Dejar en blanco conservará la clave actual. Ingresa una nueva clave para reemplazarla.
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Permitir API Keys Individuales</Label>
                            <p className="text-sm text-muted-foreground">
                                Si está activado, los profesores o estudiantes podrán suministrar sus propias API Keys en sus configuraciones de perfil, tomando prioridad sobre esta clave global.
                            </p>
                        </div>
                        <Switch
                            name="allowUserApiKeys"
                            checked={allowUser}
                            onCheckedChange={setAllowUser}
                        />
                    </div>

                </CardContent>
                <CardFooter className="border-t px-6 py-4 flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Ajustes
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
