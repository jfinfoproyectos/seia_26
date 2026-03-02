"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { courseService } from "@/services/courseService";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { parseISOAsUTC, toUTCStartOfDay } from "@/lib/dateUtils";

async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

export async function createCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher" && session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const course = await courseService.createCourse({
        title,
        description,
        teacherId: session.user.id,
    });

    revalidatePath("/dashboard/teacher");
}

export async function cloneCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher" && session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const sourceCourseId = formData.get("sourceCourseId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const course = await courseService.cloneCourse(sourceCourseId, {
        title,
        description,
        teacherId: session.user.id,
    });

    revalidatePath("/dashboard/teacher");
}

export async function updateCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const courseId = formData.get("courseId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    await courseService.updateCourse(courseId, {
        title,
        description,
    });

    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/admin");
}

export async function deleteCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const courseId = formData.get("courseId") as string;
    const confirmText = formData.get("confirmText") as string;

    if (confirmText !== "ELIMINAR") {
        throw new Error("Confirmación incorrecta");
    }

    // Get course info before deletion
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
    });

    // TODO: Add check if teacher owns the course if not admin
    await courseService.deleteCourse(courseId);

    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/admin");
}



export async function addStudentToCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const userId = formData.get("userId") as string;
    const courseId = formData.get("courseId") as string;

    if (!userId || !courseId) {
        throw new Error("Missing required fields");
    }

    const enrollment = await courseService.enrollStudent(userId, courseId, 'APPROVED');

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function searchStudentsAction(query: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    return await courseService.searchStudents(query);
}

export async function removeStudentFromCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const userId = formData.get("userId") as string;
    const courseId = formData.get("courseId") as string;

    if (!userId || !courseId) {
        throw new Error("Missing required fields");
    }

    // Get info before removal for audit log
    const [course, student] = await Promise.all([
        prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    ]);

    await courseService.removeStudentFromCourse(userId, courseId);

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function toggleCourseRegistrationAction(courseId: string) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    await courseService.toggleCourseRegistration(courseId);
    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/student");
}

export async function updateRegistrationSettingsAction(formData: FormData) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const courseId = formData.get("courseId") as string;
    const isOpen = formData.get("isOpen") === "true";
    const deadlineStr = formData.get("deadline") as string;

    await courseService.updateCourseRegistration(
        courseId,
        isOpen,
        deadlineStr ? parseISOAsUTC(deadlineStr) : undefined
    );

    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/student");
}

export async function enrollStudentAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const enrollment = await courseService.enrollStudent(session.user.id, courseId);

    revalidatePath("/dashboard/student");
}





// Helper function to normalize URLs for comparison






export async function getStudentCourseEnrollmentAction(userId: string, courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    return await courseService.getStudentCourseEnrollment(userId, courseId);
}

export async function getPendingEnrollmentsAction() {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    return await courseService.getPendingEnrollments(session.user.id);
}

export async function approveEnrollmentAction(enrollmentId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    await courseService.updateEnrollmentStatus(enrollmentId, 'APPROVED');
    revalidatePath("/dashboard/teacher");
}

export async function rejectEnrollmentAction(enrollmentId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    await courseService.updateEnrollmentStatus(enrollmentId, 'REJECTED');
    revalidatePath("/dashboard/teacher");
}

export async function updateStudentStatusAction(enrollmentId: string, status: 'APPROVED' | 'REJECTED') {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    await courseService.updateEnrollmentStatus(enrollmentId, status);
    revalidatePath("/dashboard/teacher/courses/[courseId]", "page");
}



export async function improveFeedbackAction(text: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { improveFeedback } = await import("@/services/gemini/feedbackService");
    return await improveFeedback(text, session.user.id);
}

export async function getProfileAction() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { profileService } = await import("@/services/profileService");
    return await profileService.getProfile(session.user.id);
}

