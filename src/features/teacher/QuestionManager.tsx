"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, AlertCircle, Type, Code2, ArrowLeft, Loader2, Zap, MessageSquare, Sparkles, CheckCircle2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import Link from "next/link";
import { createQuestionAction, deleteQuestionAction, updateQuestionAction, testQuestionWithAIAction, generateQuestionAction, generateAnswerAction } from "@/app/actions";

// Text Editor
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Code Editor
import Editor from "@monaco-editor/react";

export function QuestionManager({ evaluation }: { evaluation: any }) {
    const [isCreating, setIsCreating] = useState(false);

    // Question Form State
    const [type, setType] = useState("Text"); // "Text" | "Code"
    const [language, setLanguage] = useState("javascript");
    const [text, setText] = useState("**Enunciado de la Pregunta**\n\nEscribe aquí...");

    // Preview / Editor state
    const [codeValue, setCodeValue] = useState("// Escribe el código aquí...");

    // AI Test State
    const [testAnswer, setTestAnswer] = useState("");
    const [isTestingAI, setIsTestingAI] = useState(false);
    const [aiTestResult, setAiTestResult] = useState<{ scoreContribution: number, feedback: string, isCorrect: boolean } | null>(null);

    // Generation State
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
    const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantPrompt, setAssistantPrompt] = useState("");
    const [questionSize, setQuestionSize] = useState<"short" | "medium" | "long">("medium");
    const [questionOpenness, setQuestionOpenness] = useState<"concrete" | "balanced" | "open">("balanced");
    const [includeCode, setIncludeCode] = useState(false);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "expert">("medium");
    const [bloomTaxonomy, setBloomTaxonomy] = useState<"remember" | "understand" | "apply" | "analyze" | "evaluate" | "create">("apply");
    const [includeBoilerplate, setIncludeBoilerplate] = useState(false);
    const [includeTestCases, setIncludeTestCases] = useState(false);

    // AI UI State
    const [activeTestTab, setActiveTestTab] = useState("test");

    // Edit mode state
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

    const { resolvedTheme } = useTheme();
    const mode = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto";
    const formRef = useRef<HTMLFormElement>(null);

    const handleTestWithAI = async () => {
        if (!text) return;

        setIsTestingAI(true);
        setAiTestResult(null);
        try {
            // Switch to result tab to show loading or placeholder
            setActiveTestTab("result");

            // For testing, we send either testAnswer (custom input) or codeValue/text placeholder logic if empty
            const answerToTest = testAnswer || (type === "Code" ? codeValue : "");
            const result = await testQuestionWithAIAction(text, type, answerToTest);
            setAiTestResult(result);
        } catch (error) {
            console.error("Error testing with AI:", error);
        } finally {
            setIsTestingAI(false);
        }
    };

    const handleGenerateQuestion = async (styleModifier?: string) => {
        setIsGeneratingQuestion(true);
        try {
            // Combine user base prompt with style modifier if provided
            const combinedPrompt = styleModifier
                ? `${styleModifier}${assistantPrompt ? ` Basado en: ${assistantPrompt}` : ""}`
                : assistantPrompt;

            const generatedText = await generateQuestionAction(
                evaluation.title, type, language, combinedPrompt,
                questionSize, questionOpenness, includeCode,
                difficulty, bloomTaxonomy, includeBoilerplate, includeTestCases
            );
            setText(generatedText);
            setIsAssistantOpen(false);
            setAssistantPrompt("");
        } catch (error) {
            console.error("Error generating question:", error);
        } finally {
            setIsGeneratingQuestion(false);
        }
    };

    const handleGenerateAnswer = async () => {
        if (!text) return;
        setIsGeneratingAnswer(true);
        try {
            const generatedAnswer = await generateAnswerAction(text, type, language);
            setTestAnswer(generatedAnswer);
        } catch (error) {
            console.error("Error generating answer:", error);
        } finally {
            setIsGeneratingAnswer(false);
        }
    };

    if (isCreating) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold tracking-tight">{editingQuestionId ? "Editar Pregunta" : "Nueva Pregunta"}</h2>
                        <p className="text-muted-foreground">Configura el enunciado y valida la evaluación con IA.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            form="question-form"
                            type="submit"
                            size="sm"
                            className="h-9 px-4 font-bold"
                        >
                            {editingQuestionId ? "Guardar Cambios" : "Guardar Pregunta"}
                        </Button>
                        <Button variant="outline" size="sm" className="h-9" onClick={() => setIsCreating(false)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                    </div>
                </div>

                <form
                    ref={formRef}
                    id="question-form"
                    action={async (formData) => {
                        if (editingQuestionId) {
                            await updateQuestionAction(formData);
                        } else {
                            await createQuestionAction(formData);
                        }
                        setIsCreating(false);
                        setEditingQuestionId(null);
                        setText("**Enunciado de la Pregunta**\n\nEscribe aquí...");
                        setCodeValue("// Escribe el código aquí...");
                        setTestAnswer("");
                        setAiTestResult(null);
                    }}
                    className="flex flex-col gap-4"
                >
                    {editingQuestionId && <input type="hidden" name="questionId" value={editingQuestionId} />}
                    <input type="hidden" name="evaluationId" value={evaluation.id} />
                    <input type="hidden" name="text" value={text} />
                    <input type="hidden" name="type" value={type} />
                    <input type="hidden" name="language" value={language} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                        {/* Left Column: Editor markdown and settings */}
                        <div className="flex flex-col gap-3 border p-4 rounded-lg bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b pb-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-tight text-muted-foreground">
                                        <Edit className="h-4 w-4 text-primary" /> Diseño y Enunciado
                                    </h3>

                                    <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-[10px] gap-1 px-2 text-amber-600 hover:bg-amber-500/10 transition-all font-bold border border-amber-500/20 shadow-sm"
                                                title="Asistente de Generación con IA"
                                            >
                                                <Sparkles className="h-3 w-3" />
                                                Asistente IA
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[1000px] w-full">
                                            <DialogHeader className="pb-3 border-b">
                                                <DialogTitle className="flex items-center gap-2 text-base">
                                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                                    Asistente de Preguntas Gemini
                                                </DialogTitle>
                                                <DialogDescription className="text-xs">
                                                    Configura el enunciado y genera con IA.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="py-3 space-y-3">

                                                {/* === ROW 1: Prompt + Controls side by side === */}
                                                <div className="grid grid-cols-[1fr_auto] gap-4 items-start">

                                                    {/* Prompt (left, wide) */}
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1">
                                                            Tema / Contexto <span className="text-red-500">*</span>
                                                            <span className="text-muted-foreground font-normal normal-case">(obligatorio)</span>
                                                        </Label>
                                                        <textarea
                                                            required
                                                            className="w-full h-[76px] rounded-md border-2 border-amber-500/30 p-2.5 text-sm bg-muted/20 focus:outline-none focus:border-amber-500 transition-all resize-none"
                                                            placeholder="Ej: 'Bucles anidados en Python', 'Punteros en C++', 'Consultas SQL avanzadas'..."
                                                            value={assistantPrompt}
                                                            onChange={(e) => setAssistantPrompt(e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Extras switches (right, compact vertical) */}
                                                    <div className="space-y-1 min-w-[160px]">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60">Extras</Label>
                                                        <div className="space-y-1.5">
                                                            {[
                                                                { label: "Código en enunciado", value: includeCode, setter: setIncludeCode },
                                                                { label: "Boilerplate inicial", value: includeBoilerplate, setter: setIncludeBoilerplate },
                                                                { label: "Casos de prueba", value: includeTestCases, setter: setIncludeTestCases },
                                                            ].map((item) => (
                                                                <div key={item.label} className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md border bg-muted/10 border-muted">
                                                                    <span className="text-[9px] font-semibold">{item.label}</span>
                                                                    <Switch checked={item.value} onCheckedChange={item.setter} className="data-[state=checked]:bg-amber-600 scale-75 shrink-0" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* === ROW 2: 4 control groups in a single row === */}
                                                <div className="grid grid-cols-4 gap-3">

                                                    {/* Tamaño */}
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60">Tamaño</Label>
                                                        <div className="flex gap-1 p-0.5 bg-muted/30 rounded-md">
                                                            {(["short", "medium", "long"] as const).map((s) => (
                                                                <Button key={s} type="button" variant="ghost" size="sm"
                                                                    className={`flex-1 h-7 text-[9px] font-bold px-1 ${questionSize === s ? "bg-white dark:bg-zinc-800 shadow text-amber-600" : "text-muted-foreground"}`}
                                                                    onClick={() => setQuestionSize(s)}>
                                                                    {s === "short" ? "📝 Corta" : s === "medium" ? "📄 Media" : "📋 Larga"}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Apertura */}
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60">Apertura</Label>
                                                        <div className="flex gap-1 p-0.5 bg-muted/30 rounded-md">
                                                            {(["concrete", "balanced", "open"] as const).map((o) => (
                                                                <Button key={o} type="button" variant="ghost" size="sm"
                                                                    className={`flex-1 h-7 text-[9px] font-bold px-1 ${questionOpenness === o ? "bg-white dark:bg-zinc-800 shadow text-blue-600" : "text-muted-foreground"}`}
                                                                    onClick={() => setQuestionOpenness(o)}>
                                                                    {o === "concrete" ? "🎯 Concreta" : o === "balanced" ? "⚖️ Balance" : "🌐 Abierta"}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Dificultad */}
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60">Dificultad</Label>
                                                        <div className="flex gap-1 p-0.5 bg-muted/30 rounded-md">
                                                            {(["easy", "medium", "hard", "expert"] as const).map((d) => (
                                                                <Button key={d} type="button" variant="ghost" size="sm"
                                                                    className={`flex-1 h-7 text-[9px] font-bold px-1 ${difficulty === d
                                                                        ? d === "easy" ? "bg-green-100 dark:bg-green-900/40 text-green-700 shadow"
                                                                            : d === "medium" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 shadow"
                                                                                : d === "hard" ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 shadow"
                                                                                    : "bg-red-100 dark:bg-red-900/40 text-red-700 shadow"
                                                                        : "text-muted-foreground"}`}
                                                                    onClick={() => setDifficulty(d)}>
                                                                    {d === "easy" ? "🟢" : d === "medium" ? "🔵" : d === "hard" ? "🟠" : "🔴"} {d === "easy" ? "Básico" : d === "medium" ? "Medio" : d === "hard" ? "Alto" : "Experto"}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Bloom */}
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60">Taxonomía de Bloom</Label>
                                                        <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-md">
                                                            {(["remember", "understand", "apply", "analyze", "evaluate", "create"] as const).map((b) => (
                                                                <Button key={b} type="button" variant="ghost" size="sm"
                                                                    className={`flex-1 h-7 text-[8px] font-bold px-0.5 ${bloomTaxonomy === b ? "bg-white dark:bg-zinc-800 shadow text-violet-600" : "text-muted-foreground"}`}
                                                                    onClick={() => setBloomTaxonomy(b)}
                                                                    title={b === "remember" ? "Recordar" : b === "understand" ? "Comprender" : b === "apply" ? "Aplicar" : b === "analyze" ? "Analizar" : b === "evaluate" ? "Evaluar" : "Crear"}>
                                                                    {b === "remember" ? "Rec" : b === "understand" ? "Com" : b === "apply" ? "Apl" : b === "analyze" ? "Ana" : b === "evaluate" ? "Eva" : "Cre"}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* === ROW 3: Quick Styles in a single horizontal row === */}
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground/60">Estilos Rápidos (genera directamente)</Label>
                                                    <div className="flex gap-2">
                                                        {[
                                                            { label: "⚡ Ejercicio Práctico", prompt: "Crea un ejercicio práctico y desafiante." },
                                                            { label: "📚 Teoría Profunda", prompt: "Genera una pregunta teórica de análisis." },
                                                            { label: "🐛 Debug", prompt: "Pregunta de identificación y corrección de errores." },
                                                            { label: "🚀 Optimización", prompt: "Pregunta sobre mejora de eficiencia y rendimiento." },
                                                            { label: "🌍 Caso de Uso", prompt: "Escenario del mundo real para analizar o resolver." },
                                                        ].map((preset) => (
                                                            <Button key={preset.label} type="button" variant="outline" size="sm"
                                                                className={`flex-1 h-9 text-[10px] px-2 gap-1.5 border-muted hover:border-amber-500/60 hover:bg-amber-500/5 transition-all font-semibold ${!assistantPrompt ? "opacity-40" : ""}`}
                                                                onClick={() => assistantPrompt && handleGenerateQuestion(preset.prompt)}
                                                                disabled={isGeneratingQuestion || !assistantPrompt}>
                                                                {isGeneratingQuestion ? <Loader2 className="h-3 w-3 animate-spin shrink-0" /> : null}
                                                                {preset.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter className="border-t pt-3 flex-row items-center gap-3">
                                                {!assistantPrompt && (
                                                    <p className="text-[10px] text-amber-600 font-bold flex-1">⚠️ Escribe un tema/contexto para desbloquear la generación.</p>
                                                )}
                                                <Button
                                                    type="button"
                                                    className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-xs tracking-widest px-8 shadow-lg shadow-amber-600/20 disabled:opacity-40"
                                                    onClick={() => handleGenerateQuestion()}
                                                    disabled={isGeneratingQuestion || !assistantPrompt}
                                                >
                                                    {isGeneratingQuestion ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                    )}
                                                    {isGeneratingQuestion ? "Generando..." : "Generar Pregunta"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="type" className="text-[10px] uppercase font-bold text-muted-foreground/70">Tipo:</Label>
                                        <Select name="type" value={type} onValueChange={setType}>
                                            <SelectTrigger className="h-7 text-xs w-[100px] bg-muted/50">
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Text">Texto</SelectItem>
                                                <SelectItem value="Code">Código</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {type === "Code" && (
                                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                                            <Label htmlFor="language" className="text-[10px] uppercase font-bold text-muted-foreground/70">Lenguaje:</Label>
                                            <Select name="language" value={language} onValueChange={setLanguage}>
                                                <SelectTrigger className="h-7 text-xs w-[130px] bg-muted/50">
                                                    <SelectValue placeholder="Lenguaje" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                                    <SelectItem value="typescript">TypeScript</SelectItem>
                                                    <SelectItem value="python">Python</SelectItem>
                                                    <SelectItem value="java">Java</SelectItem>
                                                    <SelectItem value="csharp">C#</SelectItem>
                                                    <SelectItem value="cpp">C++</SelectItem>
                                                    <SelectItem value="arduino">Arduino (C++)</SelectItem>
                                                    <SelectItem value="php">PHP</SelectItem>
                                                    <SelectItem value="sql">SQL</SelectItem>
                                                    <SelectItem value="rust">Rust</SelectItem>
                                                    <SelectItem value="go">Go</SelectItem>
                                                    <SelectItem value="ruby">Ruby</SelectItem>
                                                    <SelectItem value="html">HTML/CSS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col pt-1" data-color-mode={mode}>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">Enunciado (Markdown)</Label>
                                <div className="flex-1 rounded-md overflow-hidden border bg-background/50">
                                    <MDEditor
                                        value={text}
                                        onChange={(val) => setText(val || "")}
                                        height="100%"
                                        preview="edit"
                                        className="h-full border-none min-h-[400px]"
                                    />
                                </div>
                            </div>
                        </div >

                        {/* Right Column: AI Test Area */}
                        < div className="flex flex-col gap-3 border p-4 rounded-lg bg-card shadow-sm" >
                            <div className="flex items-center justify-between border-b pb-2 mb-1">
                                <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-tight text-muted-foreground">
                                    <Sparkles className="h-4 w-4 text-amber-500" /> Prueba tu Pregunta con IA
                                </h3>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 text-xs gap-1.5 font-bold hover:bg-amber-500 hover:text-white transition-colors"
                                    onClick={handleTestWithAI}
                                    disabled={isTestingAI || !text}
                                >
                                    {isTestingAI ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-3 w-3" />
                                    )}
                                    {isTestingAI ? "Evaluando..." : "Evaluar con Gemini"}
                                </Button>
                            </div>

                            <Tabs value={activeTestTab} onValueChange={setActiveTestTab} className="flex-1 flex flex-col gap-2">
                                <TabsList className="grid w-full grid-cols-2 h-8">
                                    <TabsTrigger value="test" className="text-[10px] font-bold uppercase gap-1.5">
                                        <MessageSquare className="h-3 w-3" /> Prueba
                                    </TabsTrigger>
                                    <TabsTrigger value="result" className="text-[10px] font-bold uppercase gap-1.5">
                                        <Sparkles className="h-3 w-3" /> Resultado IA
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="test" className="flex-1 flex flex-col gap-2 m-0 data-[state=inactive]:hidden">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">Escribe una respuesta de prueba:</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 text-[9px] gap-1 px-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                            onClick={handleGenerateAnswer}
                                            disabled={isGeneratingAnswer || !text}
                                        >
                                            {isGeneratingAnswer ? <Loader2 className="h-2 w-2 animate-spin" /> : <Sparkles className="h-2 w-2" />}
                                            Sugerir Respuesta
                                        </Button>
                                    </div>

                                    {type === "Text" ? (
                                        <textarea
                                            className="flex-1 min-h-[300px] w-full rounded-md border border-input bg-muted/20 px-4 py-3 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-all placeholder:text-muted-foreground/50 leading-relaxed font-mono"
                                            placeholder="Escribre una posible respuesta de un estudiante..."
                                            value={testAnswer}
                                            onChange={(e) => setTestAnswer(e.target.value)}
                                        />
                                    ) : (
                                        <div className="flex-1 border rounded-md overflow-hidden min-h-[350px] bg-background">
                                            <Editor
                                                height="100%"
                                                language={language === "arduino" ? "cpp" : (language || "javascript")}
                                                theme={mode === "dark" ? "vs-dark" : "light"}
                                                value={testAnswer}
                                                onChange={(val) => setTestAnswer(val || "")}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 13,
                                                    readOnly: false,
                                                    padding: { top: 12 },
                                                    quickSuggestions: true,
                                                    wordWrap: "on"
                                                }}
                                            />
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="result" className="flex-1 flex flex-col gap-2 m-0 data-[state=inactive]:hidden">
                                    {isTestingAI ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/5">
                                            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-4" />
                                            <p className="text-sm font-medium">Analizando con Gemini...</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Esto puede tardar unos segundos</p>
                                        </div>
                                    ) : aiTestResult ? (
                                        <div className={`flex-1 p-4 rounded-lg border animate-in fade-in zoom-in-95 duration-300 ${aiTestResult.isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${aiTestResult.isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                        {aiTestResult.isCorrect ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-sm font-black uppercase ${aiTestResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                            {aiTestResult.isCorrect ? "Correcto / Aceptable" : "Incorrecto / Insuficiente"}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground">Calificación estimada por IA</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-primary">
                                                        {aiTestResult.scoreContribution.toFixed(1)}
                                                        <span className="text-xs text-muted-foreground ml-1">/ 5.0</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground/70 block mb-2">Retroalimentación detallada:</Label>
                                                    <div className="text-xs leading-relaxed text-muted-foreground bg-muted/20 p-3 rounded border italic">
                                                        "{aiTestResult.feedback}"
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-8 text-xs gap-1.5 border-amber-500/20 hover:bg-amber-500/10 text-amber-700 font-bold"
                                                    onClick={handleGenerateAnswer}
                                                    disabled={isGeneratingAnswer}
                                                >
                                                    {isGeneratingAnswer ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                                    Ver Respuesta Ideal Sugerida
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/10 opacity-60">
                                            <Info className="h-10 w-10 text-muted-foreground mb-3" />
                                            <p className="text-xs text-muted-foreground max-w-[220px]">
                                                Todavía no hay resultados. Ve a la pestaña de <strong>Prueba</strong> y pulsa <strong>Evaluar con Gemini</strong>.
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div >
                    </div >

                    {/* Bottom Save button removed as it is now at the top */}
                </form >
            </div >
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link href="/dashboard/teacher/evaluations">
                        <Button variant="link" className="p-0 h-auto text-muted-foreground mb-2">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Evaluaciones
                        </Button>
                    </Link>
                    <h2 className="text-xl font-bold tracking-tight">Preguntas de: {evaluation.title}</h2>
                </div>

                <Button onClick={() => {
                    setIsCreating(true);
                    setEditingQuestionId(null);
                    setType("Text");
                    setLanguage("javascript");
                    setText("**Enunciado de la Pregunta**\n\nEscribe aquí...");
                    setCodeValue("// Escribe el código aquí...");
                    setTestAnswer("");
                    setAiTestResult(null);
                }}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Pregunta
                </Button>
            </div>

            <div className="w-full overflow-x-auto rounded-md border bg-card">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Orden</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Enunciado Breve</TableHead>
                            <TableHead>Fecha de Creación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evaluation.questions.map((question: any, index: number) => (
                            <TableRow key={question.id}>
                                <TableCell className="font-medium text-center">
                                    {index + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {question.type === "Text" ? (
                                            <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md text-xs font-semibold">
                                                <Type className="h-3 w-3" /> Texto
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md text-xs font-semibold">
                                                <Code2 className="h-3 w-3" /> Código ({question.language})
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                    {question.text.replace(/[#*`_~]/g, "").substring(0, 60)}...
                                </TableCell>
                                <TableCell>
                                    {format(new Date(question.createdAt), "dd/MM/yyyy HH:mm")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Editar"
                                            onClick={() => {
                                                setEditingQuestionId(question.id);
                                                setType(question.type);
                                                setLanguage(question.language || "javascript");
                                                setText(question.text);
                                                setIsCreating(true);
                                                setTestAnswer("");
                                                setAiTestResult(null);
                                                // Default code value preview if they swap back and forth
                                                setCodeValue("// Escribe el código aquí...");
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <form
                                                    action={async (formData) => {
                                                        await deleteQuestionAction(formData);
                                                    }}
                                                >
                                                    <input type="hidden" name="questionId" value={question.id} />
                                                    <input type="hidden" name="evaluationId" value={evaluation.id} />
                                                    <DialogHeader>
                                                        <DialogTitle>Confirmar eliminación</DialogTitle>
                                                        <DialogDescription>
                                                            Escribe <strong>ELIMINAR</strong> para confirmar el borrado de esta pregunta.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid grid-cols-4 items-center gap-4 py-4">
                                                        <Label htmlFor={`confirm-${question.id}`} className="text-right">
                                                            Confirmación
                                                        </Label>
                                                        <Input
                                                            id={`confirm-${question.id}`}
                                                            name="confirmText"
                                                            placeholder="ELIMINAR"
                                                            pattern="^ELIMINAR$"
                                                            required
                                                            className="col-span-3"
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit" variant="destructive">
                                                            Confirmar eliminación
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {evaluation.questions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Esta evaluación aún no tiene preguntas creadas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
