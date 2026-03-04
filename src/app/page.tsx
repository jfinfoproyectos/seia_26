import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GraduationCap, BookOpen, FileCheck, BarChart3, Users, Settings2, BrainCircuit, CalendarCheck, ClipboardCheck } from "lucide-react"
import { ModeToggle } from "@/components/theme/ModeToggle";
import { ThemeSwatches } from "@/components/theme/ThemeSwatches";
import { CreditsModal } from "@/components/CreditsModal";
import prisma from "@/lib/prisma";

export default async function LandingPage() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "settings" },
    select: { appTitle: true }
  });

  const appTitle = settings?.appTitle || "SEIA";

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-primary/10 blur-3xl absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full" />
          <div className="bg-accent/10 blur-2xl absolute bottom-0 right-0 h-64 w-64 rounded-full" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                <BrainCircuit className="size-4" />
                Potenciado con IA
              </div>
              <h1 className="mt-4 text-foreground text-4xl font-bold tracking-tight md:text-6xl">
                {appTitle}
                <span className="block text-primary mt-2">Educación Inteligente</span>
              </h1>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                Plataforma integral para la gestión académica moderna. Evaluaciones inteligentes con IA, control de asistencia y reportes detallados en tiempo real.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signin">Entrar al panel</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/signup">Crear cuenta</Link>
                </Button>
              </div>
              <div className="text-muted-foreground mt-6 text-sm flex items-center gap-4">
                <span className="flex items-center gap-1"><BrainCircuit className="size-3" /> Gemini AI integration</span>
                <span className="flex items-center gap-1"><FileCheck className="size-3" /> Automated Grading</span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                      <ClipboardCheck className="size-5" />
                      <CardTitle className="text-base">Evaluaciones IA</CardTitle>
                    </div>
                    <CardDescription>Generación y calificación automática de exámenes con retroalimentación instantánea</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                      <BrainCircuit className="size-5" />
                      <CardTitle className="text-base">IA Assistant</CardTitle>
                    </div>
                    <CardDescription>Evaluación inteligente y sugerencias de mejora con Gemini</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                      <CalendarCheck className="size-5" />
                      <CardTitle className="text-base">Asistencia</CardTitle>
                    </div>
                    <CardDescription>Control de asistencia por sesiones y reportes automáticos</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                      <BarChart3 className="size-5" />
                      <CardTitle className="text-base">Analíticas</CardTitle>
                    </div>
                    <CardDescription>Dashboard de rendimiento y distribución de notas</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesitas</h2>
            <p className="text-muted-foreground mt-4">Herramientas diseñadas para potenciar la enseñanza y el aprendizaje</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="size-5 text-primary" />
                  <CardTitle className="text-lg">Administración</CardTitle>
                </div>
                <CardDescription>Gestión total de la institución</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Gestión de usuarios y roles</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Control de cursos y períodos</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Auditoría del sistema</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="size-5 text-primary" />
                  <CardTitle className="text-lg">Docentes</CardTitle>
                </div>
                <CardDescription>Herramientas potentes de evaluación</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Creación de evaluaciones inteligentes</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Asistente de calificación con IA</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Gestión de notificaciones</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="size-5 text-primary" />
                  <CardTitle className="text-lg">Estudiantes</CardTitle>
                </div>
                <CardDescription>Seguimiento claro del progreso</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Realización de evaluaciones en línea</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Visualización de feedback detallado</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Historial de calificaciones</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-4">
              <Card className="col-span-2 bg-primary text-primary-foreground border-none">
                <CardHeader>
                  <CardTitle className="text-4xl font-bold">100%</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Digital y sin papeles</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">IA</CardTitle>
                  <CardDescription>Integrada</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">24/7</CardTitle>
                  <CardDescription>Disponibilidad</CardDescription>
                </CardHeader>
              </Card>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Empieza hoy mismo</h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Únete a la revolución educativa con {appTitle}. Una plataforma diseñada para simplificar la gestión académica y potenciar el aprendizaje.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Crear cuenta gratis</Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/signin">Ya tengo cuenta</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/10">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded bg-primary/20 flex items-center justify-center">
                <div className="size-3 rounded-full bg-primary" />
              </div>
              <span className="font-bold text-lg">{appTitle}</span>
            </div>
            <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} {appTitle}. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <ModeToggle />
              <ThemeSwatches />
              <CreditsModal />
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
