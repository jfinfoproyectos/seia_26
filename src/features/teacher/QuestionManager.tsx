"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, AlertCircle, Type, Code2, ArrowLeft, Loader2, Zap, MessageSquare, Sparkles, CheckCircle2, XCircle, Info, Eye } from "lucide-react";
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
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
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);

    // Question Form State
    const [type, setType] = useState("Text"); // "Text" | "Code"
    const [language, setLanguage] = useState("javascript");
    const [text, setText] = useState("**Enunciado de la Pregunta**\n\nEscribe aquí...");
    const [codeValue, setCodeValue] = useState("// Escribe el código aquí...");

    // AI Status
    const [testAnswer, setTestAnswer] = useState("");
    const [isTestingAI, setIsTestingAI] = useState(false);
    const [aiTestResult, setAiTestResult] = useState<{ scoreContribution: number, feedback: string, isCorrect: boolean } | null>(null);
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
    const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantPrompt, setAssistantPrompt] = useState("");

    // AI Config
    const [questionSize, setQuestionSize] = useState<"short" | "medium" | "long">("medium");
    const [questionOpenness, setQuestionOpenness] = useState<"concrete" | "balanced" | "open">("balanced");
    const [includeCode, setIncludeCode] = useState(false);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "expert">("medium");
    const [bloomTaxonomy, setBloomTaxonomy] = useState<"remember" | "understand" | "apply" | "analyze" | "evaluate" | "create">("apply");
    const [includeBoilerplate, setIncludeBoilerplate] = useState(false);
    const [includeTestCases, setIncludeTestCases] = useState(false);
    const [activeTestTab, setActiveTestTab] = useState("test");

    // Edit mode state
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const { resolvedTheme } = useTheme();
    const mode = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto";
    const formRef = useRef<HTMLFormElement>(null);

    const handleOpenForm = (question?: any, index?: number) => {
        if (question) {
            setEditingQuestionId(question.id);
            setEditingQuestionIndex(index ?? null);
            setType(question.type);
            setLanguage(question.language || "javascript");
            setText(question.text);
            setCodeValue("// Escribe el código aquí...");
        } else {
            setEditingQuestionId(null);
            setEditingQuestionIndex(null);
            setType("Text");
            setLanguage("javascript");
            setText("**Enunciado de la Pregunta**\n\nEscribe aquí...");
            setCodeValue("// Escribe el código aquí...");
        }
        setTestAnswer("");
        setAiTestResult(null);
        setIsFormSheetOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormSheetOpen(false);
        setEditingQuestionId(null);
        setEditingQuestionIndex(null);
    };

    const handleTestWithAI = async () => {
        if (!text) return;
        setIsTestingAI(true);
        setAiTestResult(null);
        try {
            setActiveTestTab("result");
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

    return (
        <div className="space-y-4">
            {/* --- Form Sheet for Creating/Editing --- */}
            <Sheet open={isFormSheetOpen} onOpenChange={setIsFormSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-[95vw] p-6 flex flex-col h-full bg-background [&>button]:hidden">
                    <SheetHeader className="mb-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1 text-left">
                                <SheetTitle className="text-2xl font-bold tracking-tight">
                                    {editingQuestionId
                                        ? `Editar Pregunta ${editingQuestionIndex !== null ? editingQuestionIndex + 1 : ''}`
                                        : "Nueva Pregunta"
                                    }
                                </SheetTitle>
                                <SheetDescription className="text-muted-foreground text-sm">Configura el enunciado y valida con IA la evaluación: {evaluation.title}</SheetDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    form="question-form"
                                    type="submit"
                                    size="sm"
                                    className="h-9 px-6 font-bold"
                                >
                                    {editingQuestionId ? "Guardar Cambios" : "Guardar Pregunta"}
                                </Button>
                                <Button variant="outline" size="sm" className="h-9" onClick={handleCloseForm}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    <form
                        ref={formRef}
                        id="question-form"
                        action={async (formData) => {
                            if (editingQuestionId) {
                                await updateQuestionAction(formData);
                            } else {
                                await createQuestionAction(formData);
                            }
                            handleCloseForm();
                        }}
                        className="flex-1 flex flex-col gap-4 overflow-hidden"
                    >
                        {editingQuestionId && <input type="hidden" name="questionId" value={editingQuestionId} />}
                        <input type="hidden" name="evaluationId" value={evaluation.id} />
                        <input type="hidden" name="text" value={text} />
                        <input type="hidden" name="type" value={type} />
                        <input type="hidden" name="language" value={language} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                            {/* Left: Editor */}
                            <div className="flex flex-col gap-3 border p-4 rounded-lg bg-card shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between border-b pb-2 mb-1 flex-shrink-0">
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
                                                    className="h-6 text-[10px] gap-1 px-2 text-amber-600 hover:bg-amber-500/10 transition-all font-bold border border-amber-500/20"
                                                >
                                                    <Sparkles className="h-3 w-3" /> Asistente IA
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[900px]">
                                                <DialogHeader className="pb-3 border-b">
                                                    <DialogTitle className="flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 text-amber-500" /> Asistente Gemini
                                                    </DialogTitle>
                                                    <DialogDescription className="text-xs">Genera preguntas basadas en el tema de la evaluación.</DialogDescription>
                                                </DialogHeader>
                                                <div className="py-2 space-y-4">
                                                    <div className="grid grid-cols-[1fr_auto] gap-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-black uppercase text-amber-600">Tema/Contexto</Label>
                                                            <textarea
                                                                required
                                                                className="w-full h-24 rounded-md border p-2 text-sm bg-muted/20 resize-none"
                                                                placeholder="Ej: 'Variables en C#'..."
                                                                value={assistantPrompt}
                                                                onChange={(e) => setAssistantPrompt(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1 min-w-[150px]">
                                                            <Label className="text-[9px] font-black uppercase text-muted-foreground/60">Extras</Label>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between gap-2 border p-1.5 rounded">
                                                                    <span className="text-[9px]">Código</span>
                                                                    <Switch checked={includeCode} onCheckedChange={setIncludeCode} className="scale-75" />
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2 border p-1.5 rounded">
                                                                    <span className="text-[9px]">Boilerplate</span>
                                                                    <Switch checked={includeBoilerplate} onCheckedChange={setIncludeBoilerplate} className="scale-75" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <div>
                                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Tamaño</Label>
                                                            <Select value={questionSize} onValueChange={(v: any) => setQuestionSize(v)}>
                                                                <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="short">Corta</SelectItem>
                                                                    <SelectItem value="medium">Media</SelectItem>
                                                                    <SelectItem value="long">Larga</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Bloom</Label>
                                                            <Select value={bloomTaxonomy} onValueChange={(v: any) => setBloomTaxonomy(v)}>
                                                                <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="remember">Recordar</SelectItem>
                                                                    <SelectItem value="understand">Comprender</SelectItem>
                                                                    <SelectItem value="apply">Aplicar</SelectItem>
                                                                    <SelectItem value="analyze">Analizar</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Dif.</Label>
                                                            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                                                                <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="easy">Fácil</SelectItem>
                                                                    <SelectItem value="medium">Medio</SelectItem>
                                                                    <SelectItem value="hard">Difícil</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Tipo</Label>
                                                            <Select value={type} onValueChange={setType}>
                                                                <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Text">Texto</SelectItem>
                                                                    <SelectItem value="Code">Código</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                                                        onClick={() => handleGenerateQuestion()}
                                                        disabled={isGeneratingQuestion || !assistantPrompt}
                                                    >
                                                        {isGeneratingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                        {isGeneratingQuestion ? "Generando..." : "Generar Pregunta"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Modo:</Label>
                                            <Select value={type} onValueChange={setType}>
                                                <SelectTrigger className="h-7 text-[10px] w-24 bg-muted/30">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Text">Texto</SelectItem>
                                                    <SelectItem value="Code">Código</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {type === "Code" && (
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Lg:</Label>
                                                <Select value={language} onValueChange={setLanguage}>
                                                    <SelectTrigger className="h-7 text-[10px] w-28 bg-muted/30">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="javascript">JavaScript</SelectItem>
                                                        <SelectItem value="typescript">TypeScript</SelectItem>
                                                        <SelectItem value="python">Python</SelectItem>
                                                        <SelectItem value="java">Java</SelectItem>
                                                        <SelectItem value="cpp">C++</SelectItem>
                                                        <SelectItem value="arduino">Arduino</SelectItem>
                                                        <SelectItem value="sql">SQL</SelectItem>
                                                        <SelectItem value="html">HTML/CSS</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col pt-1 min-h-0" data-color-mode={mode}>
                                    <MDEditor
                                        value={text}
                                        onChange={(val) => setText(val || "")}
                                        height="100%"
                                        preview="edit"
                                        className="flex-1 border-none shadow-none"
                                    />
                                </div>
                            </div>

                            {/* Right: Preview/Test */}
                            <div className="flex flex-col gap-3 border p-4 rounded-lg bg-card shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between border-b pb-2 mb-1 flex-shrink-0">
                                    <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-tight text-muted-foreground">
                                        <Sparkles className="h-4 w-4 text-amber-500" /> Validación IA
                                    </h3>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs font-bold"
                                        onClick={handleTestWithAI}
                                        disabled={isTestingAI || !text}
                                    >
                                        {isTestingAI ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                                        {isTestingAI ? "Analizando..." : "Probar con Gemini"}
                                    </Button>
                                </div>

                                <Tabs value={activeTestTab} onValueChange={setActiveTestTab} className="flex-1 flex flex-col min-h-0">
                                    <TabsList className="grid w-full grid-cols-2 h-8 flex-shrink-0">
                                        <TabsTrigger value="test" className="text-[10px] font-bold uppercase">Entrada</TabsTrigger>
                                        <TabsTrigger value="result" className="text-[10px] font-bold uppercase">Evaluación IA</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="test" className="flex-1 flex flex-col overflow-hidden m-0 pt-2 pb-0">
                                        {type === "Text" ? (
                                            <textarea
                                                className="flex-1 w-full rounded-md border bg-muted/10 p-4 text-sm focus:outline-none resize-none"
                                                placeholder="Escribe una respuesta para validar..."
                                                value={testAnswer}
                                                onChange={(e) => setTestAnswer(e.target.value)}
                                            />
                                        ) : (
                                            <div className="flex-1 border rounded-md overflow-hidden bg-background">
                                                <Editor
                                                    height="100%"
                                                    language={language === "arduino" ? "cpp" : (language || "javascript")}
                                                    theme={mode === "dark" ? "vs-dark" : "light"}
                                                    value={testAnswer}
                                                    onChange={(val) => setTestAnswer(val || "")}
                                                    options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
                                                />
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="result" className="flex-1 flex flex-col overflow-y-auto m-0 pt-2 pr-1">
                                        {aiTestResult ? (
                                            <div className={`p-4 rounded-lg border flex flex-col gap-3 ${aiTestResult.isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <div className="flex items-center gap-2">
                                                        {aiTestResult.isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                                        <span className="text-xs font-black uppercase text-primary">Gemini Score</span>
                                                    </div>
                                                    <span className="text-xl font-black text-primary">{aiTestResult.scoreContribution.toFixed(1)}/5.0</span>
                                                </div>
                                                <p className="text-xs leading-relaxed text-muted-foreground italic">"{aiTestResult.feedback}"</p>
                                                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold mt-2" onClick={handleGenerateAnswer}>Sugerir Respuesta Ideal</Button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center opacity-40 border border-dashed rounded-lg">
                                                <Info className="h-6 w-6 mb-2" />
                                                <p className="text-[10px] text-center max-w-[150px]">Pulsa 'Probar con Gemini' para analizar tu pregunta.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* --- Main Contents: Table and Header --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link href="/dashboard/teacher/evaluations">
                        <Button variant="link" className="p-0 h-auto text-muted-foreground mb-1 text-xs">
                            <ArrowLeft className="h-3 w-3 mr-1" /> Volver a Evaluaciones
                        </Button>
                    </Link>
                    <h2 className="text-xl font-bold tracking-tight">Preguntas de: {evaluation.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenForm()}>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Pregunta
                    </Button>

                    <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Vista Previa</Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-4xl p-6 flex flex-col h-full bg-background overflow-hidden">
                            <SheetHeader className="mb-4">
                                <SheetTitle>Vista Previa de Preguntas</SheetTitle>
                                <SheetDescription>Así verá el estudiante la evaluación.</SheetDescription>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto space-y-6 pr-2" data-color-mode={mode}>
                                {evaluation.questions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                        <Info className="h-10 w-10 mb-2" />
                                        <p className="text-sm">No hay preguntas creadas.</p>
                                    </div>
                                ) : (
                                    evaluation.questions.map((q: any, i: number) => (
                                        <div key={q.id} className="border p-5 rounded-lg bg-card shadow-sm space-y-4">
                                            <div className="flex justify-between items-center border-b pb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-lg text-primary">#{i + 1}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${q.type === 'Text' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                        {q.type} {q.type === 'Code' ? `(${q.language})` : ''}
                                                    </span>
                                                </div>
                                                <Button variant="secondary" size="sm" onClick={() => { setIsPreviewOpen(false); handleOpenForm(q, i); }}>
                                                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar
                                                </Button>
                                            </div>
                                            <div className="p-1">
                                                <MDEditor.Markdown source={q.text} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="w-full overflow-x-auto rounded-md border bg-card">
                <Table className="min-w-[800px]">
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[80px] text-center text-[10px] uppercase font-bold">Orden</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold">Tipo</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold">Enunciado</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold">Creado</TableHead>
                            <TableHead className="text-right text-[10px] uppercase font-bold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evaluation.questions.map((question: any, index: number) => (
                            <TableRow key={question.id} className="hover:bg-muted/5">
                                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {question.type === "Text" ? <Type className="h-3 w-3 text-blue-500" /> : <Code2 className="h-3 w-3 text-orange-500" />}
                                        <span className={`text-[10px] font-bold uppercase ${question.type === "Text" ? "text-blue-500" : "text-orange-500"}`}>
                                            {question.type === "Text" ? "Texto" : question.language}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[400px] truncate text-xs text-muted-foreground italic">
                                    {question.text.replace(/[#*`_~]/g, "").substring(0, 80)}...
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground">
                                    {format(new Date(question.createdAt), "dd/MM/yyyy HH:mm")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(question, index)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Eliminar Pregunta</DialogTitle>
                                                    <DialogDescription>Esta acción no se puede deshacer. Escribe ELIMINAR para continuar.</DialogDescription>
                                                </DialogHeader>
                                                <form action={async (formData) => { await deleteQuestionAction(formData); }}>
                                                    <input type="hidden" name="questionId" value={question.id} />
                                                    <input type="hidden" name="evaluationId" value={evaluation.id} />
                                                    <div className="py-4">
                                                        <Input name="confirmText" placeholder="ELIMINAR" pattern="^ELIMINAR$" required />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit" variant="destructive" className="w-full">Eliminar permanentemente</Button>
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
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 opacity-50">
                                    <Info className="h-6 w-6" />
                                    <p className="text-xs uppercase tracking-widest">No hay preguntas en esta evaluación</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
