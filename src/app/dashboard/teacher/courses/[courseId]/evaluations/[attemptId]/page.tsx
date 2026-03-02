import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { evaluationService } from "@/services/evaluationService";
import { SubmissionsManager } from "./SubmissionsManager";

import prisma from "@/lib/prisma";

export async function generateMetadata() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "settings" },
        select: { appTitle: true }
    });
    const appTitle = settings?.appTitle || "SmartClass";

    return {
        title: `Monitor de Entregas | ${appTitle}`,
        description: 'Gestor de entregas de evaluaciones estudiantiles',
    };
}

export default async function EvaluationSubmissionsPage(
    props: {
        params: Promise<{ courseId: string; attemptId: string }>
    }
) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || session.user.role !== 'teacher') {
        notFound();
    }

    const courseId = params.courseId;
    const attemptId = params.attemptId;

    const attempt = await evaluationService.getAttemptWithQuestions(attemptId);
    if (!attempt) {
        notFound();
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            teacher: {
                select: { name: true }
            }
        }
    });

    const settings = await prisma.systemSettings.findUnique({
        where: { id: "settings" },
        select: { appTitle: true }
    });

    // Load submissions
    const submissions = await evaluationService.getSubmissionsByAttempt(attemptId);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Entregas Estudiantiles</h1>
                <p className="text-muted-foreground mt-2">
                    Supervisa y administra los resultados de los estudiantes para la evaluación asignada.
                </p>
            </div>

            <SubmissionsManager
                courseId={courseId}
                attempt={attempt}
                submissions={submissions}
                courseName={course?.title || "Curso"}
                teacherName={course?.teacher?.name || "Docente"}
                appTitle={settings?.appTitle || "SmartClass"}
            />
        </div>
    );
}
