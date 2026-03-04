"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { evaluationService } from "@/services/evaluationService";
import prisma from "@/lib/prisma";

export async function getLiveLeaderboardData(attemptId: string) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || session.user.role !== 'teacher') {
        throw new Error("Unauthorized");
    }

    // Verify teacher owns the course or has access
    const attempt = await evaluationService.getAttemptWithQuestions(attemptId);
    if (!attempt || !attempt.courseId) {
        throw new Error("Attempt or Course not found");
    }

    const course = await prisma.course.findUnique({
        where: { id: attempt.courseId },
        select: { teacherId: true }
    });

    if (!course || !course.teacherId || course.teacherId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    const submissions = await evaluationService.getSubmissionsByAttempt(attemptId);

    // Calculate progress and score
    const totalQuestions = attempt.evaluation.questions?.length || 0;

    const leaderboard = submissions.map(sub => {
        const answersCount = sub._count?.answersList || 0;
        const progress = totalQuestions > 0 ? (answersCount / totalQuestions) * 100 : 0;

        return {
            id: sub.id,
            userId: sub.user.id,
            name: sub.user.name,
            score: Number(sub.score || 0),
            answersCount,
            totalQuestions,
            progress,
            submittedAt: sub.submittedAt,
            expulsions: sub.expulsions
        };
    }).sort((a, b) => {
        // Sort by score descending, then by progress descending, then by submittedAt ascending
        if (b.score !== a.score) return b.score - a.score;
        if (b.progress !== a.progress) return b.progress - a.progress;

        // If one is submitted and the other is not, submitted wins (or maybe not? time matters)
        // Usually, the one who submitted earlier is better in a tie
        if (a.submittedAt && b.submittedAt) {
            return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        if (a.submittedAt) return -1;
        if (b.submittedAt) return 1;

        return 0;
    });

    return leaderboard;
}