export async function updateProfileAction(formData: FormData) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const identificacion = formData.get("identificacion") as string;
    const nombres = formData.get("nombres") as string;
    const apellido = formData.get("apellido") as string;
    const telefono = formData.get("telefono") as string | null;
    const geminiApiKey = formData.get("geminiApiKey") as string | null;
    const dataProcessingConsent = formData.get("dataProcessingConsent") === "true";


    if (geminiApiKey) {
        const { encrypt } = await import("@/lib/encryption");
        const encryptedKey = await encrypt(geminiApiKey);


        await prisma.user.update({
            where: { id: session.user.id },
            data: { encryptedGeminiApiKey: encryptedKey }
        });
    }

    const { profileService } = await import("@/services/profileService");
    await profileService.upsertProfile(session.user.id, {
        identificacion,
        nombres,
        apellido,
        telefono: telefono || undefined,
        dataProcessingConsent,
        dataProcessingConsentDate: dataProcessingConsent ? new Date() : undefined
    });

    revalidatePath("/");
}


export async function getGeminiApiKeyModeAction() {
    return {
        mode: "GLOBAL",
        hasUserKey: false
    };
}



export async function getCourseStudentsAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { courseService } = await import("@/services/courseService");
    return await courseService.getCourseStudents(courseId);
}



// Remark Actions
export async function createRemarkAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const type = formData.get("type") as "ATTENTION" | "COMMENDATION";
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const courseId = formData.get("courseId") as string;
    const userId = formData.get("userId") as string;

    console.log("SERVER ACTION: createRemarkAction received:", { type, title, description, courseId, userId });

    const { remarkService } = await import("@/services/remarkService");
    const remark = await remarkService.createRemark({
        type,
        title,
        description,
        courseId,
        userId,
        teacherId: session.user.id,
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function getStudentRemarksAction(courseId: string, userId: string) {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Allow teacher to view any student, or student to view their own
    if (session.user.role === "student" && session.user.id !== userId) {
        throw new Error("Unauthorized");
    }

    const { remarkService } = await import("@/services/remarkService");
    return await remarkService.getStudentRemarks(courseId, userId);
}

export async function updateRemarkAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const remarkId = formData.get("remarkId") as string;
    const type = formData.get("type") as "ATTENTION" | "COMMENDATION" | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const courseId = formData.get("courseId") as string;

    const { remarkService } = await import("@/services/remarkService");
    await remarkService.updateRemark(remarkId, {
        ...(type && { type }),
        ...(title && { title }),
        ...(description && { description }),
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function deleteRemarkAction(remarkId: string, courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    // Get remark info before deletion
    const remark = await prisma.remark.findUnique({
        where: { id: remarkId },
        select: { title: true, type: true }
    });

    const { remarkService } = await import("@/services/remarkService");
    await remarkService.deleteRemark(remarkId);

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function getCalendarEventsAction(studentId?: string) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { courseService } = await import("@/services/courseService");
    return await courseService.getCalendarEvents(
        session.user.id,
        session.user.role || "student",
        studentId
    );
}

export async function getStudentsForTeacherAction() {
    const session = await getSession();
    if (!session?.user || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { courseService } = await import("@/services/courseService");
    return await courseService.getStudentsForTeacher(session.user.id);
}

export async function getScheduleViewAction() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role === "teacher") {
        return await courseService.getTeacherCourses(userId);
    } else {
        return await courseService.getStudentCourses(userId);
    }
}








export async function getCourseGradesReportAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") throw new Error("Unauthorized");
    return await courseService.getCourseGradesReport(courseId);
}

export async function getMultiCourseGradesReportAction(courseIds: string[]) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") throw new Error("Unauthorized");

    const reports = [];
    for (const id of courseIds) {
        // Optimally this should be done in parallel or a single query, but reuse existing service for simplicity first
        // Check ownership/permissions first ideally, but getCourseGradesReport doesn't check ownership internally (relies on caller or simple findUnique)
        // We'll trust the ID is valid or service handles it. 
        // Better: ensure the teacher owns these courses.
        const course = await prisma.course.findUnique({ where: { id, teacherId: session.user.id }, select: { title: true } });
        if (course) {
            const data = await courseService.getCourseGradesReport(id);
            reports.push({
                name: course.title.substring(0, 30), // Excel sheet name limit
                data: data
            });
        }
    }
    return reports;
}






export async function getCourseCompleteDataAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    // Get course info
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            enrollments: {
                where: { status: "APPROVED" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    user: { name: 'asc' }
                }
            },
            remarks: {
                orderBy: { date: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    });

    if (!course) {
        throw new Error("Course not found");
    }

    // 1. REMARKS DATA
    const remarksData = course.remarks.map(remark => ({
        "Estudiante": remark.user.name || "Sin nombre",
        "Email": remark.user.email,
        "Fecha": new Date(remark.date).toLocaleDateString('es-ES'),
        "Tipo": remark.type === 'COMMENDATION' ? 'Felicitación' : 'Llamado de Atención',
        "Título": remark.title,
        "Descripción": remark.description
    }));

    // 2. STATISTICS DATA
    const totalStudents = course.enrollments.length;

    // Count remarks
    const positiveRemarks = course.remarks.filter(r => r.type === 'COMMENDATION').length;
    const negativeRemarks = course.remarks.filter(r => r.type === 'ATTENTION').length;

    const statisticsData = [
        { "Métrica": "Total Estudiantes", "Valor": totalStudents.toString() },
        { "Métrica": "Observaciones Positivas", "Valor": positiveRemarks.toString() },
        { "Métrica": "Observaciones Negativas", "Valor": negativeRemarks.toString() }
    ];

    // 3. GRADES DATA
    const gradesData = await courseService.getCourseGradesReport(courseId);

    return {
        grades: gradesData,
        remarks: remarksData,
        statistics: statisticsData
    };
}

