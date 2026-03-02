import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { evaluationService } from "@/services/evaluationService";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { FeedbackViewer } from "@/features/student/FeedbackViewer";

import prisma from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "settings" },
        select: { appTitle: true }
    });
    const appTitle = settings?.appTitle || "SmartClass";

    return {
        title: `Detalle de Entrega | ${appTitle}`,
        description: 'Ver detalles de una entrega de evaluación',
    };
}

export default async function SubmissionDetailsPage(
    props: {
        params: Promise<{ courseId: string; attemptId: string; submissionId: string }>
    }
) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || session.user.role !== 'teacher') {
        notFound();
    }

    const { courseId, attemptId, submissionId } = params;

    const submission = await evaluationService.getSubmissionDetails(submissionId);
    if (!submission || submission.attemptId !== attemptId) {
        notFound();
    }

    const { user, attempt, answersList } = submission;
    const evaluation = attempt.evaluation;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
                <Link href={`/dashboard/teacher/courses/${courseId}/evaluations/${attemptId}`}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-xl font-semibold">Entrega de {user.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {user.email} &bull; Evaluación: {evaluation.title}
                    </p>
                </div>
            </div>

            {/* Resumen Full Width superior */}
            <div className="rounded-md border bg-card p-6 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Resumen de la Entrega</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Estado:</span>
                        <span className="font-medium">{submission.submittedAt ? 'Enviado' : 'En progreso'}</span>
                    </div>
                    {submission.submittedAt && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Fecha de envío:</span>
                            <span className="font-medium">{format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Nota Acumulada:</span>
                        <span className="font-bold text-primary text-base">{submission.score !== null ? Number(submission.score).toFixed(2) : "0.00"} / 5.0</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Respuestas:</span>
                        <span className="font-medium">{answersList.length} / {evaluation.questions.length}</span>
                    </div>
                </div>
            </div>

            {/* Respuestas */}
            <div className="space-y-6">
                <h3 className="font-semibold text-lg border-b pb-2">Respuestas del Estudiante</h3>
                {evaluation.questions.length === 0 ? (
                    <p className="text-muted-foreground">No hay preguntas en esta evaluación.</p>
                ) : (
                    <div className="space-y-6">
                        {evaluation.questions.map((question, index) => {
                            const answer = answersList.find(a => a.questionId === question.id);
                            return (
                                <div key={question.id} className="rounded-md border bg-card overflow-hidden">
                                    <div className="bg-muted p-4 border-b">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-base">Pregunta {index + 1}</h4>
                                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-background text-muted-foreground uppercase">{question.type}</span>
                                        </div>
                                        <div className="text-sm">
                                            <FeedbackViewer feedback={question.text} />
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {answer ? (
                                            <>
                                                <div>
                                                    <span className="text-sm font-semibold text-muted-foreground mb-3 block">Respuesta del estudiante:</span>
                                                    <div className="bg-background border p-4 rounded-md text-sm">
                                                        <FeedbackViewer feedback={answer.answer} />
                                                    </div>
                                                </div>
                                                {answer.aiFeedback && (
                                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md border border-blue-100 dark:border-blue-900 mt-4">
                                                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 block">Feedback Automático (IA):</span>
                                                        <div className="text-sm space-y-3">
                                                            {Array.isArray(answer.aiFeedback) ? (
                                                                (answer.aiFeedback as any[]).map((feedbackItem: any, i: number) => (
                                                                    <div key={i} className="border-t border-blue-100 dark:border-blue-900/50 pt-3 first:border-0 first:pt-0">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            {feedbackItem.isCorrect ? (
                                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                            ) : (
                                                                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                                                            )}
                                                                            <span className="font-medium text-xs">Intento {feedbackItem.attempt} - Nota: {feedbackItem.score}</span>
                                                                        </div>
                                                                        <div className="text-muted-foreground">
                                                                            <FeedbackViewer feedback={feedbackItem.feedback} />
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-muted-foreground">
                                                                    <FeedbackViewer feedback={(answer.aiFeedback as any).feedback || JSON.stringify(answer.aiFeedback)} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex justify-end text-sm mt-4 pt-4 border-t">
                                                    <span className="font-semibold bg-secondary/50 px-3 py-1.5 rounded-md text-primary">
                                                        Puntuación obtenida: {answer.score !== null ? Number(answer.score).toFixed(2) : "0.00"}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-3 bg-muted/20 rounded-md">
                                                <AlertCircle className="h-8 w-8 opacity-20" />
                                                <p>El estudiante no respondió esta pregunta o está en progreso.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
