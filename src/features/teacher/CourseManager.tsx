"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createCourseAction, deleteCourseAction, updateRegistrationSettingsAction, cloneCourseAction, getCourseCompleteDataAction } from "@/app/actions";
import { Plus, Trash2, Eye, Lock, Unlock, Calendar, Settings, X, Copy, FileWarning, Download } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateCourseAction } from "@/app/actions";
import { Pencil } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { exportMultiSheetExcel } from "@/lib/export-utils";

// Helper function to format date consistently on server and client
function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    registrationOpen: boolean;
    registrationDeadline: Date | string | null;
    _count: {
        enrollments: number;
    };
}

interface PendingEnrollment {
    id: string;
    course: {
        id: string;
        title: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
    createdAt: Date;
}


function RegistrationSettingsDialog({ course }: { course: Course }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"permanent" | "date">(course.registrationDeadline ? "date" : "permanent");
    const [deadline, setDeadline] = useState(course.registrationDeadline ? new Date(course.registrationDeadline).toISOString().slice(0, 16) : "");
    // ... rest of the function (no change needed in body if types match)

    // I need to be careful with replace_file_content, I cannot assume body content.
    // I will use multi_replace.



    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={course.registrationOpen ? "text-green-600 hover:text-green-700 h-auto py-1" : "text-red-600 hover:text-red-700 h-auto py-1"}
                >
                    {course.registrationOpen ? (
                        <div className="flex flex-col items-center">
                            <div className="flex items-center">
                                <Unlock className="h-4 w-4 mr-1" />
                                {course.registrationDeadline ? "Hasta fecha" : "Abierta"}
                            </div>
                            {course.registrationDeadline && (
                                <span className="text-[10px] opacity-80">
                                    {formatDateTime(course.registrationDeadline)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <>
                            <Lock className="h-4 w-4 mr-1" />
                            Cerrada
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configurar Inscripción</DialogTitle>
                    <DialogDescription>
                        Gestiona la disponibilidad del curso para nuevos estudiantes.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    if (deadline) {
                        formData.set("deadline", new Date(deadline).toISOString());
                    }
                    await updateRegistrationSettingsAction(formData);
                    setIsOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="courseId" value={course.id} />

                    <div className="space-y-2">
                        <Label>Estado de Inscripción</Label>
                        <RadioGroup name="isOpen" defaultValue={course.registrationOpen ? "true" : "false"}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="open" />
                                <Label htmlFor="open">Abierta</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="closed" />
                                <Label htmlFor="closed">Cerrada</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Duración</Label>
                        <RadioGroup value={mode} onValueChange={(v: "permanent" | "date") => setMode(v)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="permanent" id="permanent" />
                                <Label htmlFor="permanent">Permanente</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="date" id="date" />
                                <Label htmlFor="date">Hasta fecha específica</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {mode === "date" && (
                        <div className="space-y-2">
                            <Label htmlFor="deadline">Fecha límite</Label>
                            <Input
                                id="deadline"
                                name="deadline"
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                required={mode === "date"}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}




function DeleteCourseDialog({ courseId, courseTitle }: { courseId: string, courseTitle: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Eliminar</p>
                </TooltipContent>
            </Tooltip>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar Curso</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el curso <strong>{courseTitle}</strong> y todos sus datos asociados.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    try {
                        await deleteCourseAction(formData);
                        setIsOpen(false);
                        toast.success("Curso eliminado correctamente");
                    } catch (error) {
                        console.error("Error deleting course:", error);
                        toast.error("Error al eliminar el curso");
                    }
                }} className="space-y-4">
                    <input type="hidden" name="courseId" value={courseId} />
                    <div className="space-y-2">
                        <Label htmlFor="confirmText">
                            Escribe <strong>ELIMINAR</strong> para confirmar
                        </Label>
                        <Input
                            id="confirmText"
                            name="confirmText"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            required
                            pattern="ELIMINAR"
                            placeholder="ELIMINAR"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={confirmText !== "ELIMINAR"}
                        >
                            Eliminar Curso
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

import { EnrollmentRequests } from "./EnrollmentRequests";
import { Badge } from "@/components/ui/badge";

export function CourseManager({ initialCourses, pendingEnrollments = [], currentDate }: { initialCourses: Course[], pendingEnrollments?: PendingEnrollment[], currentDate?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [isCloning, setIsCloning] = useState(false);

    const [isExporting, setIsExporting] = useState(false);

    const allCourses = initialCourses;

    const handleExportComplete = async (courseId: string, courseTitle: string) => {
        try {
            toast.info("Generando reporte completo...");
            const data = await getCourseCompleteDataAction(courseId);
            const sheets = [
                { name: 'Calificaciones', data: data.grades },
                { name: 'Observaciones', data: data.remarks },
                { name: 'Estadísticas', data: data.statistics }
            ];
            await exportMultiSheetExcel(sheets, `${courseTitle}_Completo_${new Date().toISOString().split('T')[0]}`);
            toast.success("Datos exportados exitosamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al exportar datos");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">Gestión de Cursos</h3>
                </div>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditCourse(null);
                        setIsCloning(false);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Crear Curso</Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] sm:max-w-7xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
                        <form action={async (formData) => {
                            if (isCloning && editCourse) {
                                formData.append("sourceCourseId", editCourse.id);
                                await cloneCourseAction(formData);
                            } else if (editCourse) {
                                await updateCourseAction(formData);
                            } else {
                                await createCourseAction(formData);
                            }
                            setIsOpen(false);
                            setEditCourse(null);
                            setIsCloning(false);
                        }}>
                            {editCourse && !isCloning && <input type="hidden" name="courseId" value={editCourse.id} />}
                            <DialogHeader>
                                <DialogTitle>
                                    {isCloning ? "Clonar Curso" : (editCourse ? "Editar Curso" : "Crear Nuevo Curso")}
                                </DialogTitle>
                                <DialogDescription>
                                    {isCloning
                                        ? "Configura los detalles del nuevo curso basado en el original."
                                        : (editCourse ? "Modifica los detalles del curso." : "Ingresa los detalles del nuevo curso.")}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">
                                        Título *
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        required
                                        defaultValue={editCourse?.title}
                                        placeholder="Nombre del curso"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={editCourse?.description || ""}
                                        placeholder="Descripción del curso"
                                        rows={5}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">
                                    {isCloning ? "Clonar Curso" : (editCourse ? "Actualizar" : "Guardar")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog >
            </div >

            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:inline-flex">
                    <TabsTrigger value="courses" className="text-xs sm:text-sm">
                        Cursos ({allCourses.length})
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="relative text-xs sm:text-sm">
                        <span className="hidden sm:inline">Solicitudes</span>
                        <span className="sm:hidden">Solicitudes</span>
                        {pendingEnrollments.length > 0 && (
                            <Badge className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 text-[10px]">
                                {pendingEnrollments.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="courses" className="mt-4">
                    <CourseTable courses={allCourses} onEdit={(c) => { setEditCourse(c); setIsOpen(true); }} onClone={(c) => { setEditCourse({ ...c, title: `Copia de ${c.title}` }); setIsCloning(true); setIsOpen(true); }} onExport={handleExportComplete} />
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                    <EnrollmentRequests requests={pendingEnrollments} />
                </TabsContent>
            </Tabs>
        </div >
    );
}

const CourseTable = ({ courses, onEdit, onClone, onExport }: { courses: Course[], onEdit: (c: Course) => void, onClone: (c: Course) => void, onExport: (id: string, title: string) => void }) => (
    <div className="w-full overflow-x-auto rounded-md border">
        <Table className="min-w-[800px]">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Descripción</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead className="hidden lg:table-cell">Inscripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {courses.map((course) => (
                    <TableRow key={course.id}>
                        <TableCell>
                        </TableCell>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-md truncate" title={course.description || ""}>
                            {course.description || "Sin descripción"}
                        </TableCell>
                        <TableCell>{course._count.enrollments}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                            <RegistrationSettingsDialog course={course} />
                        </TableCell>
                        <TableCell className="text-right">
                            <TooltipProvider>
                                <div className="flex justify-end gap-1 flex-wrap">
                                    <Link href={`/dashboard/teacher/courses/${course.id}`}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Ver Detalles</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </Link>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(course)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Editar</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onClone(course)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Clonar Curso</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => onExport(course.id, course.title)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Exportar Datos Completos</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <DeleteCourseDialog courseId={course.id} courseTitle={course.title} />
                                </div>
                            </TooltipProvider>
                        </TableCell>
                    </TableRow>
                ))}
                {courses.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No hay cursos en esta sección.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
);
