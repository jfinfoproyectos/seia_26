import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudentDashboard } from "@/features/student/StudentDashboard";
import { courseService } from "@/services/courseService";
import prisma from "@/lib/prisma";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "student") {
    redirect("/signin");
  }

  const availableCourses = await courseService.getAllCourses();
  const myEnrollments = await courseService.getStudentEnrollments(session.user.id);
  const pendingEnrollments = await courseService.getStudentPendingEnrollments(session.user.id);

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "settings" },
    select: { appTitle: true }
  });

  const appTitle = settings?.appTitle || "SmartClass";

  return <StudentDashboard
    availableCourses={availableCourses}
    myEnrollments={myEnrollments}
    studentName={session.user.name}
    pendingEnrollments={pendingEnrollments}
    appTitle={appTitle}
  />;
}
