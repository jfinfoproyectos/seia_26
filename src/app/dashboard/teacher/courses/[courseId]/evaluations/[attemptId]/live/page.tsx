import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { evaluationService } from "@/services/evaluationService";
import { LiveLeaderboard } from "./LiveLeaderboard";
import prisma from "@/lib/prisma";

export default async function LiveEvaluationPage(
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
        select: { teacherId: true, title: true }
    });

    if (course?.teacherId !== session.user.id) {
        notFound();
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <LiveLeaderboard
                attemptId={attemptId}
                courseId={courseId}
                evaluationTitle={attempt.evaluation.title}
                courseTitle={course?.title || "Curso"}
            />
        </div>
    );
}
