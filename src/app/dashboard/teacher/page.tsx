import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TeacherDashboard } from "@/features/teacher/TeacherDashboard";
import { courseService } from "@/services/courseService";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "teacher") {
    redirect("/signin");
  }

  const courses = await courseService.getTeacherCourses(session.user.id);
  const pendingEnrollments = await courseService.getPendingEnrollments(session.user.id);

  return <TeacherDashboard courses={courses} pendingEnrollments={pendingEnrollments} />;
}
