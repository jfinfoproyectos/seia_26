import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { formatDateTime } from "@/lib/dateUtils";
import { AIInsightsResponse } from "@/services/gemini/evaluationAnalysisService";

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
    header: {
        marginBottom: 20, paddingBottom: 10,
        borderBottomWidth: 2, borderBottomColor: "#f59e0b", borderBottomStyle: "solid",
    },
    appTitle: { fontSize: 24, fontWeight: "bold", color: "#f59e0b", marginBottom: 2 },
    reportTitle: { fontSize: 14, color: "#64748b", fontWeight: "bold" },
    infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20, marginTop: 12, backgroundColor: "#fffbeb", padding: 10, borderRadius: 4 },
    infoItem: { width: "50%", marginBottom: 4, fontSize: 9 },
    labelText: { fontWeight: "bold", color: "#92400e" },

    section: { marginBottom: 15 },
    sectionTitle: {
        fontSize: 12, fontWeight: "bold", color: "#92400e",
        backgroundColor: "#fef3c7", padding: 5, borderRadius: 2,
        marginBottom: 8, textTransform: "uppercase"
    },

    analysisBox: {
        padding: 12, backgroundColor: "#f8fafc", borderRadius: 4,
        borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid",
        marginBottom: 15, lineHeight: 1.5
    },

    listItem: { flexDirection: "row", marginBottom: 5, paddingLeft: 10 },
    bullet: { width: 10, color: "#f59e0b", fontWeight: "bold" },
    listText: { flex: 1, color: "#334155" },

    footer: {
        position: "absolute", bottom: 30, left: 40, right: 40,
        paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0", borderStyle: "solid",
        fontSize: 8, color: "#94a3b8", textAlign: "center",
    },
});

interface AIInsightsPDFProps {
    evaluationTitle: string;
    courseName: string;
    teacherName: string;
    insights: AIInsightsResponse;
    stats: {
        avgScore: string;
        passRate: string;
        totalStudents: number;
    };
    plagiarismMatches?: any[];
}

export function AIInsightsPDF({
    evaluationTitle,
    courseName,
    teacherName,
    insights,
    stats,
    plagiarismMatches = []
}: AIInsightsPDFProps) {
    const today = formatDateTime(new Date(), "dd/MM/yyyy HH:mm");

    return (
        <Document title={`AI Insights - ${evaluationTitle}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.appTitle}>SmartClass AI</Text>
                    <Text style={styles.reportTitle}>Análisis Pedagógico: Insights del Grupo</Text>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}><Text><Text style={styles.labelText}>Evaluación: </Text>{evaluationTitle}</Text></View>
                    <View style={styles.infoItem}><Text><Text style={styles.labelText}>Curso: </Text>{courseName}</Text></View>
                    <View style={styles.infoItem}><Text><Text style={styles.labelText}>Docente: </Text>{teacherName}</Text></View>
                    <View style={styles.infoItem}><Text><Text style={styles.labelText}>Fecha Reporte: </Text>{today}</Text></View>
                </View>

                {/* Quick Stats Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen de Desempeño</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, padding: 8, backgroundColor: "#f1f5f9", borderRadius: 4, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>{stats.totalStudents}</Text>
                            <Text style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase" }}>Estudiantes</Text>
                        </View>
                        <View style={{ flex: 1, padding: 8, backgroundColor: "#eff6ff", borderRadius: 4, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#2563eb" }}>{stats.avgScore}</Text>
                            <Text style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase" }}>Nota Promedio</Text>
                        </View>
                        <View style={{ flex: 1, padding: 8, backgroundColor: "#f0fdf4", borderRadius: 4, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#16a34a" }}>{stats.passRate}%</Text>
                            <Text style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase" }}>Tasa Aprobación</Text>
                        </View>
                    </View>
                </View>

                {/* Global Analysis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Análisis Global</Text>
                    <View style={styles.analysisBox}>
                        <Text>{insights.globalAnalysis}</Text>
                    </View>
                </View>

                {/* Strengths */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fortalezas del Grupo</Text>
                    {insights.strengths.map((s, i) => (
                        <View key={i} style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.listText}>{s}</Text>
                        </View>
                    ))}
                </View>

                {/* Weaknesses */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { backgroundColor: "#fef2f2", color: "#991b1b" }]}>Debilidades Detectadas</Text>
                    {insights.weaknesses.map((w, i) => (
                        <View key={i} style={styles.listItem}>
                            <Text style={[styles.bullet, { color: "#ef4444" }]}>•</Text>
                            <Text style={styles.listText}>{w}</Text>
                        </View>
                    ))}
                </View>

                {/* Common Errors Diagnosis */}
                {insights.commonErrors && insights.commonErrors.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { backgroundColor: "#ffedd5", color: "#9a3412" }]}>Diagnóstico de Errores Comunes (Clústeres)</Text>
                        {insights.commonErrors.map((err, i) => (
                            <View key={i} style={[styles.analysisBox, { marginBottom: 8, padding: 8, backgroundColor: "#fff7ed" }]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                                    <Text style={{ fontWeight: "bold", color: "#c2410c", fontSize: 10 }}>{err.concept}</Text>
                                    <Text style={{ fontSize: 8, color: "#9a3412", fontWeight: "bold" }}>Prevalencia: {err.prevalence}</Text>
                                </View>
                                <Text style={{ fontSize: 9, color: "#475569" }}>{err.description}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Recommendations */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { backgroundColor: "#ecfdf5", color: "#065f46" }]}>Recomendaciones Estratégicas</Text>
                    {insights.recommendations.map((r, i) => (
                        <View key={i} style={styles.listItem}>
                            <Text style={[styles.bullet, { color: "#10b981" }]}>•</Text>
                            <Text style={styles.listText}>{r}</Text>
                        </View>
                    ))}
                </View>

                {/* Plagiarism Hallucinations/Findings */}
                {plagiarismMatches.length > 0 && (
                    <View style={styles.section} break>
                        <Text style={[styles.sectionTitle, { backgroundColor: "#fef2f2", color: "#991b1b" }]}>Integridad Académica: Hallazgos de Similitud</Text>
                        {plagiarismMatches.filter(m => m.similarityScore > 0.4).map((match, i) => (
                            <View key={i} style={[styles.analysisBox, { marginBottom: 10, borderColor: match.isSuspicious ? "#f87171" : "#fbbf24", backgroundColor: match.isSuspicious ? "#fff1f1" : "#fffbeb" }]}>
                                <Text style={{ fontWeight: "bold", fontSize: 10, marginBottom: 4 }}>
                                    {match.studentA.name} ↔ {match.studentB.name} | Similitud: {(match.similarityScore * 100).toFixed(0)}%
                                </Text>
                                <Text style={{ fontSize: 9, color: "#475569", fontStyle: "italic" }}>
                                    Razón IA: {match.reason}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.footer}>
                    Este reporte fue generado automáticamente por la IA de SmartClass para brindar apoyo pedagógico al docente.
                </Text>
            </Page>
        </Document>
    );
}
