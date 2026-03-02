"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCatalog } from "./CourseCatalog";
import { MyEnrollments } from "./MyEnrollments";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export function StudentDashboard({
    availableCourses,
    myEnrollments,
    studentName,
    pendingEnrollments = [],
    appTitle
}: {
    availableCourses: any[],
    myEnrollments: any[],
    studentName: string,
    pendingEnrollments?: string[],
    appTitle?: string
}) {
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [openCombobox, setOpenCombobox] = useState(false);

    // Catch expulsion error
    const searchParams = useSearchParams();
    const expulsionError = searchParams?.get("error");
    const [showExpulsionWarning, setShowExpulsionWarning] = useState(!!expulsionError);

    // Set first course or saved course as default
    useEffect(() => {
        if (myEnrollments.length > 0 && !selectedCourse) {
            const savedCourse = localStorage.getItem("student_selected_course");
            if (savedCourse && myEnrollments.some(e => e.course.id === savedCourse)) {
                setSelectedCourse(savedCourse);
            } else {
                setSelectedCourse(myEnrollments[0].course.id);
            }
        }
    }, [myEnrollments, selectedCourse]);

    const handleSelectCourse = (courseId: string) => {
        setSelectedCourse(courseId);
        localStorage.setItem("student_selected_course", courseId);
        setOpenCombobox(false);
    };

    return (
        <div className="flex-1 space-y-6 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Panel de Estudiante</h1>
                <p className="text-muted-foreground">
                    {appTitle || "SmartClass"}
                </p>
            </div>

            {pendingEnrollments.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
                    Tienes {pendingEnrollments.length} solicitud{pendingEnrollments.length !== 1 ? 'es' : ''} de inscripción pendiente{pendingEnrollments.length !== 1 ? 's' : ''} de aprobación por el profesor.
                </div>
            )}

            {showExpulsionWarning && expulsionError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-800 dark:text-red-200 flex items-start gap-3 relative animate-in slide-in-from-top-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-500" />
                    <div>
                        <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">Has sido expulsado de la evaluación previa</h3>
                        <p>{expulsionError}</p>
                        <p className="mt-2 text-xs opacity-80">Si la evaluación no había sido enviada, puedes volver a ingresar comprobando la disponibilidad en tu curso.</p>
                    </div>
                    <button
                        onClick={() => setShowExpulsionWarning(false)}
                        className="absolute top-4 right-4 text-red-500/70 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="my-courses" className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <TabsList className="grid w-full sm:w-auto grid-cols-2">
                        <TabsTrigger value="my-courses">Mis Cursos</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo de Cursos</TabsTrigger>
                    </TabsList>

                    {myEnrollments.length > 0 && (
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full sm:w-[300px] justify-between"
                                >
                                    <span className="truncate">
                                        {selectedCourse
                                            ? myEnrollments.find((e) => e.course.id === selectedCourse)?.course.title
                                            : "Seleccionar curso"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full sm:w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar curso..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró el curso.</CommandEmpty>
                                        <CommandGroup>
                                            {myEnrollments.map((enrollment) => (
                                                <CommandItem
                                                    key={enrollment.course.id}
                                                    value={enrollment.course.id}
                                                    onSelect={(currentValue) => {
                                                        handleSelectCourse(currentValue);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedCourse === enrollment.course.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {enrollment.course.title}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                <TabsContent value="my-courses" className="space-y-6 mt-0">
                    <MyEnrollments
                        enrollments={myEnrollments}
                        studentName={studentName}
                        selectedCourse={selectedCourse}
                    />
                </TabsContent>
                <TabsContent value="catalog" className="space-y-6 mt-0">
                    <CourseCatalog
                        courses={availableCourses.filter(course =>
                            !myEnrollments.some(enrollment => enrollment.courseId === course.id) &&
                            course.registrationOpen &&
                            (!course.registrationDeadline || new Date(course.registrationDeadline) >= new Date())
                        )}
                        pendingEnrollments={pendingEnrollments}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
