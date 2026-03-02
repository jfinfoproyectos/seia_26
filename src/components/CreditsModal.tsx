"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Heart, Github, Linkedin, Mail, ExternalLink, GraduationCap, Code2, Rocket, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicSettingsAction } from "@/app/admin-actions";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function CreditsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [appTitle, setAppTitle] = useState("SmartClass");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getPublicSettingsAction();
                if (settings?.appTitle) {
                    setAppTitle(settings.appTitle);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);
    return (
        <Dialog>
            <Tooltip>
                <DialogTrigger asChild>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Info className="h-[1.2rem] w-[1.2rem]" />
                            <span className="sr-only">Créditos</span>
                        </Button>
                    </TooltipTrigger>
                </DialogTrigger>
                <TooltipContent>
                    <p>Créditos</p>
                </TooltipContent>
            </Tooltip>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créditos de la Aplicación</DialogTitle>
                    <DialogDescription>
                        Información sobre el autor y desarrollo.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <Info className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Jhon Fredy Valencia Gómez</h3>
                        <p className="text-muted-foreground">Ingeniero de Software y Datos</p>
                    </div>
                    <div className="pt-4 border-t border-primary/10 text-center">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} {appTitle}. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
