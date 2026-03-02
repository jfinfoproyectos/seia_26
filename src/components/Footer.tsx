"use client";

import { useEffect, useState } from "react";
import { getPublicSettingsAction } from "@/app/admin-actions";

export function Footer() {
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
        <footer className="w-full py-2 text-center text-xs text-muted-foreground bg-muted/30 border-t mt-auto">
            <div className="container mx-auto px-4">
                &copy; {new Date().getFullYear()} - {appTitle}
            </div>
        </footer>
    );
}