export async function getUnreadNotificationCountAction() {
    return 0; // Placeholder until notifications are implemented
}

// Evaluation Actions
export async function createEvaluationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const helpUrl = formData.get("helpUrl") as string;
    const maxSupportAttemptsStr = formData.get("maxSupportAttempts") as string;
    const aiSupportDelaySecondsStr = formData.get("aiSupportDelaySeconds") as string;
    const expulsionPenaltyStr = formData.get("expulsionPenalty") as string;
    const wildcardAiHintsStr = formData.get("wildcardAiHints") as string;
    const wildcardSecondChanceStr = formData.get("wildcardSecondChance") as string;

    const maxSupportAttempts = maxSupportAttemptsStr ? parseInt(maxSupportAttemptsStr, 10) : 3;
    const aiSupportDelaySeconds = aiSupportDelaySecondsStr ? parseInt(aiSupportDelaySecondsStr, 10) : 60;
    const expulsionPenalty = expulsionPenaltyStr ? parseFloat(expulsionPenaltyStr) : 0;
    const wildcardAiHints = wildcardAiHintsStr ? parseInt(wildcardAiHintsStr, 10) : 0;
    const wildcardSecondChance = wildcardSecondChanceStr ? parseInt(wildcardSecondChanceStr, 10) : 0;

    const { evaluationService } = await import("@/services/evaluationService");

    await evaluationService.createEvaluation({
        title,
        description,
        helpUrl,
        authorId: session.user.id,
        maxSupportAttempts,
        aiSupportDelaySeconds,
        expulsionPenalty,
        wildcardAiHints,
        wildcardSecondChance
    });

    revalidatePath("/dashboard/teacher/evaluations");
}

export async function updateEvaluationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const evaluationId = formData.get("evaluationId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const helpUrl = formData.get("helpUrl") as string;
    const maxSupportAttemptsStr = formData.get("maxSupportAttempts") as string;
    const aiSupportDelaySecondsStr = formData.get("aiSupportDelaySeconds") as string;
    const expulsionPenaltyStr = formData.get("expulsionPenalty") as string;
    const wildcardAiHintsStr = formData.get("wildcardAiHints") as string;
    const wildcardSecondChanceStr = formData.get("wildcardSecondChance") as string;

    const maxSupportAttempts = maxSupportAttemptsStr ? parseInt(maxSupportAttemptsStr, 10) : undefined;
    const aiSupportDelaySeconds = aiSupportDelaySecondsStr ? parseInt(aiSupportDelaySecondsStr, 10) : undefined;
    const expulsionPenalty = expulsionPenaltyStr !== null && expulsionPenaltyStr !== "" ? parseFloat(expulsionPenaltyStr) : undefined;
    const wildcardAiHints = wildcardAiHintsStr !== null && wildcardAiHintsStr !== "" ? parseInt(wildcardAiHintsStr, 10) : undefined;
    const wildcardSecondChance = wildcardSecondChanceStr !== null && wildcardSecondChanceStr !== "" ? parseInt(wildcardSecondChanceStr, 10) : undefined;

    const { evaluationService } = await import("@/services/evaluationService");

    await evaluationService.updateEvaluation(evaluationId, session.user.id, {
        title: title || undefined,
        description: description || undefined,
        helpUrl: helpUrl || undefined,
        maxSupportAttempts,
        aiSupportDelaySeconds,
        expulsionPenalty,
        wildcardAiHints,
        wildcardSecondChance
    });

    revalidatePath("/dashboard/teacher/evaluations");
}

