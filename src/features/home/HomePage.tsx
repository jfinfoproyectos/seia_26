"use client";

import { BookOpen, Calendar, CalendarClock, BarChart, Bell, Home, Users, Settings2, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getRoleFromUser } from "@/services/authService";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicSettingsAction } from "@/app/admin-actions";

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    const { data: session } = authClient.useSession();
    const role = getRoleFromUser(session?.user);
    const [appTitle, setAppTitle] = useState("SmartClass");

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
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



    const getNavigationItems = () => {
        // Only return items if mounted to prevent hydration mismatch
        if (!mounted) {
            return [];
        }

        if (role === "admin") {
            return [
                { title: "Usuarios", url: "/dashboard/admin/users", icon: Users, color: "text-blue-500" },
                { title: "Cursos", url: "/dashboard/admin/courses", icon: BookOpen, color: "text-green-500" },
                { title: "Ajustes", url: "/dashboard/admin/settings", icon: Settings2, color: "text-slate-500" },
            ];
        } else if (role === "teacher") {
            return [
                { title: "Mis Cursos", url: "/dashboard/teacher", icon: BookOpen, color: "text-blue-500" },
                { title: "Evaluaciones", url: "/dashboard/teacher/evaluations", icon: ClipboardCheck, color: "text-orange-500" },
            ];
        } else {
            // Student
            return [
                { title: "Mis Cursos", url: "/dashboard/student", icon: BookOpen, color: "text-blue-500" },
            ];
        }
    };

    const navItems = getNavigationItems();

    return (
        <div className="min-h-[calc(100vh-4rem)] h-auto -ml-4 -mr-4 -mb-4 w-[calc(100%+2rem)] rounded-none overflow-hidden">
            <div className="relative flex flex-col w-full">
                <div className="w-full relative min-h-[300px] md:min-h-[400px] flex flex-col justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center py-10 px-4 text-center text-foreground">
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight px-4">
                            {appTitle}
                        </h1>

                        {/* Greeting and Date */}
                        <div className="mt-6 space-y-2 text-muted-foreground">

                            <h2 className="text-xl md:text-2xl font-medium drop-shadow-md">
                                ¡Hola, {mounted ? (session?.user?.name?.split(' ')[0] || 'Usuario') : 'Usuario'}!
                            </h2>
                            <p className="text-sm md:text-base opacity-90 capitalize drop-shadow-md">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Cards */}
                <div className="w-full py-12 px-6 bg-muted/30 border-y">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold mb-8 text-center">Acceso Rápido</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {navItems.map((item, index) => (
                                <Link key={index} href={item.url}>
                                    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full border-primary/10">
                                        <CardHeader className="flex flex-col items-center justify-center text-center space-y-4 p-6">
                                            <div className={`p-4 rounded-full bg-background shadow-sm ${item.color}`}>
                                                <item.icon className="w-8 h-8" />
                                            </div>
                                            <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-12 w-full"></div>
            </div>
        </div>
    );
}
