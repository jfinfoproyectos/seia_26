"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enrollStudentAction } from "@/app/actions";
import { BookOpen, User, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CourseCatalog({ courses, pendingEnrollments = [] }: { courses: any[], pendingEnrollments?: string[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
                const isPending = pendingEnrollments.includes(course.id);
                const isRegistrationClosed = !course.registrationOpen || (course.registrationDeadline && new Date() > new Date(course.registrationDeadline));

                return (
                    <Card key={course.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {course.title}
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <User className="mr-1 h-3 w-3" />
                                Profesor: {course.teacher.name}
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                                {course.description || "Sin descripción"}
                            </p>
                            {course.registrationDeadline && (
                                <div className="mb-3 text-xs text-center">
                                    <span className={new Date() > new Date(course.registrationDeadline) ? "text-destructive font-medium" : "text-muted-foreground"}>
                                        Cierra: {new Date(course.registrationDeadline).toLocaleDateString()} {new Date(course.registrationDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                            {isRegistrationClosed && (
                                <Badge variant="destructive" className="mb-3 w-full justify-center">
                                    <Lock className="h-3 w-3 mr-1" />
                                    {course.registrationOpen ? "Plazo Vencido" : "Inscripción Cerrada"}
                                </Badge>
                            )}
                            <form action={enrollStudentAction.bind(null, course.id)}>
                                <Button
                                    className="w-full"
                                    size="sm"
                                    disabled={isRegistrationClosed || isPending}
                                    variant={isPending ? "secondary" : "default"}
                                >
                                    {isPending ? "Solicitud Pendiente" : (
                                        !isRegistrationClosed ? "Inscribirse" : "No Disponible"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                );
            })}
            {courses.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                    No hay cursos disponibles para inscribirse.
                </div>
            )}
        </div>
    );
}
