"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pdf } from "@react-pdf/renderer";
import { EvaluationReportPDF } from "./EvaluationReportPDF";

interface DownloadReportButtonProps {
    appTitle: string;
    courseName: string;
    teacherName: string;
    evaluationTitle: string;
    startTime: Date;
    endTime: Date;
    submissions: any[];
}

export function DownloadReportButton({
    appTitle,
    courseName,
    teacherName,
    evaluationTitle,
    startTime,
    endTime,
    submissions
}: DownloadReportButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const blob = await pdf(
                <EvaluationReportPDF
                    appTitle={appTitle}
                    courseName={courseName}
                    teacherName={teacherName}
                    evaluationTitle={evaluationTitle}
                    startTime={startTime}
                    endTime={endTime}
                    submissions={submissions}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_${evaluationTitle.replace(/\s+/g, '_')}_${format(new Date(), "ddMMyyyy")}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Optionally add a toast here if sonner is available
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
            disabled={loading}
        >
            <FileText className="h-4 w-4" />
            {loading ? "Preparando..." : "Generar Reporte PDF"}
        </Button>
    );
}
