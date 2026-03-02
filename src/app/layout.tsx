import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ScrollRestorer } from "@/components/ScrollRestorer";
import prisma from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "settings" },
    select: { appTitle: true }
  });

  const title = settings?.appTitle || "SmartClass";

  return {
    title: title,
    description: `Plataforma educativa ${title}`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var p=localStorage.getItem('theme-palette');var name=p||'emerald';if(name==='emerald'){var r=document.documentElement;var s=[[\"--primary\",\"oklch(0.769 0.188 70.08)\"],[\"--primary-foreground\",\"oklch(0.145 0 0)\"],[\"--accent\",\"oklch(0.769 0.188 70.08)\"],[\"--accent-foreground\",\"oklch(0.985 0 0)\"],[\"--chart-1\",\"oklch(0.769 0.188 70.08)\"],[\"--chart-2\",\"oklch(0.6 0.118 184.704)\"],[\"--chart-3\",\"oklch(0.398 0.07 227.392)\"],[\"--chart-4\",\"oklch(0.828 0.189 84.429)\"],[\"--chart-5\",\"oklch(0.646 0.222 41.116)\"]];s.forEach(function(a){r.style.setProperty(a[0],a[1]);});}}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ScrollRestorer />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
