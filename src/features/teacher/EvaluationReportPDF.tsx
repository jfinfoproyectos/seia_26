"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts if needed (using defaults for now for compatibility)

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#333",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#111",
        paddingBottom: 10,
    },
    appTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2563eb", // blue-600
        marginBottom: 4,
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
    },
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 20,
    },
    infoItem: {
        width: "50%",
        marginBottom: 4,
    },
    label: {
        fontWeight: "bold",
        color: "#666",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#f8fafc",
        padding: 10,
        borderRadius: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    statBox: {
        alignItems: "center",
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
    },
    statLabel: {
        fontSize: 8,
        color: "#64748b",
        textTransform: "uppercase",
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomColor: "#e2e8f0",
        borderBottomWidth: 1,
        minHeight: 24,
        alignItems: "center",
    },
    tableRowHeader: {
        backgroundColor: "#f1f5f9",
    },
    tableCol: {
        borderStyle: "solid",
        borderRightWidth: 1,
        borderRightColor: "#e2e8f0",
        padding: 4,
    },
    colStudent: { width: "35%" },
    colStatus: { width: "15%", textAlign: "center" },
    colScore: { width: "15%", textAlign: "center" },
    colExpulsions: { width: "15%", textAlign: "center" },
    colWildcards: { width: "20%", textAlign: "center" },

    tableCell: {
        fontSize: 9,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        paddingTop: 10,
        fontSize: 8,
        color: "#94a3b8",
    }
});

interface EvaluationReportPDFProps {
    appTitle: string;
    courseName: string;
    teacherName: string;
    evaluationTitle: string;
    startTime: Date;
    endTime: Date;
    submissions: any[];
}

export function EvaluationReportPDF({
    appTitle,
    courseName,
    teacherName,
    evaluationTitle,
    startTime,
    endTime,
    submissions
}: EvaluationReportPDFProps) {
    const submittedOnes = submissions.filter(s => s.submittedAt);
    const totalStudents = submissions.length;
    const avgScore = submittedOnes.length > 0
        ? (submittedOnes.reduce((acc, s) => acc + (s.score || 0), 0) / submittedOnes.length).toFixed(2)
        : "0.00";

    const passCount = submittedOnes.filter(s => (s.score || 0) >= 3.0).length;
    const passRate = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : "0";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.appTitle}>{appTitle}</Text>
                    <Text style={styles.reportTitle}>Reporte de Resultados de Evaluación</Text>
                </View>

                {/* Info Section */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text><Text style={styles.label}>Evaluación: </Text>{evaluationTitle}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text><Text style={styles.label}>Curso: </Text>{courseName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text><Text style={styles.label}>Docente: </Text>{teacherName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text><Text style={styles.label}>Fecha: </Text>{format(new Date(startTime), "dd/MM/yyyy HH:mm")}</Text>
                    </View>
                </View>

                {/* Statistics */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalStudents}</Text>
                        <Text style={styles.statLabel}>Estudiantes</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{avgScore}</Text>
                        <Text style={styles.statLabel}>Nota Promedio</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{passRate}%</Text>
                        <Text style={styles.statLabel}>Tasa Aprobación</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableRowHeader]}>
                        <View style={[styles.tableCol, styles.colStudent]}>
                            <Text style={styles.label}>Estudiante</Text>
                        </View>
                        <View style={[styles.tableCol, styles.colStatus]}>
                            <Text style={styles.label}>Estado</Text>
                        </View>
                        <View style={[styles.tableCol, styles.colScore]}>
                            <Text style={styles.label}>Nota</Text>
                        </View>
                        <View style={[styles.tableCol, styles.colExpulsions]}>
                            <Text style={styles.label}>Exp.</Text>
                        </View>
                        <View style={[styles.tableCol, styles.colWildcards]}>
                            <Text style={styles.label}>Comodines</Text>
                        </View>
                    </View>

                    {submissions.map((sub, index) => {
                        const wc = sub.wildcardsUsed || {};
                        const wildcardsText = `${wc.aiHintsUsed || 0}💡 ${wc.secondChanceUsed || 0}🔄`;

                        return (
                            <View key={sub.id} style={styles.tableRow}>
                                <View style={[styles.tableCol, styles.colStudent]}>
                                    <Text style={styles.tableCell}>{sub.user.name}</Text>
                                    <Text style={[styles.tableCell, { fontSize: 7, color: "#666" }]}>{sub.user.email}</Text>
                                </View>
                                <View style={[styles.tableCol, styles.colStatus]}>
                                    <Text style={styles.tableCell}>{sub.submittedAt ? "Enviado" : "En proceso"}</Text>
                                </View>
                                <View style={[styles.tableCol, styles.colScore]}>
                                    <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                                        {sub.score !== null ? Number(sub.score).toFixed(2) : "0.00"}
                                    </Text>
                                </View>
                                <View style={[styles.tableCol, styles.colExpulsions]}>
                                    <Text style={styles.tableCell}>{sub.expulsions || 0}</Text>
                                </View>
                                <View style={[styles.tableCol, styles.colWildcards]}>
                                    <Text style={styles.tableCell}>{wildcardsText}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generado automáticamente por {appTitle} el {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
                </Text>
            </Page>
        </Document>
    );
}
