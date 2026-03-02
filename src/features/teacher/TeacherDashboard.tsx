"use client";



import { CourseManager } from "./CourseManager";
import { EnrollmentRequests } from "./EnrollmentRequests";

export function TeacherDashboard({ courses, pendingEnrollments, currentDate }: { courses: any[], pendingEnrollments: any[], currentDate?: string }) {
    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Profesor</h2>
            </div>
            <CourseManager initialCourses={courses} pendingEnrollments={pendingEnrollments} currentDate={currentDate} />
        </div>
    );
}
