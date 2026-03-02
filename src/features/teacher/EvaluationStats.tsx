"use client";

import { useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Doughnut, Pie, Scatter } from "react-chartjs-2";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Title, Tooltip, Legend);

interface EvaluationStatsProps {
    submissions: any[];
    totalQuestions: number;
    questions?: Array<{ id: string; text: string; type: string }>;
}

function generateColors(count: number) {
    const palette = [
        "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
        "#06b6d4", "#f97316", "#10b981", "#ec4899", "#64748b",
        "#a855f7", "#0ea5e9", "#84cc16", "#e11d48", "#14b8a6",
        "#f43f5e", "#6366f1", "#d97706", "#2dd4bf", "#fb923c",
    ];
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}

const BUCKET_LABELS = ["0 – 1", "1 – 2", "2 – 3", "3 – 4", "4 – 5"];
const BUCKET_COLORS_BG = [
    "rgba(239,68,68,0.75)", "rgba(249,115,22,0.75)",
    "rgba(234,179,8,0.75)", "rgba(34,197,94,0.75)", "rgba(16,185,129,0.75)",
];

interface ModalState {
    open: boolean;
    title: string;
    students: { name: string; email: string; score: number | null; submitted: boolean }[];
}

export function EvaluationStats({ submissions, totalQuestions, questions = [] }: EvaluationStatsProps) {
    const [modal, setModal] = useState<ModalState>({ open: false, title: "", students: [] });
    const [questionModal, setQuestionModal] = useState<{
        open: boolean;
        index: number;
        text: string;
        avg: number | null;
        type: string;
    }>({ open: false, index: 0, text: "", avg: null, type: "" });

    const submitted = submissions.filter(s => s.submittedAt);
    const inProgress = submissions.filter(s => !s.submittedAt);

    if (submissions.length === 0) return null;

    const scores = submitted.map(s => Number(s.score) || 0);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passCount = scores.filter(s => s >= 3.0).length;
    const failCount = scores.filter(s => s < 3.0).length;

    const buckets: any[][] = [[], [], [], [], []];
    submitted.forEach(s => {
        const score = Number(s.score) || 0;
        const idx = Math.min(Math.floor(score), 4);
        buckets[idx].push(s);
    });

    const openModal = (title: string, list: any[]) => {
        setModal({
            open: true,
            title,
            students: list.map(s => ({
                name: s.user?.name || "—",
                email: s.user?.email || "—",
                score: s.score !== undefined ? Number(s.score) : null,
                submitted: !!s.submittedAt,
            })),
        });
    };

    /* ── Bar chart (distribution) ── */
    const barData = {
        labels: BUCKET_LABELS,
        datasets: [{
            label: "Estudiantes",
            data: buckets.map(b => b.length),
            backgroundColor: BUCKET_COLORS_BG,
            borderColor: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"],
            borderWidth: 1.5,
            borderRadius: 4,
        }],
    };

    const barOptions: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "rgba(148,163,184,0.15)" } },
            x: { grid: { display: false } },
        },
        onClick: (_: any, elements: any[]) => {
            if (!elements.length) return;
            const i = elements[0].index;
            if (buckets[i].length > 0) openModal(`Rango ${BUCKET_LABELS[i]} (${buckets[i].length})`, buckets[i]);
        },
        onHover: (_: any, elements: any[], chart: any) => {
            chart.canvas.style.cursor = elements.length ? "pointer" : "default";
        },
    };

    /* ── Doughnut chart ── */
    const doughnutCategories = [
        submitted.filter(s => (Number(s.score) || 0) >= 3.0),
        submitted.filter(s => (Number(s.score) || 0) < 3.0),
        inProgress,
    ];
    const doughnutLabels = ["Aprobados", "Reprobados", "En progreso"];

    const doughnutData = {
        labels: doughnutLabels,
        datasets: [{
            data: doughnutCategories.map(g => g.length),
            backgroundColor: ["rgba(34,197,94,0.8)", "rgba(239,68,68,0.8)", "rgba(148,163,184,0.8)"],
            borderColor: ["#22c55e", "#ef4444", "#94a3b8"],
            borderWidth: 2,
        }],
    };

    const doughnutOptions: any = {
        responsive: true, maintainAspectRatio: false, cutout: "60%",
        plugins: { legend: { position: "bottom", labels: { padding: 12, boxWidth: 12 } } },
        onClick: (_: any, elements: any[]) => {
            if (!elements.length) return;
            const i = elements[0].index;
            if (doughnutCategories[i].length > 0) openModal(`${doughnutLabels[i]}`, doughnutCategories[i]);
        },
        onHover: (_: any, elements: any[], chart: any) => {
            chart.canvas.style.cursor = elements.length ? "pointer" : "default";
        },
    };

    /* ── Pie chart (per student) ── */
    const studentColors = generateColors(submitted.length);
    const pieData = {
        labels: submitted.map(s => `${s.user?.name || "Estudiante"} (${Number(s.score || 0).toFixed(2)})`),
        datasets: [{
            data: submitted.map(s => Number(s.score || 0).toFixed(2)),
            backgroundColor: studentColors.map(c => c + "cc"),
            borderColor: studentColors,
            borderWidth: 2,
        }],
    };

    const pieOptions: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: "right", labels: { padding: 10, boxWidth: 12, font: { size: 11 } } },
            tooltip: { callbacks: { label: (ctx: any) => ` Nota: ${ctx.raw}` } },
        },
        onClick: (_: any, elements: any[]) => {
            if (!elements.length) return;
            const s = submitted[elements[0].index];
            if (s) openModal(s.user?.name || "Estudiante", [s]);
        },
        onHover: (_: any, elements: any[], chart: any) => {
            chart.canvas.style.cursor = elements.length ? "pointer" : "default";
        },
    };

    /* ── Per-question performance ── */
    const questionAvgs = questions.map((q, index) => {
        const answersForQ = submitted
            .flatMap(s => (s.answersList || []))
            .filter((a: any) => a.questionId === q.id && a.score !== null);
        const avg = answersForQ.length > 0
            ? answersForQ.reduce((acc: number, a: any) => acc + Number(a.score), 0) / answersForQ.length
            : null;
        return { label: `P${index + 1}`, fullText: q.text, avg, type: q.type, id: q.id };
    });

    const questionChartData = {
        labels: questionAvgs.map(q => q.label),
        datasets: [{
            label: "Nota promedio",
            data: questionAvgs.map(q => q.avg !== null ? Number(q.avg.toFixed(2)) : 0),
            backgroundColor: questionAvgs.map(q =>
                q.avg === null ? "rgba(148,163,184,0.4)"
                    : q.avg >= 3 ? "rgba(34,197,94,0.75)"
                        : "rgba(239,68,68,0.75)"
            ),
            borderColor: questionAvgs.map(q =>
                q.avg === null ? "#94a3b8" : q.avg >= 3 ? "#22c55e" : "#ef4444"
            ),
            borderWidth: 1.5,
            borderRadius: 4,
        }],
    };

    const questionChartOptions: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items: any[]) => {
                        const idx = items[0].dataIndex;
                        return `Pregunta ${idx + 1}`;
                    },
                    label: (ctx: any) => ` Promedio: ${ctx.raw} / 5.0`,
                    afterLabel: (ctx: any) => {
                        const q = questionAvgs[ctx.dataIndex];
                        const truncated = q.fullText.replace(/```[\s\S]*?```/g, "[código]").trim().slice(0, 60);
                        return truncated + (q.fullText.length > 60 ? "…" : "");
                    },
                },
            },
        },
        scales: {
            y: { min: 0, max: 5, ticks: { stepSize: 1 }, grid: { color: "rgba(148,163,184,0.15)" } },
            x: { grid: { display: false } },
        },
        onClick: (_: any, elements: any[]) => {
            if (!elements.length) return;
            const idx = elements[0].index;
            const q = questionAvgs[idx];
            if (q) {
                setQuestionModal({ open: true, index: idx, text: q.fullText, avg: q.avg, type: q.type });
            }
        },
        onHover: (_: any, elements: any[], chart: any) => {
            chart.canvas.style.cursor = elements.length ? "pointer" : "default";
        },
    };

    /* ── Scatter: Nota vs Expulsiones ── */
    const scatterPoints = submitted.map(s => ({
        x: Number(s.expulsions || 0),
        y: Number(s.score || 0),
        sub: s,
    }));

    const scatterData = {
        datasets: [{
            label: "Estudiantes",
            data: scatterPoints.map(p => ({ x: p.x, y: p.y })),
            backgroundColor: scatterPoints.map(p =>
                p.y >= 3 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)"
            ),
            borderColor: scatterPoints.map(p =>
                p.y >= 3 ? "#22c55e" : "#ef4444"
            ),
            pointRadius: 7,
            pointHoverRadius: 10,
            borderWidth: 2,
        }],
    };

    const scatterOptions: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const p = scatterPoints[ctx.dataIndex];
                        return `${p.sub.user?.name || "Estudiante"}: Nota ${p.y.toFixed(2)}, ${p.x} expulsión${p.x !== 1 ? "es" : ""}`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Expulsiones", color: "#64748b" },
                min: 0, ticks: { stepSize: 1 },
                grid: { color: "rgba(148,163,184,0.15)" },
            },
            y: {
                title: { display: true, text: "Nota Final", color: "#64748b" },
                min: 0, max: 5, ticks: { stepSize: 1 },
                grid: { color: "rgba(148,163,184,0.15)" },
            },
        },
        onClick: (_: any, elements: any[]) => {
            if (!elements.length) return;
            const p = scatterPoints[elements[0].index];
            if (p) openModal(p.sub.user?.name || "Estudiante", [p.sub]);
        },
        onHover: (_: any, elements: any[], chart: any) => {
            chart.canvas.style.cursor = elements.length ? "pointer" : "default";
        },
    };

    return (
        <div className="space-y-4 mt-8">
            <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Estadísticas de la Evaluación</h3>
                <p className="text-sm text-muted-foreground">Haz clic en los gráficos para ver los estudiantes de cada segmento</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Estudiantes", value: submissions.length, color: "text-foreground" },
                    { label: "Nota Promedio", value: avgScore.toFixed(2), color: "text-blue-600 dark:text-blue-400" },
                    { label: "Nota Máxima", value: maxScore.toFixed(2), color: "text-green-600 dark:text-green-400" },
                    { label: "Nota Mínima", value: submitted.length === 0 ? "—" : minScore.toFixed(2), color: submitted.length === 0 ? "text-muted-foreground" : "text-red-600 dark:text-red-400" },
                ].map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border bg-card p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide">{kpi.label}</span>
                        <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
                    </div>
                ))}
            </div>

            {/* Charts row 1: Distribution + State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Distribución de Notas</p>
                    <p className="text-xs text-muted-foreground mb-3">Clic en una barra para ver los estudiantes del rango</p>
                    <div className="h-52"><Bar data={barData} options={barOptions} /></div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Estado General</p>
                    <p className="text-xs text-muted-foreground mb-3">Clic en un segmento para ver los estudiantes</p>
                    <div className="h-52"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                        <div><div className="font-bold text-green-600 dark:text-green-400">{passCount}</div><div className="text-xs text-muted-foreground">Aprobados</div></div>
                        <div><div className="font-bold text-red-600 dark:text-red-400">{failCount}</div><div className="text-xs text-muted-foreground">Reprobados</div></div>
                        <div><div className="font-bold text-slate-500">{inProgress.length}</div><div className="text-xs text-muted-foreground">En Progreso</div></div>
                    </div>
                </div>
            </div>

            {/* Rendimiento por pregunta */}
            {questions.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">📝 Rendimiento por Pregunta</p>
                    <p className="text-xs text-muted-foreground mb-4">Nota promedio obtenida en cada pregunta · Verde ≥ 3.0 · Rojo &lt; 3.0 · Clic para ver estudiantes</p>
                    <div className="h-56"><Bar data={questionChartData} options={questionChartOptions} /></div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {questionAvgs.map((q, i) => (
                            <div key={q.id} className="text-xs rounded border bg-muted/20 px-2 py-1.5">
                                <span className="font-bold">P{i + 1}</span>
                                <span className={`ml-2 font-mono ${q.avg === null ? "text-muted-foreground" : q.avg >= 3 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                    {q.avg !== null ? q.avg.toFixed(2) : "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nota vs Expulsiones scatter */}
            {submitted.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">📊 Nota vs Expulsiones</p>
                    <p className="text-xs text-muted-foreground mb-4">
                        Correlación entre expulsiones y nota final · <span className="text-green-600">Verde</span> = aprobado · <span className="text-red-500">Rojo</span> = reprobado · Clic en un punto para ver el estudiante
                    </p>
                    <div className="h-64"><Scatter data={scatterData} options={scatterOptions} /></div>
                </div>
            )}

            {/* Pie per student */}
            {submitted.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Nota por Estudiante</p>
                    <p className="text-xs text-muted-foreground mb-4">Clic en un segmento para ver el detalle del estudiante</p>
                    <div className="h-72"><Pie data={pieData} options={pieOptions} /></div>
                </div>
            )}

            {/* Top Students ranking */}
            {submitted.length > 0 && (() => {
                const ranked = [...submitted].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
                const topData = {
                    labels: ranked.map((s, i) => `#${i + 1} ${(s.user?.name || "Estudiante").split(" ").slice(0, 2).join(" ")}`),
                    datasets: [{
                        label: "Nota",
                        data: ranked.map(s => Number(s.score || 0).toFixed(2)),
                        backgroundColor: ranked.map(s => (Number(s.score) || 0) >= 3 ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)"),
                        borderColor: ranked.map(s => (Number(s.score) || 0) >= 3 ? "#22c55e" : "#ef4444"),
                        borderWidth: 1.5, borderRadius: 4,
                    }],
                };
                const topOptions: any = {
                    indexAxis: "y" as const, responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` Nota: ${ctx.raw} / 5.0` } } },
                    scales: {
                        x: { min: 0, max: 5, ticks: { stepSize: 1 }, grid: { color: "rgba(148,163,184,0.15)" } },
                        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    },
                    onClick: (_: any, elements: any[]) => {
                        if (!elements.length) return;
                        const s = ranked[elements[0].index];
                        if (s) openModal(s.user?.name || "Estudiante", [s]);
                    },
                    onHover: (_: any, elements: any[], chart: any) => { chart.canvas.style.cursor = elements.length ? "pointer" : "default"; },
                };
                return (
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">🏆 Ranking de Estudiantes</p>
                            <span className="text-xs text-muted-foreground">Ordenado por nota</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Clic en una barra para ver el detalle del estudiante</p>
                        <div style={{ height: `${Math.max(200, ranked.length * 36)}px` }}>
                            <Bar data={topData} options={topOptions} />
                        </div>
                    </div>
                );
            })()}

            {/* Pass rate */}
            {submitted.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tasa de Aprobación</span>
                        <span className="text-sm font-bold">{((passCount / submitted.length) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${(passCount / submitted.length) * 100}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{passCount} aprobados de {submitted.length} enviados</span>
                        <span>Mínimo aprobatorio: 3.0</span>
                    </div>
                </div>
            )}

            {/* Top Expulsions */}
            {(() => {
                const withExpulsions = submissions.filter(s => (s.expulsions || 0) > 0)
                    .sort((a, b) => (b.expulsions || 0) - (a.expulsions || 0));
                if (withExpulsions.length === 0) return null;
                const maxExp = Math.max(...withExpulsions.map(s => s.expulsions || 0));
                const expColors = withExpulsions.map(s => {
                    const r = (s.expulsions || 0) / maxExp;
                    return r <= 0.33 ? "rgba(245,158,11,0.8)" : r <= 0.66 ? "rgba(249,115,22,0.8)" : "rgba(239,68,68,0.8)";
                });
                const expBorder = withExpulsions.map(s => {
                    const r = (s.expulsions || 0) / maxExp;
                    return r <= 0.33 ? "#f59e0b" : r <= 0.66 ? "#f97316" : "#ef4444";
                });
                const expData = {
                    labels: withExpulsions.map((s, i) => `#${i + 1} ${(s.user?.name || "Estudiante").split(" ").slice(0, 2).join(" ")}`),
                    datasets: [{ label: "Expulsiones", data: withExpulsions.map(s => s.expulsions || 0), backgroundColor: expColors, borderColor: expBorder, borderWidth: 1.5, borderRadius: 4 }],
                };
                const expOptions: any = {
                    indexAxis: "y" as const, responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.raw} expulsión${ctx.raw !== 1 ? "es" : ""}` } } },
                    scales: {
                        x: { min: 0, ticks: { stepSize: 1 }, grid: { color: "rgba(148,163,184,0.15)" } },
                        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    },
                    onClick: (_: any, elements: any[]) => {
                        if (!elements.length) return;
                        const s = withExpulsions[elements[0].index];
                        if (s) openModal(`${s.user?.name || "Estudiante"} — Expulsiones`, [s]);
                    },
                    onHover: (_: any, elements: any[], chart: any) => { chart.canvas.style.cursor = elements.length ? "pointer" : "default"; },
                };
                return (
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">🚨 Top Expulsiones</p>
                            <span className="text-xs text-muted-foreground">Mayor cantidad de expulsiones</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">{withExpulsions.length} estudiante{withExpulsions.length !== 1 ? "s" : ""} con expulsiones · Clic para ver detalle</p>
                        <div style={{ height: `${Math.max(150, withExpulsions.length * 38)}px` }}>
                            <Bar data={expData} options={expOptions} />
                        </div>
                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" /> Bajo</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" /> Medio</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Alto</span>
                        </div>
                    </div>
                );
            })()}

            {/* Modal de Detalle de Pregunta (Markdown) */}
            <Dialog open={questionModal.open} onOpenChange={(open) => setQuestionModal(m => ({ ...m, open }))}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span>Pregunta {questionModal.index + 1}</span>
                            <Badge variant="outline">{questionModal.type}</Badge>
                            {questionModal.avg !== null && (
                                <Badge className={questionModal.avg >= 3 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                    Promedio: {questionModal.avg.toFixed(2)}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{questionModal.text}</ReactMarkdown>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => {
                                const q = questions[questionModal.index];
                                const studentsWithAnswer = submitted.filter(s =>
                                    (s.answersList || []).some((a: any) => a.questionId === q.id)
                                );
                                setQuestionModal(m => ({ ...m, open: false }));
                                setTimeout(() => {
                                    openModal(`Pregunta ${questionModal.index + 1} — Rendimiento`, studentsWithAnswer);
                                }, 200);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Ver estudiantes ({submitted.filter(s => (s.answersList || []).some((a: any) => a.questionId === questions[questionModal.index]?.id)).length})
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Lista de Estudiantes */}
            <Dialog open={modal.open} onOpenChange={(open) => setModal(m => ({ ...m, open }))}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{modal.title}</DialogTitle>
                        <DialogDescription>
                            {modal.students.length} estudiante{modal.students.length !== 1 ? "s" : ""} en este grupo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {modal.students.map((s, i) => (
                            <div key={i} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{s.name}</span>
                                    <span className="text-xs text-muted-foreground">{s.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {s.score !== null && <span className="text-sm font-bold">{Number(s.score).toFixed(2)}</span>}
                                    <Badge variant={!s.submitted ? "secondary" : s.score !== null && s.score >= 3 ? "default" : "destructive"}>
                                        {!s.submitted ? "En progreso" : s.score !== null && s.score >= 3 ? "Aprobado" : "Reprobado"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
