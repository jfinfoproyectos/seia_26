"use server";

import { courseService } from "@/services/courseService";

export async function getCourseTitle(courseId: string): Promise<string | null> {
    try {
        const course = await courseService.getCourseById(courseId);
        return course?.title || null;
    } catch (error) {
        console.error("Error fetching course title:", error);
        return null;
    }
}

export async function getEvaluationAttemptTitle(attemptId: string): Promise<string | null> {
    try {
        const { default: prisma } = await import("@/lib/prisma");
        const attempt = await prisma.evaluationAttempt.findUnique({
            where: { id: attemptId },
            include: { evaluation: { select: { title: true } } }
        });
        return attempt?.evaluation.title || null;
    } catch (error) {
        console.error("Error fetching evaluation attempt title:", error);
        return null;
    }
}

export async function getEvaluationSubmissionTitle(submissionId: string): Promise<string | null> {
    try {
        const { default: prisma } = await import("@/lib/prisma");
        const submission = await prisma.evaluationSubmission.findUnique({
            where: { id: submissionId },
            include: { user: { select: { name: true } } }
        });
        return submission ? `Entrega de ${submission.user.name}` : null;
    } catch (error) {
        console.error("Error fetching evaluation submission title:", error);
        return null;
    }
}