export async function registerExpulsionAction(submissionId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { default: prisma } = await import("@/lib/prisma");

    const submission = await prisma.evaluationSubmission.findUnique({
        where: { id: submissionId },
        include: {
            attempt: {
                include: {
                    evaluation: { select: { expulsionPenalty: true, questions: { select: { id: true } } } }
                }
            },
            answersList: { select: { score: true } }
        }
    });

    if (!submission || submission.userId !== session.user.id) {
        throw new Error("Unauthorized or submission not found");
    }

    // Increment expulsion count
    const newExpulsions = (submission.expulsions || 0) + 1;

    // Recalculate score with penalty deducted
    const expulsionPenalty = submission.attempt.evaluation.expulsionPenalty || 0;
    const totalQuestionsCount = submission.attempt.evaluation.questions.length || 1;
    const totalScoreSum = submission.answersList.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const rawScore = totalScoreSum / totalQuestionsCount;
    const penaltyTotal = newExpulsions * expulsionPenalty;
    const finalScore = Math.max(0, rawScore - penaltyTotal);

    await prisma.evaluationSubmission.update({
        where: { id: submissionId },
        data: {
            expulsions: newExpulsions,
            // Only update score if there is already a computed score
            ...(submission.score !== null ? { score: Number(finalScore.toFixed(2)) } : {})
        }
    });

    return { success: true, expulsions: newExpulsions };
}

export async function deleteEvaluationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const evaluationId = formData.get("evaluationId") as string;
    const confirmText = formData.get("confirmText") as string;

    if (confirmText !== "ELIMINAR") {
        throw new Error("Confirmación incorrecta");
    }

    const { evaluationService } = await import("@/services/evaluationService");
    await evaluationService.deleteEvaluation(evaluationId, session.user.id);

    revalidatePath("/dashboard/teacher/evaluations");
}

export async function createQuestionAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const evaluationId = formData.get("evaluationId") as string;
    const text = formData.get("text") as string;
    const type = formData.get("type") as string; // "Text" or "Code"
    const language = formData.get("language") as string;

    const { evaluationService } = await import("@/services/evaluationService");

    // Ownership check happens inside or we trust the teacher for now, 
    // but the DB won't let us modify if it's strictly enforced.
    // For now we trust the UI or we can check.
    const evaluation = await evaluationService.getEvaluationWithQuestions(evaluationId, session.user.id);
    if (!evaluation) {
        throw new Error("Evaluation not found");
    }

    await evaluationService.createQuestion({
        evaluationId,
        text,
        type,
        language: type === "Code" ? language : undefined
    });

    revalidatePath(`/dashboard/teacher/evaluations/${evaluationId}`);
}

export async function updateQuestionAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const questionId = formData.get("questionId") as string;
    const evaluationId = formData.get("evaluationId") as string;
    const text = formData.get("text") as string;
    const type = formData.get("type") as string;
    const language = formData.get("language") as string;

    const { evaluationService } = await import("@/services/evaluationService");

    await evaluationService.updateQuestion(questionId, evaluationId, session.user.id, {
        text,
        type,
        language: type === "Code" ? language : undefined
    });

    revalidatePath(`/dashboard/teacher/evaluations/${evaluationId}`);
}

