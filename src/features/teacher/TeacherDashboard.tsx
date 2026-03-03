"use client";



import { useState, useEffect } from "react";
import { CourseManager } from "./CourseManager";

export function TeacherDashboard({ courses, pendingEnrollments }: { courses: any[], pendingEnrollments: any[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Profesor</h2>
                </div>
                <div className="h-96 w-full animate-pulse bg-muted rounded-lg" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Profesor</h2>
            </div>
            <CourseManager initialCourses={courses} pendingEnrollments={pendingEnrollments} />
        </div>
    );
}
