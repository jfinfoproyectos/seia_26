"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, User, Clock, Filter } from "lucide-react";
import { approveEnrollmentAction, rejectEnrollmentAction } from "@/app/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

export function EnrollmentRequests({ requests: initialRequests }: { requests: PendingEnrollment[] }) {
    // We maintain local state for optimistic updates, but initialize from props
    const [requests, setRequests] = useState<PendingEnrollment[]>(initialRequests);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

    // Update local state when props change (e.g. after server revalidation)
    useMemo(() => {
        setRequests(initialRequests);
    }, [initialRequests]);

    const uniqueCourses = useMemo(() => {
        const courses = new Map();
        requests.forEach(req => {
            if (!courses.has(req.course.id)) {
                courses.set(req.course.id, req.course.title);
            }
        });
        return Array.from(courses.entries());
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (selectedCourseId === "all") return requests;
        return requests.filter(req => req.course.id === selectedCourseId);
    }, [requests, selectedCourseId]);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await approveEnrollmentAction(id);
            // Optimistic update
            setRequests(prev => prev.filter(req => req.id !== id));
            toast.success("Estudiante aprobado correctamente");
        } catch (error) {
            toast.error("Error al aprobar estudiante");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessingId(id);
        try {
            await rejectEnrollmentAction(id);
            // Optimistic update
            setRequests(prev => prev.filter(req => req.id !== id));
            toast.success("Solicitud rechazada");
        } catch (error) {
            toast.error("Error al rechazar solicitud");
        } finally {
            setProcessingId(null);
        }
    };

    if (requests.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No hay solicitudes de inscripción pendientes.
            </div>
        );
    }

    return (
        <Card className="border-orange-200 bg-orange-50/30 dark:border-orange-900/50 dark:bg-orange-950/10">
            <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Solicitudes de Inscripción
                        </CardTitle>
                        <CardDescription>
                            Gestiona el acceso a tus cursos.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {uniqueCourses.length > 0 && (
                            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                <SelectTrigger className="w-[200px] h-8 text-xs">
                                    <Filter className="w-3 h-3 mr-2" />
                                    <SelectValue placeholder="Filtrar por curso" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los cursos</SelectItem>
                                    {uniqueCourses.map(([id, title]) => (
                                        <SelectItem key={id} value={id}>{title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                            {filteredRequests.length} Pendiente{filteredRequests.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No hay solicitudes pendientes para el filtro seleccionado.
                        </div>
                    ) : (
                        filteredRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={request.user.image || undefined} />
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{request.user.name}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{request.user.email}</div>
                                        <div className="text-xs font-medium text-primary mt-0.5">
                                            Curso: {request.course.title}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => handleReject(request.id)}
                                        disabled={processingId === request.id}
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Rechazar</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleApprove(request.id)}
                                        disabled={processingId === request.id}
                                    >
                                        <Check className="h-4 w-4" />
                                        <span className="sr-only">Aprobar</span>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
