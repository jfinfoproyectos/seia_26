"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Clock, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useRef, useState, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { CourseReportTemplate } from "./CourseReportTemplate";
import { Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StudentRemarks } from "./StudentRemarks";
import { ExportButton } from "@/components/ui/export-button";
import { formatDateForExport, formatGradeForExport } from "@/lib/export-utils";

export function MyEnrollments({ enrollments, studentName, selectedCourse }: { enrollments: any[], studentName: string, selectedCourse?: string }) {
    const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Filter enrollments by selected course
    const filteredEnrollments = selectedCourse
        ? enrollments.filter(e => e.course.id === selectedCourse)
        : enrollments;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Reporte_${selectedEnrollment?.course.title || "Curso"}`,
    });

    const onPrintClick = (enrollment: any) => {
        setSelectedEnrollment(enrollment);
        // Small timeout to allow state to update and render the hidden template
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    return (
        <div className="space-y-6">
            {/* Hidden Template for Printing */}
            <div style={{ display: "none" }}>
                {selectedEnrollment && (
                    <CourseReportTemplate
                        ref={printRef}
                        studentName={studentName}
                        courseName={selectedEnrollment.course.title}
                        teacherName={selectedEnrollment.course.teacher.name}
                        averageGrade={selectedEnrollment.averageGrade}
                        remarks={selectedEnrollment.remarks}
                    />
                )}
            </div>

            {filteredEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden border-muted">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold">{enrollment.course.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Profesor: {enrollment.course.teacher.name}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                                {enrollment.course.externalUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={enrollment.course.externalUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Documentación
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPrintClick(enrollment)}
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Generar Reporte
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Assigned Evaluations Section */}

                        {/* Assigned Evaluations Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                Evaluaciones Asignadas
                            </h3>
                            {enrollment.course.evaluationAttempts && enrollment.course.evaluationAttempts.length > 0 ? (
                                <div className="w-full overflow-x-auto rounded-md border">
                                    <Table className="min-w-[700px]">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Evaluación</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Disponibilidad</TableHead>
                                                <TableHead>Nota</TableHead>
                                                <TableHead className="text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enrollment.course.evaluationAttempts.map((attempt: any) => {
                                                const start = new Date(attempt.startTime);
                                                const end = new Date(attempt.endTime);
                                                const now = new Date();
                                                const isScheduled = now < start;
                                                const isFinished = now > end;
                                                const isActive = now >= start && now <= end;

                                                // Extract submission to show score
                                                const submission = attempt.submissions?.[0];
                                                const isSubmitted = !!submission?.submittedAt;
                                                const score = submission?.score;
                                                const expulsions = submission?.expulsions ?? 0;

                                                return (
                                                    <TableRow key={attempt.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{attempt.evaluation.title}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {attempt.evaluation._count?.questions || 0} preguntas
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isScheduled ? (
                                                                <Badge variant="secondary" className="gap-1">
                                                                    <Clock className="h-3 w-3" /> Programada
                                                                </Badge>
                                                            ) : isFinished ? (
                                                                <Badge variant="outline" className="gap-1 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200">
                                                                    <AlertCircle className="h-3 w-3" /> Finalizada
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="success" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-300">
                                                                    <Clock className="h-3 w-3" /> Activa Ahora
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col text-sm">
                                                                <div className="text-muted-foreground">
                                                                    Desde: {format(start, "dd/MM/yy HH:mm")}
                                                                </div>
                                                                <div className="text-muted-foreground">
                                                                    Hasta: {format(end, "dd/MM/yy HH:mm")}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isSubmitted && score !== undefined && score !== null ? (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-bold text-primary">
                                                                        {score.toFixed(2)}
                                                                    </span>
                                                                    {expulsions > 0 && (
                                                                        <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium">
                                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                            {expulsions} expulsi{expulsions === 1 ? "ón" : "ones"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant={isActive || isSubmitted ? "default" : "outline"}
                                                                    disabled={!isActive && !isSubmitted}
                                                                    asChild={isActive || isSubmitted}
                                                                >
                                                                    {(isActive || isSubmitted) ? (
                                                                        <Link href={`/evaluations/${attempt.id}`}>
                                                                            {isSubmitted ? "Ver Resultados" : "Iniciar Evaluación"}
                                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                                        </Link>
                                                                    ) : isFinished ? (
                                                                        <span className="text-muted-foreground">Expirada</span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">Aún no disponible</span>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay evaluaciones programadas para este grupo.</p>
                            )}
                        </div>

                        {/* Remarks Section */}
                        <StudentRemarks courseId={enrollment.course.id} userId={enrollment.userId} />
                    </CardContent>
                </Card>
            ))
            }
            {
                filteredEnrollments.length === 0 && enrollments.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No estás inscrito en ningún curso. Ve al catálogo para inscribirte.
                    </div>
                )
            }
        </div >
    );
}
