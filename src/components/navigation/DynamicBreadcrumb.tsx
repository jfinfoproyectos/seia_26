"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getCourseTitle, getEvaluationAttemptTitle, getEvaluationSubmissionTitle } from "@/app/actions/breadcrumb-actions";

interface BreadcrumbSegment {
    label: string;
    href?: string;
}

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const router = useRouter();
    const [segments, setSegments] = useState<BreadcrumbSegment[]>([]);
    const [showBackButton, setShowBackButton] = useState(false);
    const breadcrumbRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathSegments = pathname.split("/").filter(Boolean);
            const breadcrumbs: BreadcrumbSegment[] = [];

            // Always start with Dashboard
            breadcrumbs.push({ label: "Dashboard", href: "/dashboard" });

            // Process path segments
            for (let i = 1; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                const isLast = i === pathSegments.length - 1;

                // Role segments: we don't display them normally unless they are the last segment,
                // but we DO need to include them in the URL for subsequent segments.
                const roleSegments = ["teacher", "student", "admin"];
                if (roleSegments.includes(segment) && !isLast) {
                    continue; // Skip adding a visible breadcrumb part for this 
                }

                // Map segment names to readable labels
                const segmentMap: Record<string, string> = {
                    teacher: "Cursos", // Teacher dashboard shows courses
                    student: "Cursos", // Student dashboard shows courses
                    admin: "Administración",
                    courses: "Cursos",
                    notifications: "Notificaciones",
                    attendance: "Asistencia",
                    statistics: "Estadísticas",
                    duplicates: "Reporte de Duplicados",
                    calendar: "Calendario",
                    evaluations: "Evaluaciones",
                    submissions: "Entregas",
                };

                // Create the href for this segment using the full real path
                const href = isLast ? undefined : `/${pathSegments.slice(0, i + 1).join("/")}`;

                // Check if it's a UUID or ID (course/evaluation detail)
                const isId = segment.match(/^[a-f0-9-]{36}$/) || (!segmentMap[segment] && segment.match(/^[a-z0-9]+$/i));

                if (isId) {
                    // For IDs, we'll try to fetch the name
                    const prevSegment = pathSegments[i - 1];

                    if (prevSegment === "courses") {
                        // Fetch course name
                        const courseTitle = await getCourseTitle(segment);
                        breadcrumbs.push({
                            label: courseTitle || "Curso",
                            href,
                        });
                    } else if (prevSegment === "evaluations") {
                        // Fetch evaluation attempt title
                        const evaluationTitle = await getEvaluationAttemptTitle(segment);
                        breadcrumbs.push({
                            label: evaluationTitle || "Evaluación",
                            href,
                        });
                    } else if (prevSegment === "submissions") {
                        // Fetch evaluation submission title
                        const submissionTitle = await getEvaluationSubmissionTitle(segment);
                        breadcrumbs.push({
                            label: submissionTitle || "Entrega",
                            href,
                        });
                    } else {
                        // Generic ID
                        breadcrumbs.push({
                            label: segment,
                            href,
                        });
                    }
                } else {
                    const label = segmentMap[segment] || segment;
                    breadcrumbs.push({
                        label,
                        href,
                    });
                }
            }

            setSegments(breadcrumbs);
        };

        generateBreadcrumbs();
    }, [pathname]);

    // Check if breadcrumb overflows
    useEffect(() => {
        const checkOverflow = () => {
            if (breadcrumbRef.current) {
                const isOverflowing = breadcrumbRef.current.scrollWidth > breadcrumbRef.current.clientWidth;
                setShowBackButton(isOverflowing || window.innerWidth < 768);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);

        // Small delay to ensure content is rendered
        const timer = setTimeout(checkOverflow, 100);

        return () => {
            window.removeEventListener('resize', checkOverflow);
            clearTimeout(timer);
        };
    }, [segments]);

    // Don't show breadcrumbs on the main dashboard page
    if (pathname === "/dashboard") {
        return null;
    }

    return (
        <>
            {showBackButton ? (
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 -ml-2"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="text-sm">Atrás</span>
                </Button>
            ) : (
                <div ref={breadcrumbRef} className="overflow-hidden">
                    <Breadcrumb>
                        <BreadcrumbList>
                            {segments.map((segment, index) => (
                                <div key={index} className="flex items-center">
                                    <BreadcrumbItem>
                                        {segment.href ? (
                                            <BreadcrumbLink asChild>
                                                <Link href={segment.href}>{segment.label}</Link>
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {index < segments.length - 1 && <BreadcrumbSeparator />}
                                </div>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            )}
        </>
    );
}