export async function deleteQuestionAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const questionId = formData.get("questionId") as string;
    const evaluationId = formData.get("evaluationId") as string;
    const confirmText = formData.get("confirmText") as string;

    if (confirmText !== "ELIMINAR") {
        throw new Error("Confirmación incorrecta");
    }

    const { evaluationService } = await import("@/services/evaluationService");
    await evaluationService.deleteQuestion(questionId, evaluationId, session.user.id);

    revalidatePath(`/dashboard/teacher/evaluations/${evaluationId}`);
}

export async function assignEvaluationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const evaluationId = formData.get("evaluationId") as string;
    const courseId = formData.get("courseId") as string;
    const startTimeStr = formData.get("startTime") as string;
    const endTimeStr = formData.get("endTime") as string;

    if (!evaluationId || !courseId || !startTimeStr || !endTimeStr) {
        throw new Error("Faltan datos requeridos");
    }

    const { evaluationService } = await import("@/services/evaluationService");

    await evaluationService.assignEvaluationToCourse({
        evaluationId,
        courseId,
        startTime: new Date(startTimeStr),
        endTime: new Date(endTimeStr),
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function unassignEvaluationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const attemptId = formData.get("attemptId") as string;
    const courseId = formData.get("courseId") as string;

    const { evaluationService } = await import("@/services/evaluationService");

    await evaluationService.unassignEvaluationAttempt(attemptId);

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function updateEvaluationAssignmentAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const attemptId = formData.get("attemptId") as string;
    const evaluationId = formData.get("evaluationId") as string;
    const courseId = formData.get("courseId") as string;
    const startTimeStr = formData.get("startTime") as string;
    const endTimeStr = formData.get("endTime") as string;

    if (!attemptId || !courseId) {
        throw new Error("Faltan datos requeridos");
    }

    const { evaluationService } = await import("@/services/evaluationService");

    await evaluationService.updateEvaluationAssignment(attemptId, {
        evaluationId: evaluationId || undefined,
        startTime: startTimeStr ? new Date(startTimeStr) : undefined,
        endTime: endTimeStr ? new Date(endTimeStr) : undefined,
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

// ==========================================
// EVALUATION STUDENT ACTIONS
// ==========================================

export async function evaluateAnswerWithAIAction(submissionId: string, questionId: string, currentAnswer: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { default: prisma } = await import("@/lib/prisma");

    // 1. Fetch Question and Evaluation info for limits
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { evaluation: true }
    });

    if (!question) throw new Error("Question not found");
    const maxAttempts = question.evaluation.maxSupportAttempts;

    // 2. Fetch or Create the Answer Record
    let answerRecord = await prisma.evaluationAnswer.findFirst({
        where: { submissionId, questionId }
    });

    if (!answerRecord) {
        answerRecord = await prisma.evaluationAnswer.create({
            data: { submissionId, questionId, answer: currentAnswer }
        });
    }

    // 3. Check Limits
    if (answerRecord.supportAttempts >= maxAttempts) {
        throw new Error(`Has alcanzado el límite máximo de ${maxAttempts} ayudas de IA para esta pregunta.`);
    }

    // 4. Update Answer Text before evaluating
    if (answerRecord.answer !== currentAnswer) {
        answerRecord = await prisma.evaluationAnswer.update({
            where: { id: answerRecord.id },
            data: { answer: currentAnswer }
        });
    }

    // 5. Call Gemini Service
    const { evaluateStudentAnswer } = await import("@/services/gemini/evaluationAnalysisService");
    const aiResult = await evaluateStudentAnswer(question.text, question.type, currentAnswer);

    // 6. Push to Feedback History and determine Max Score
    let feedbackHistory: Array<{ attempt: number, feedback: string, score: number, isCorrect: boolean, requestedAt?: string }> = [];
    if (answerRecord.aiFeedback) {
        try {
            feedbackHistory = JSON.parse(answerRecord.aiFeedback as string);
        } catch (e) {
            // Already an array or parsing failed
            if (Array.isArray(answerRecord.aiFeedback)) {
                feedbackHistory = answerRecord.aiFeedback as any;
            }
        }
    }

    const currentAttemptNumber = answerRecord.supportAttempts + 1;
    const now = new Date().toISOString();
    feedbackHistory.push({
        attempt: currentAttemptNumber,
        feedback: aiResult.feedback,
        score: aiResult.scoreContribution,
        isCorrect: aiResult.isCorrect,
        requestedAt: now
    });

    const maxScore = Math.max(...feedbackHistory.map(f => f.score));

    const updatedAnswer = await prisma.evaluationAnswer.update({
        where: { id: answerRecord.id },
        data: {
            supportAttempts: currentAttemptNumber,
            score: maxScore,
            aiFeedback: feedbackHistory as any
        }
    });

    // 7. Recalculate Submission Total Score
    const evaluation = await prisma.evaluation.findUnique({
        where: { id: question.evaluationId },
        include: { questions: { select: { id: true } } }
    });

    const totalQuestionsCount = evaluation?.questions.length || 1;

    const allAnswers = await prisma.evaluationAnswer.findMany({
        where: { submissionId }
    });

    // We sum all the existing scores
    const totalScoreSum = allAnswers.reduce((acc, curr) => acc + (curr.score || 0), 0);
    // And average them assuming each is max 5.0 giving a total out of 5.0
    const finalSubmissionScore = Number((totalScoreSum / totalQuestionsCount).toFixed(2));

    await prisma.evaluationSubmission.update({
        where: { id: submissionId },
        data: { score: finalSubmissionScore }
    });

    return {
        success: true,
        feedback: aiResult.feedback,
        isCorrect: aiResult.isCorrect,
        scoreContribution: aiResult.scoreContribution,
        accumulatedScore: finalSubmissionScore,
        attemptsRemaining: maxAttempts - (answerRecord.supportAttempts + 1),
        requestedAt: now
    };
}


export async function saveAnswerAction(submissionId: string, questionId: string, content: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { default: prisma } = await import("@/lib/prisma");

    // Check if evaluation answer exists as it does not have @@unique configured correctly in schema previously
    const existing = await prisma.evaluationAnswer.findFirst({
        where: {
            submissionId,
            questionId
        }
    });

    if (existing) {
        await prisma.evaluationAnswer.update({
            where: { id: existing.id },
            data: {
                answer: content
            }
        });
    } else {
        await prisma.evaluationAnswer.create({
            data: {
                submissionId,
                questionId,
                answer: content
            }
        });
    }

    return { success: true };
}

export async function submitEvaluationAction(submissionId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { default: prisma } = await import("@/lib/prisma");

    const submission = await prisma.evaluationSubmission.findUnique({
        where: { id: submissionId },
        include: { attempt: { select: { courseId: true } } }
    });

    if (!submission || submission.userId !== session.user.id) {
        throw new Error("Unauthorized or submission not found");
    }

    // You can also add more fields like calculating scores here
    await prisma.evaluationSubmission.update({
        where: { id: submissionId },
        data: {
            submittedAt: new Date(),
        }
    });

    revalidatePath(`/dashboard/student`);
    return { success: true };
}

export async function deleteEvaluationSubmissionAction(submissionId: string, courseId: string) {
    const session = await getSession();
    if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
        throw new Error("Unauthorized");
    }

    const { default: prisma } = await import("@/lib/prisma");

    await prisma.evaluationSubmission.delete({
        where: { id: submissionId }
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
    return { success: true };
}

// ============================
// Wildcard Actions
// ============================

export async function useAiHintAction(submissionId: string, questionId: string, currentAnswer: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { default: prisma } = await import("@/lib/prisma");

    // 1. Get submission with attempt -> evaluation to check wildcard limits
    const submission = await prisma.evaluationSubmission.findUnique({
        where: { id: submissionId },
        include: {
            attempt: {
                include: {
                    evaluation: { select: { wildcardAiHints: true } }
                }
            }
        }
    });

    if (!submission) throw new Error("Submission not found");

    const maxHints = submission.attempt.evaluation.wildcardAiHints || 0;
    const wildcardsUsed: any = submission.wildcardsUsed || {};
    const hintsUsed = wildcardsUsed.aiHintsUsed || 0;

    if (hintsUsed >= maxHints) {
        throw new Error(`Has agotado tus ${maxHints} pistas de IA disponibles.`);
    }

    // 2. Get question text
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new Error("Question not found");

    // 3. Call AI hint service
    const { getAiHint } = await import("@/services/gemini/evaluationAnalysisService");
    const hint = await getAiHint(question.text, question.type, currentAnswer);

    // 4. Update wildcard usage
    wildcardsUsed.aiHintsUsed = hintsUsed + 1;
    if (!wildcardsUsed.aiHintQuestions) wildcardsUsed.aiHintQuestions = [];
    wildcardsUsed.aiHintQuestions.push({ questionId, usedAt: new Date().toISOString() });

    await prisma.evaluationSubmission.update({
        where: { id: submissionId },
        data: { wildcardsUsed }
    });

    return {
        success: true,
        hint,
        hintsRemaining: maxHints - (hintsUsed + 1)
    };
}

export async function useSecondChanceAction(submissionId: string, questionId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { default: prisma } = await import("@/lib/prisma");

    // 1. Get submission with evaluation config
    const submission = await prisma.evaluationSubmission.findUnique({
        where: { id: submissionId },
        include: {
            attempt: {
                include: {
                    evaluation: { select: { wildcardSecondChance: true, questions: { select: { id: true } } } }
                }
            }
        }
    });

    if (!submission) throw new Error("Submission not found");

    const maxSecondChances = submission.attempt.evaluation.wildcardSecondChance || 0;
    const wildcardsUsed: any = submission.wildcardsUsed || {};
    const secondChanceUsed = wildcardsUsed.secondChanceUsed || 0;

    if (secondChanceUsed >= maxSecondChances) {
        throw new Error(`Has agotado tus ${maxSecondChances} segundas oportunidades disponibles.`);
    }

    // 2. Reset the answer for this question
    const existingAnswer = await prisma.evaluationAnswer.findFirst({
        where: { submissionId, questionId }
    });

    if (existingAnswer) {
        await prisma.evaluationAnswer.update({
            where: { id: existingAnswer.id },
            data: {
                answer: "",
                score: null,
                aiFeedback: [],
                supportAttempts: 0
            }
        });
    }

    // 3. Recalculate submission score
    const totalQuestionsCount = submission.attempt.evaluation.questions.length || 1;
    const allAnswers = await prisma.evaluationAnswer.findMany({
        where: { submissionId }
    });
    const totalScoreSum = allAnswers.reduce((acc, curr) => {
        // Skip the reset question
        if (curr.questionId === questionId) return acc;
        return acc + (curr.score || 0);
    }, 0);
    const finalSubmissionScore = Number((totalScoreSum / totalQuestionsCount).toFixed(2));

    // 4. Update wildcard usage and score
    wildcardsUsed.secondChanceUsed = secondChanceUsed + 1;
    if (!wildcardsUsed.secondChanceQuestions) wildcardsUsed.secondChanceQuestions = [];
    wildcardsUsed.secondChanceQuestions.push({ questionId, usedAt: new Date().toISOString() });

    await prisma.evaluationSubmission.update({
        where: { id: submissionId },
        data: {
            wildcardsUsed,
            score: finalSubmissionScore
        }
    });

    return {
        success: true,
        secondChancesRemaining: maxSecondChances - (secondChanceUsed + 1)
    };
}

export async function testQuestionWithAIAction(questionText: string, type: string, answerText: string) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const { evaluateStudentAnswer } = await import("@/services/gemini/evaluationAnalysisService");
    const aiResult = await evaluateStudentAnswer(questionText, type, answerText);

    return aiResult;
}

export async function generateQuestionAction(topic: string, type: string, language?: string, customPrompt?: string, size: "short" | "medium" | "long" = "medium") {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const { generateQuestion } = await import("@/services/gemini/questionGenerationService");
    return await generateQuestion(topic, type, language, customPrompt, size);
}

export async function generateAnswerAction(questionText: string, type: string, language?: string) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const { generateSampleAnswer } = await import("@/services/gemini/questionGenerationService");
    return await generateSampleAnswer(questionText, type, language);
}
