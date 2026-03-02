import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { evaluationService } from "@/services/evaluationService";
import { QuestionManager } from "@/features/teacher/QuestionManager";

export default async function EvaluationDetailsPage({
    params,
}: {
    params: Promise<{ evaluationId: string }>;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== "teacher") {
        redirect("/login");
    }

    const resolvedParams = await params;

    try {
        const evaluation = await evaluationService.getEvaluationWithQuestions(
            resolvedParams.evaluationId,
            session.user.id
        );

        if (!evaluation) {
            return notFound();
        }

        return (
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                <QuestionManager evaluation={evaluation} />
            </div>
        );
    } catch (error) {
        return notFound();
    }
}
