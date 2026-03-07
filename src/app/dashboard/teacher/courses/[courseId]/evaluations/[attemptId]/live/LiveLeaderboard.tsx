"use client";

import { useState, useEffect, useCallback } from "react";
import { getLiveLeaderboardData } from "./actions";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, ArrowLeft, Loader2, AlertTriangle, MonitorPlay, Maximize, Minimize } from "lucide-react";
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
    endTime: Date;
}

export function LiveLeaderboard({ attemptId, courseId, evaluationTitle, courseTitle, endTime }: LiveLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LiveLeaderboardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isScreensaverActive, setIsScreensaverActive] = useState(false);

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
                console.error(`Error attempting to enable fullscreen: ${err}`);
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

    // Screensaver auto-cycle timer
    useEffect(() => {
        const screensaverInterval = setInterval(() => {
            setIsScreensaverActive(true);
            setTimeout(() => {
                setIsScreensaverActive(false);
            }, 10000);
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

    // Timer logic
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("00:00:00");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            let timeString = "";
            if (hours > 0) timeString += `${hours.toString().padStart(2, '0')}:`;
            timeString += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            setTimeLeft(timeString);
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        return () => clearInterval(timerInterval);
    }, [endTime]);

    const topStudent = leaderboard.length > 0 ? leaderboard[0] : null;
    const podiumStudents = leaderboard.slice(0, 3);
    const next7Students = leaderboard.slice(3, 10);

    return (
        <div className="flex flex-col h-screen overflow-hidden py-4 lg:py-6 px-6 lg:px-12 xl:px-24 gap-4 lg:gap-6 animate-in fade-in duration-500 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <Link href={`/dashboard/teacher/courses/${courseId}/evaluations/${attemptId}`}>
                        <Button variant="outline" size="icon" className="h-12 w-12">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                            <MonitorPlay className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                            Panel en Vivo
                        </h1>
                        <p className="text-muted-foreground text-base lg:text-lg">
                            {courseTitle} - <span className="font-semibold text-foreground">{evaluationTitle}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 lg:space-x-6 bg-background p-3 lg:p-4 flex-row rounded-xl border shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="mr-1 lg:mr-2"
                        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        {isFullscreen ? <Minimize className="h-5 w-5 lg:h-6 lg:w-6" /> : <Maximize className="h-5 w-5 lg:h-6 lg:w-6" />}
                    </Button>
                    <div className="flex items-center space-x-4 border-l pl-4 lg:pl-6 border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col items-end">
                            <span className="text-xs lg:text-sm text-muted-foreground uppercase font-bold tracking-wider">Tiempo Restante</span>
                            <span className={cn("font-mono font-black text-3xl lg:text-4xl leading-none", timeLeft === "00:00:00" ? "text-destructive" : "text-amber-500")} suppressHydrationWarning>
                                {timeLeft}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm border-l pl-4 lg:pl-6 border-slate-200 dark:border-slate-800">
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        )}
                        <span className="font-medium text-muted-foreground text-lg" suppressHydrationWarning>
                            Actualizado: {lastUpdate.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-center space-x-2 flex-shrink-0 text-lg">
                    <AlertTriangle className="w-6 h-6" />
                    <span>{error}</span>
                </div>
            )}

            {!isLoading && leaderboard.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center flex-1 border-2 border-dashed rounded-xl">
                    <Trophy className="w-24 h-24 text-muted-foreground/30 mb-6" />
                    <p className="text-3xl text-muted-foreground font-medium">Aún no hay participantes en esta evaluación.</p>
                </div>
            )}

            {leaderboard.length > 0 && (
                <div className="flex flex-1 min-h-0 gap-8 lg:gap-12 pb-2">
                    {/* Podium (Top 3) */}
                    <div className="flex-1 flex items-end justify-center gap-2 lg:gap-6 pb-2 relative min-h-0 w-full overflow-hidden shrink">
                        {/* Rank 2 */}
                        {podiumStudents.length > 1 && (
                            <div className="w-[30%] max-w-sm flex flex-col items-center animate-in slide-in-from-bottom duration-700 z-10 shrink">
                                <div className="text-center mb-2 lg:mb-4 w-full px-1 lg:px-2">
                                    <h3 className="text-xl lg:text-3xl font-bold text-slate-700 dark:text-slate-300 text-center break-words w-full">{podiumStudents[1].name}</h3>
                                    <p className="text-3xl lg:text-5xl font-black text-slate-500 mt-1 lg:mt-2">{podiumStudents[1].score.toFixed(2)}</p>
                                    {podiumStudents[1].submittedAt ? (
                                        <span className="inline-block mt-1 lg:mt-2 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full bg-green-500/20 text-green-700 font-bold text-xs lg:text-base border border-green-500/30">Terminado</span>
                                    ) : (
                                        <span className="inline-block mt-1 lg:mt-2 px-2 lg:px-3 py-0.5 lg:py-1 text-slate-500 font-medium text-xs lg:text-base border border-transparent">{Math.round(podiumStudents[1].progress)}% completado</span>
                                    )}
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-2xl border-t-[6px] lg:border-t-8 border-slate-300 dark:border-slate-700 shadow-xl flex justify-center pt-4 lg:pt-6 relative overflow-hidden" style={{ height: '28vh', minHeight: '120px' }}>
                                    <span className="text-[5rem] lg:text-[8rem] font-black text-slate-300 dark:text-slate-700 opacity-50 leading-none">2</span>
                                </div>
                            </div>
                        )}

                        {/* Rank 1 */}
                        {podiumStudents.length > 0 && (
                            <div className="w-[35%] max-w-sm flex flex-col items-center animate-in slide-in-from-bottom duration-500 z-20 shrink">
                                <div className="text-center mb-2 lg:mb-4 w-full px-1 lg:px-2 flex flex-col items-center min-h-0">
                                    <div className="relative inline-block mb-1 lg:mb-2 flex-shrink-0">
                                        <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 rounded-full"></div>
                                        <Trophy className="w-12 h-12 lg:w-20 lg:h-20 text-yellow-500 drop-shadow-lg relative z-10 mx-auto" />
                                    </div>
                                    <div className="flex items-center justify-center flex-shrink-0">
                                        <div className="inline-flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-[10px] lg:text-sm font-bold mb-1 lg:mb-2">
                                            <Star className="w-3 h-3 lg:w-4 lg:h-4 fill-current" />
                                            1er LUGAR
                                            <Star className="w-3 h-3 lg:w-4 lg:h-4 fill-current" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl lg:text-4xl font-black text-slate-800 dark:text-slate-100 text-center break-words w-full flex-shrink-0">{podiumStudents[0].name}</h3>
                                    <p className="text-4xl lg:text-6xl font-black text-yellow-600 dark:text-yellow-500 mt-1 lg:mt-2 drop-shadow-md flex-shrink-0">{podiumStudents[0].score.toFixed(2)}</p>
                                    {podiumStudents[0].submittedAt ? (
                                        <span className="inline-block mt-1 lg:mt-2 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-green-500/20 text-green-700 font-bold text-xs lg:text-base border border-green-500/30 flex-shrink-0">Terminado</span>
                                    ) : (
                                        <span className="inline-block mt-1 lg:mt-2 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-blue-500/20 text-blue-700 font-bold text-xs lg:text-base border border-blue-500/30 animate-pulse flex-shrink-0">{Math.round(podiumStudents[0].progress)}% completado</span>
                                    )}
                                </div>
                                <div className="w-full bg-gradient-to-t from-yellow-500 to-yellow-300 dark:from-yellow-900 dark:to-yellow-700 rounded-t-2xl border-t-[6px] lg:border-t-8 border-yellow-200 dark:border-yellow-600 shadow-2xl flex justify-center pt-6 lg:pt-8 relative overflow-hidden" style={{ height: '38vh', minHeight: '150px' }}>
                                    <span className="text-[6rem] lg:text-[10rem] font-black text-yellow-700/30 dark:text-yellow-500/30 leading-none">1</span>
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
                                </div>
                            </div>
                        )}

                        {/* Rank 3 */}
                        {podiumStudents.length > 2 && (
                            <div className="w-[30%] max-w-sm flex flex-col items-center animate-in slide-in-from-bottom duration-1000 z-10 shrink">
                                <div className="text-center mb-2 lg:mb-4 w-full px-1 lg:px-2">
                                    <h3 className="text-xl lg:text-3xl font-bold text-slate-700 dark:text-slate-300 text-center break-words w-full">{podiumStudents[2].name}</h3>
                                    <p className="text-3xl lg:text-5xl font-black text-amber-600 dark:text-amber-500 mt-1 lg:mt-2">{podiumStudents[2].score.toFixed(2)}</p>
                                    {podiumStudents[2].submittedAt ? (
                                        <span className="inline-block mt-1 lg:mt-2 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full bg-green-500/20 text-green-700 font-bold text-xs lg:text-base border border-green-500/30">Terminado</span>
                                    ) : (
                                        <span className="inline-block mt-1 lg:mt-2 px-2 lg:px-3 py-0.5 lg:py-1 text-slate-500 font-medium text-xs lg:text-base border border-transparent">{Math.round(podiumStudents[2].progress)}% completado</span>
                                    )}
                                </div>
                                <div className="w-full bg-amber-100 dark:bg-amber-900/40 rounded-t-2xl border-t-[6px] lg:border-t-8 border-amber-300 dark:border-amber-700 shadow-xl flex justify-center pt-4 lg:pt-6 relative overflow-hidden" style={{ height: '18vh', minHeight: '80px' }}>
                                    <span className="text-[5rem] lg:text-[8rem] font-black text-amber-600/20 dark:text-amber-500/20 leading-none">3</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Siguientes 7 Puestos */}
                    <div className="w-[35%] lg:w-[30%] min-w-[320px] lg:min-w-[380px] max-w-2xl flex-shrink-0 flex flex-col min-h-0 bg-card border rounded-3xl shadow-2xl z-20 overflow-hidden h-full">
                        <div className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md border-b py-3 md:py-4 px-4 md:px-6 flex-shrink-0 flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <Star className="w-4 h-4 md:w-5 md:h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Siguientes Puestos</h2>
                                <p className="text-xs md:text-sm text-muted-foreground font-medium">Top 4 al 10 en tiempo real</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col justify-evenly p-2 md:p-3 bg-gradient-to-b from-slate-50 to-white dark:from-background dark:to-slate-900/50 min-h-0">
                            {next7Students.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-xl font-medium h-full flex items-center justify-center flex-col gap-4">
                                    <Trophy className="w-16 h-16 opacity-20" />
                                    No hay más participantes.
                                </div>
                            ) : (
                                next7Students.map((student, index) => {
                                    const rank = index + 4;
                                    return (
                                        <div key={student.id} className="flex-1 max-h-[75px] min-h-[45px] flex items-center gap-2 lg:gap-4 px-3 lg:px-4 py-1.5 lg:py-2 mx-1 my-0.5 lg:my-1 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all shrink">
                                            <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 font-black text-slate-600 dark:text-slate-400 text-base lg:text-xl border-2 border-slate-200 dark:border-slate-700">
                                                {rank}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg lg:text-xl truncate text-slate-800 dark:text-slate-100 leading-tight mb-1">
                                                    {student.name}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs lg:text-sm">
                                                    <Progress value={student.progress} className="h-2 w-16 lg:w-24 bg-slate-200 dark:bg-slate-700" />
                                                    {student.submittedAt ? (
                                                        <span className="font-bold text-green-600 dark:text-green-500">Terminado</span>
                                                    ) : (
                                                        <span className="font-medium text-slate-500">{student.answersCount}/{student.totalQuestions} resp.</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 pl-2">
                                                <div className="text-2xl lg:text-3xl font-black font-mono text-primary/90">
                                                    {student.score.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Screensaver Overlay */}
            {isScreensaverActive && (
                <div
                    className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-none transition-opacity duration-1000"
                    onClick={() => setIsScreensaverActive(false)}
                >
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl absolute animate-bounce" style={{ top: '10%', left: '10%', animationDuration: '20s' }}></div>
                        <div className="w-[900px] h-[900px] bg-blue-500/10 rounded-full blur-3xl absolute animate-pulse" style={{ bottom: '-10%', right: '-10%', animationDuration: '25s' }}></div>
                    </div>

                    <div className="relative z-10 text-center animate-pulse duration-1000 flex flex-col items-center justify-center">
                        <MonitorPlay className="w-32 h-32 text-slate-700 mx-auto mb-8 opacity-30" />
                        <h2 className="text-4xl font-light text-slate-500 tracking-[0.2em] uppercase">
                            Evaluación en Curso
                        </h2>

                        <div className="text-6xl font-mono font-black text-amber-500/80 mt-12 mb-16 tracking-wider shadow-black drop-shadow-lg">
                            {timeLeft}
                        </div>

                        {topStudent && (
                            <div className="mt-8 pt-12 border-t border-slate-800 w-[600px]">
                                <p className="text-xl text-yellow-600/50 uppercase tracking-widest mb-4 font-bold">1er Lugar Actual</p>
                                <p className="text-5xl text-yellow-500 opacity-80 font-black tracking-tight flex items-center justify-center gap-4">
                                    <Trophy className="w-12 h-12" /> {topStudent.name}
                                </p>
                            </div>
                        )}

                        <p className="fixed bottom-12 text-lg text-slate-600 font-medium tracking-widest uppercase opacity-50">Posiciones en Vivo Actualizándose</p>
                    </div>
                </div>
            )}
        </div>
    );
}
