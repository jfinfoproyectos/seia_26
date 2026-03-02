"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Show back button when in course detail or report pages
  const shouldShowBackButton = () => {
    // Teacher course detail: /dashboard/teacher/courses/[courseId]
    // Duplicates report: /dashboard/teacher/courses/[courseId]/duplicates

    const isTeacherCourse = pathname.match(/^\/dashboard\/teacher\/courses\/[^/]+$/);
    const isDuplicatesReport = pathname.match(/^\/dashboard\/teacher\/courses\/[^\/]+\/duplicates$/);

    return !!(isTeacherCourse || isDuplicatesReport);
  };

  const handleBack = () => {
    router.back();
  };

  if (!shouldShowBackButton()) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="h-8 px-2 text-xs"
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Regresar
    </Button>
  );
}
