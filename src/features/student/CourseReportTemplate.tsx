import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CourseReportTemplateProps {
    studentName: string;
    courseName: string;
    teacherName: string;
    averageGrade: number;
    remarks: any[];
}

export const CourseReportTemplate = React.forwardRef<HTMLDivElement, CourseReportTemplateProps>(
    ({ studentName, courseName, teacherName, averageGrade, remarks = [] }, ref) => {

        return (
            <div ref={ref} className="p-8 max-w-4xl mx-auto bg-white text-black font-sans print:p-0 print:max-w-none">
                <style type="text/css" media="print">
                    {`
                        @page { 
                            size: auto; 
                            margin: 20mm; 
                        }
                        body { 
                            -webkit-print-color-adjust: exact; 
                        }
                        /* Hide browser headers and footers */
                        @media print {
                            @page { margin: 0; }
                            body { margin: 1.6cm; }
                        }
                    `}
                </style>
                {/* Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Informe de Desempeño Académico</h1>
                        <h2 className="text-xl text-gray-700">{courseName}</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Fecha de generación</div>
                        <div className="font-medium">{format(new Date(), "PPP", { locale: es })}</div>
                    </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Estudiante</div>
                        <div className="text-lg font-bold text-gray-900">{studentName}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Profesor</div>
                        <div className="text-lg font-medium text-gray-900">{teacherName}</div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="mb-8 grid grid-cols-1 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex items-center justify-between">
                        <div>
                            <div className="text-sm text-blue-600 uppercase tracking-wider mb-1">Promedio General</div>
                            <div className="text-4xl font-bold text-blue-900">{averageGrade.toFixed(1)}</div>
                        </div>
                    </div>
                </div>

                {/* Remarks Section */}
                {remarks.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Observaciones</h3>
                        <div className="space-y-4">
                            {remarks.map((remark) => (
                                <div
                                    key={remark.id}
                                    className={`p-4 rounded-lg border ${remark.type === "ATTENTION"
                                        ? "bg-red-50 border-red-100"
                                        : "bg-green-50 border-green-100"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-1 ${remark.type === "ATTENTION" ? "text-red-700 bg-red-100" : "text-green-700 bg-green-100"
                                                }`}>
                                                {remark.type === "ATTENTION" ? "Llamado de Atención" : "Felicitación"}
                                            </span>
                                            <h4 className="font-bold text-gray-900">{remark.title}</h4>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {format(new Date(remark.date), "PPP", { locale: es })}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{remark.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

CourseReportTemplate.displayName = "CourseReportTemplate";
