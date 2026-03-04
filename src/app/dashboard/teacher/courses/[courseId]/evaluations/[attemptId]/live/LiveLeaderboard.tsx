"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getLiveLeaderboardData } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Star, ArrowLeft, Loader2, AlertTriangle, ShieldAlert, MonitorPlay, Maximize, Minimize } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LiveLeaderboardData {
    id: string;
    userId: string;
    name: string;
    score: number;
    answersCount: number;
    totalQuestions: number;
    progress: number;
    submittedAt: Date | null;
    expulsions: number;
}

interface LiveLeaderboardProps {
    attemptId: string;
    courseId: string;
    evaluationTitle: string;
    courseTitle: string;
}

export function LiveLeaderboard({ attemptId, courseId, evaluationTitle, courseTitle }: LiveLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LiveLeaderboardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isScreensaverActive, setIsScreensaverActive] = useState(false);

    const [topLimit, setTopLimit] = useState(6);
    const topColRef = useRef<HTMLDivElement>(null);

    // Calculate how many students fit dynamically in the Top List
    useEffect(() => {
        const updateLimit = () => {
            if (topColRef.current) {
                // Get available height inside the CardContent
                const availableHeight = topColRef.current.clientHeight;
                // Each row is roughly 52px (py-2.5 = 20px, + text sizes + border)
                const rowHeight = 52;
                // We subtract a little safety margin to avoid cutting off an item
                const maxItems = Math.max(1, Math.floor((availableHeight - 8) / rowHeight));
                setTopLimit(maxItems);
            }
        };

        const observer = new ResizeObserver(() => updateLimit());
        if (topColRef.current) {
            observer.observe(topColRef.current);
        }

        updateLimit();

        return () => observer.disconnect();
    }, [leaderboard]);


    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const data = await getLiveLeaderboardData(attemptId);
            setLeaderboard(data);
            setLastUpdate(new Date());
        } catch (err) {
            console.error("Error fetching live leaderboard", err);
            setError("Error al obtener datos en vivo.");
        } finally {
            setIsLoading(false);
        }
    }, [attemptId]);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Track fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Screensaver auto-cycle timer (Refresh screen to prevent burn-in)
    useEffect(() => {
        // Every 2 minutes (120,000 ms), activate screensaver to refresh pixels
        const screensaverInterval = setInterval(() => {
            setIsScreensaverActive(true);

            // Auto hide and return to leaderboard after 15 seconds
            setTimeout(() => {
                setIsScreensaverActive(false);
            }, 15000);

        }, 120000);

        return () => clearInterval(screensaverInterval);
    }, []);

    useEffect(() => {
        fetchData();

        const intervalId = setInterval(() => {
            fetchData();
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [fetchData]);

    const topStudent = leaderboard.length > 0 ? leaderboard[0] : null;
    const remainingStudents = leaderboard.length > 1 ? leaderboard.slice(1) : [];

    // Find the student with the most expulsions (only if expulsions > 0)
    const validLeaderboard = leaderboard.filter(s => s.expulsions > 0);
    const validMostExpelled = validLeaderboard.length > 0 ? validLeaderboard.reduce((prev, current) => {
        return (prev.expulsions > current.expulsions) ? prev : current;
    }) : null;

    return (
        <div className="flex flex-col h-screen overflow-hidden p-4 pb-6 gap-3 animate-in fade-in duration-500 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <Link href={`/dashboard/teacher/courses/${courseId}/evaluations/${attemptId}`}>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                            <MonitorPlay className="w-7 h-7 text-primary" />
                            Panel en Vivo
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {courseTitle} - <span className="font-semibold text-foreground">{evaluationTitle}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 bg-background p-3 flex-row rounded-lg border shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="mr-2"
                        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                    <div className="flex items-center space-x-2 text-sm border-l pl-4 border-slate-200 dark:border-slate-800">
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                        <span className="font-medium text-muted-foreground" suppressHydrationWarning>
                            Actualizado: {lastUpdate.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-center space-x-2 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {!isLoading && leaderboard.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center flex-1 border-2 border-dashed rounded-xl">
                    <Trophy className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-xl text-muted-foreground font-medium">Aún no hay participantes en esta evaluación.</p>
                </div>
            )}

            {leaderboard.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
                    {/* Left Column (Highlights) */}
                    <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                        {/* Top Student Card */}
                        {topStudent && (
                            <div className="relative group flex-1 flex flex-col min-h-0">
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                <Card className="relative overflow-hidden border-2 border-yellow-400/50 shadow-2xl bg-gradient-to-br from-yellow-50/90 to-amber-100/90 dark:from-yellow-950/40 dark:to-orange-950/40 backdrop-blur-sm flex-1 flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 dark:bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

                                    <CardHeader className="text-center py-2 px-4 relative z-10 flex-shrink-0">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-xs font-bold mb-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            1er LUGAR
                                            <Star className="w-3 h-3 fill-current" />
                                        </div>
                                        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full p-0.5 shadow-md flex items-center justify-center mb-1">
                                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                                                <Trophy className="w-6 h-6 text-yellow-500" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-black text-slate-800 dark:text-slate-100 truncate leading-tight">
                                            {topStudent.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 relative z-10 px-4 pb-4 pt-2 overflow-hidden">
                                        <div className="flex justify-between items-center border-b border-yellow-200/50 dark:border-yellow-900/50 pb-2">
                                            <div>
                                                <p className="text-xs font-semibold text-yellow-800/70 dark:text-yellow-200/70 uppercase tracking-wider">Nota Actual</p>
                                                <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400 leading-none">
                                                    {topStudent.score.toFixed(2)}
                                                    <span className="text-base text-yellow-600/50 dark:text-yellow-400/50">/5.0</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-yellow-800/70 dark:text-yellow-200/70 uppercase">Estado</p>
                                                {topStudent.submittedAt ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/20 text-green-700 dark:text-green-400 font-bold border border-green-500/30 text-xs">
                                                        Terminado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold border border-blue-500/30 animate-pulse text-xs">
                                                        En proceso
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-slate-700 dark:text-slate-300">Progreso</span>
                                                <span className="text-slate-800 dark:text-slate-200 font-bold">{Math.round(topStudent.progress)}% ({topStudent.answersCount}/{topStudent.totalQuestions} r.)</span>
                                            </div>
                                            <Progress value={topStudent.progress} className="h-2 bg-yellow-200 dark:bg-yellow-900" />
                                        </div>

                                        {topStudent.expulsions > 0 && (
                                            <div className="flex items-center justify-center gap-1.5 p-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                                                <ShieldAlert className="w-3.5 h-3.5" />
                                                <span className="font-bold text-xs">{topStudent.expulsions} expulsión(es)</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Most Expelled Student Card */}
                        {validMostExpelled && validMostExpelled.id !== topStudent?.id && (
                            <div className="relative group animate-in slide-in-from-left duration-500 flex-1 flex flex-col min-h-0">
                                <Card className="relative overflow-hidden border-2 border-red-500/30 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20 backdrop-blur-sm flex-1 flex flex-col justify-center">
                                    <CardContent className="p-5 relative z-10 flex items-center justify-between flex-1 gap-4">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs font-bold mb-2 uppercase tracking-tight border border-red-200 dark:border-red-800/60">
                                                <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                Más Expulsiones
                                            </div>
                                            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 truncate mb-1">
                                                {validMostExpelled.name}
                                            </h3>
                                            <p className="text-xs text-red-700/80 dark:text-red-300/80 font-medium leading-tight">
                                                Por incumplimientos a las normas de supervisión durante la evaluación.
                                            </p>
                                        </div>
                                        <div className="text-center bg-gradient-to-br from-red-500/10 to-red-500/20 dark:from-red-900/30 dark:to-red-950/30 rounded-xl p-4 border border-red-500/30 shadow-inner flex-shrink-0 min-w-[80px]">
                                            <span className="block text-4xl font-black text-red-600 dark:text-red-400 leading-none drop-shadow-sm">
                                                {validMostExpelled.expulsions}
                                            </span>
                                            <span className="text-[10px] font-bold text-red-800/80 dark:text-red-300/80 uppercase mt-1 block tracking-wider">Faltas</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                    {/* End of Highlights Left Column */}

                    {/* Ranking List */}
                    {/* Main Ranking List */}
                    <div className="lg:col-span-4 flex flex-col min-h-0">
                        <Card className="flex flex-col flex-1 border-slate-200 shadow-xl dark:border-slate-800 overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b py-2 px-4 flex-shrink-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Medal className="w-4 h-4 text-slate-500" />
                                    Top Estudiantes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden" ref={topColRef}>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {remainingStudents.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            No hay más estudiantes.
                                        </div>
                                    ) : (
                                        remainingStudents.slice(0, topLimit).map((student, index) => {
                                            const globalRank = index + 2; // 1 is topStudent, remaining start at 2
                                            const totalStudents = leaderboard.length;
                                            const isBlurred = globalRank > totalStudents - 5;
                                            return (
                                                <div key={student.id} className="py-2.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 font-bold text-slate-500 dark:text-slate-400 text-xs">
                                                        #{globalRank}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={cn("font-semibold text-sm truncate", isBlurred && "blur-sm select-none")}>
                                                            {student.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                            <div className="flex items-center gap-1.5 w-20">
                                                                <Progress value={student.progress} className="h-1.5 flex-1" />
                                                            </div>
                                                            {student.submittedAt ? (
                                                                <span className="text-[10px] font-semibold text-green-600 dark:text-green-500">Terminado</span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-500">{student.answersCount}/{student.totalQuestions} r.</span>
                                                            )}
                                                            {student.expulsions > 0 && (
                                                                <span className="flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-500 font-medium">
                                                                    <ShieldAlert className="w-2.5 h-2.5" />
                                                                    {student.expulsions}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right flex-shrink-0">
                                                        <div className="text-base font-bold font-mono">
                                                            {student.score.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Compact Ranking List */}
                    <div className="lg:col-span-4 flex flex-col min-h-0">
                        <Card className="flex flex-col flex-1 border-slate-200 shadow-xl dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
                            <CardHeader className="bg-slate-100/50 dark:bg-slate-900/40 border-b py-2 px-3 flex-shrink-0">
                                <CardTitle className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Medal className="w-3 h-3" />
                                    Resto del Grupo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                    {remainingStudents.length <= topLimit ? (
                                        <div className="p-6 text-center text-muted-foreground text-xs">
                                            No hay suficientes estudiantes.
                                        </div>
                                    ) : (
                                        remainingStudents.slice(topLimit).map((student, index) => {
                                            const globalRank = index + topLimit + 2;
                                            const totalStudents = leaderboard.length;
                                            const isBlurred = globalRank > totalStudents - 5;
                                            return (
                                                <div key={student.id} className="py-1 px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                        <div className="w-4 h-4 rounded bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 font-bold text-slate-500 dark:text-slate-400 text-[9px]">
                                                            #{globalRank}
                                                        </div>
                                                        <h3 className={cn("font-medium text-[11px] truncate text-slate-700 dark:text-slate-300", isBlurred && "blur-sm select-none")}>
                                                            {student.name}
                                                        </h3>
                                                        {student.expulsions > 0 && (
                                                            <ShieldAlert className="w-2 h-2 text-red-500 flex-shrink-0" />
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className="text-[9px] text-slate-400 dark:text-slate-500 w-6 text-right">
                                                            {Math.round(student.progress)}%
                                                        </div>
                                                        <div className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 w-8 text-right">
                                                            {student.score.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
            }

            {/* Screensaver Overlay */}
            {
                isScreensaverActive && (
                    <div
                        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-none transition-opacity duration-1000"
                        onClick={() => setIsScreensaverActive(false)}
                    >
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {/* Moving particles or subtle gradients could go here to prevent burn-in */}
                            <div className="w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl absolute animate-bounce" style={{ top: '20%', left: '20%', animationDuration: '15s' }}></div>
                            <div className="w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl absolute animate-pulse" style={{ bottom: '10%', right: '10%', animationDuration: '20s' }}></div>
                        </div>

                        <div className="relative z-10 text-center animate-pulse duration-1000">
                            <MonitorPlay className="w-24 h-24 text-slate-700 mx-auto mb-6 opacity-30" />
                            <h2 className="text-3xl font-light text-slate-500 tracking-widest uppercase">
                                Evaluación en Curso
                            </h2>

                            <div className="flex gap-16 mt-12 pt-12 border-t border-slate-800 justify-center">
                                {topStudent && (
                                    <div className="text-center">
                                        <p className="text-sm text-yellow-600/50 uppercase tracking-widest mb-3 font-bold">1er Lugar Actual</p>
                                        <p className="text-3xl text-yellow-500 opacity-80 font-medium">🏆 {topStudent.name}</p>
                                    </div>
                                )}

                                {validMostExpelled && validMostExpelled.id !== topStudent?.id && (
                                    <div className="text-center border-l border-slate-800 pl-16">
                                        <p className="text-sm text-red-600/50 uppercase tracking-widest mb-3 font-bold flex items-center justify-center gap-2">
                                            <ShieldAlert className="w-4 h-4" />
                                            Más Expulsiones
                                        </p>
                                        <p className="text-3xl text-red-500/80 font-medium">{validMostExpelled.name} ({validMostExpelled.expulsions})</p>
                                    </div>
                                )}
                            </div>

                            <p className="mt-16 text-sm text-slate-600">Actualizando posiciones en vivo...</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
