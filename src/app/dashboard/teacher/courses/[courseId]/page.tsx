import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudentManager } from "@/features/teacher/StudentManager";
import { courseService } from "@/services/courseService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { evaluationService } from "@/services/evaluationService";
import { EvaluationAssignmentManager } from "@/features/teacher/EvaluationAssignmentManager";


export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "teacher") {
        redirect("/signin");
    }

    const { courseId } = await params;

    const course = await courseService.getCourseById(courseId);

    if (!course) {
        return <div>Curso no encontrado</div>;
    }

    // Verify ownership
    if (course.teacher?.id !== session.user.id) {
        return <div>No tienes permiso para ver este curso</div>;
    }


    const students = await courseService.getCourseStudents(courseId);
    const assignedEvaluations = await evaluationService.getCourseEvaluationAttempts(courseId);
    const allTeacherEvaluations = await evaluationService.getTeacherEvaluations(session.user.id);

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{course.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                </div>
            </div>

            <Tabs defaultValue="students" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
                        <TabsTrigger value="students">Estudiantes</TabsTrigger>
                        <TabsTrigger value="evaluations" className="gap-2 text-primary data-[state=active]:bg-primary/10">
                            <FileText className="h-4 w-4" />
                            Evaluaciones
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex-1" />
                </div>
                <TabsContent value="students" className="space-y-4">
                    <StudentManager courseId={courseId} initialStudents={students} />
                </TabsContent>
                <TabsContent value="evaluations" className="space-y-4">
                    <EvaluationAssignmentManager
                        courseId={courseId}
                        attempts={assignedEvaluations}
                        teacherEvaluations={allTeacherEvaluations}
                    />
                </TabsContent>
            </Tabs >
        </div >
    );
}
