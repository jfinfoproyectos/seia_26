"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { formatDateTime } from "@/lib/dateUtils";
import { Trash2, AlertCircle, ArrowLeft, Eye, ShieldAlert, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { deleteEvaluationSubmissionAction } from "@/app/actions";
import dynamic from "next/dynamic";

const DownloadReportButton = dynamic(
    () => import("@/features/teacher/DownloadReportButton").then((mod) => mod.DownloadReportButton),
    { ssr: false }
);

const EvaluationStats = dynamic(
    () => import("@/features/teacher/EvaluationStats").then((mod) => mod.EvaluationStats),
    { ssr: false }
);

interface SubmissionsManagerProps {
    courseId: string;
    attempt: any;
    submissions: any[];
    courseName: string;
    teacherName: string;
    appTitle: string;
}

export function SubmissionsManager({
    courseId,
    attempt,
    submissions,
    courseName,
    teacherName,
    appTitle
}: SubmissionsManagerProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
                <Link href={`/dashboard/teacher/courses/${courseId}`}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-xl font-semibold">{attempt.evaluation.title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {formatDateTime(attempt.startTime)} - {formatDateTime(attempt.endTime)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isMounted && submissions.length > 0 && (
                        <DownloadReportButton
                            appTitle={appTitle}
                            courseName={courseName}
                            teacherName={teacherName}
                            evaluationTitle={attempt.evaluation.title}
                            startTime={attempt.startTime}
                            endTime={attempt.endTime}
                            submissions={submissions}
                        />
                    )}

                    {submissions.filter(s => s.submittedAt).length > 0 && (
                        <div className="flex flex-col items-end px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Nota Definitiva (Promedio)</span>
                            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                                {(submissions.filter(s => s.submittedAt).reduce((acc, s) => acc + (s.score || 0), 0) / submissions.filter(s => s.submittedAt).length).toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Respuestas</TableHead>
                            <TableHead>Nota</TableHead>
                            <TableHead>Expulsiones</TableHead>
                            <TableHead>Comodines</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <AlertCircle className="h-8 w-8 opacity-20" />
                                        <p>No hay entregas registradas para esta evaluación todavía.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            submissions.map((sub: any) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{sub.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{sub.user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {sub.submittedAt ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Enviado</span>
                                                <span className="text-[10px] text-muted-foreground">{formatDateTime(sub.submittedAt, "dd/MM HH:mm")}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">En progreso</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {sub._count?.answersList || 0} / {attempt.evaluation.questions?.length || 0}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-bold">
                                            {sub.score !== null ? Number(sub.score).toFixed(2) : "0.00"}
                                        </span> / 5.0
                                    </TableCell>
                                    <TableCell>
                                        {sub.expulsions > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                                                <ShieldAlert className="w-3 h-3" />
                                                {sub.expulsions}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">0</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const wc: any = sub.wildcardsUsed || {};
                                            const hints = wc.aiHintsUsed || 0;
                                            const sc = wc.secondChanceUsed || 0;
                                            if (hints === 0 && sc === 0) return <span className="text-xs text-muted-foreground">—</span>;
                                            return (
                                                <div className="flex items-center gap-1.5">
                                                    {hints > 0 && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">💡 {hints}</span>}
                                                    {sc > 0 && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">🔄 {sc}</span>}
                                                </div>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/dashboard/teacher/courses/${courseId}/evaluations/${attempt.id}/submissions/${sub.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Ver Detalles"
                                                    className="text-muted-foreground hover:text-primary"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        title="Eliminar Entrega"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <form
                                                        action={async () => {
                                                            setIsDeleting(true);
                                                            try {
                                                                await deleteEvaluationSubmissionAction(sub.id, courseId);
                                                            } finally {
                                                                setIsDeleting(false);
                                                            }
                                                        }}
                                                    >
                                                        <DialogHeader>
                                                            <DialogTitle>Eliminar Entrega de {sub.user.name}</DialogTitle>
                                                            <DialogDescription>
                                                                ¿Estás completamente seguro de eliminar esta entrega? Esta acción no se puede deshacer y el estudiante perderá todo su progreso y calificaciones, permitiéndole presentarla desde cero.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter className="mt-4">
                                                            <Button type="submit" variant="destructive" disabled={isDeleting}>
                                                                {isDeleting ? "Eliminando..." : "Sí, eliminar entrega"}
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Statistics section */}
            {isMounted && submissions.length > 0 && (
                <EvaluationStats
                    submissions={submissions}
                    totalQuestions={attempt.evaluation.questions?.length || 0}
                    questions={attempt.evaluation.questions || []}
                    evaluationId={attempt.evaluationId}
                    attemptId={attempt.id}
                    courseName={courseName}
                    teacherName={teacherName}
                />
            )}
        </div>
    );
}
