"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Paintbrush } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Palette = {
  name: string
  primary: string
  primaryForeground: string
  accent: string
  accentForeground: string
  chart: string[]
}

const palettes: Palette[] = [
  {
    name: "blue",
    primary: "oklch(0.63 0.18 248)",
    primaryForeground: "oklch(0.145 0 0)",
    accent: "oklch(0.63 0.18 248)",
    accentForeground: "oklch(0.985 0 0)",
    chart: [
      "oklch(0.63 0.18 248)",
      "oklch(0.488 0.243 264.376)",
      "oklch(0.769 0.188 70.08)",
      "oklch(0.627 0.265 303.9)",
      "oklch(0.696 0.17 162.48)",
    ],
  },
  {
    name: "violet",
    primary: "oklch(0.646 0.222 41.116)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.646 0.222 41.116)",
    accentForeground: "oklch(0.145 0 0)",
    chart: [
      "oklch(0.646 0.222 41.116)",
      "oklch(0.6 0.118 184.704)",
      "oklch(0.398 0.07 227.392)",
      "oklch(0.828 0.189 84.429)",
      "oklch(0.769 0.188 70.08)",
    ],
  },
  {
    name: "cyan",
    primary: "oklch(0.696 0.17 162.48)",
    primaryForeground: "oklch(0.145 0 0)",
    accent: "oklch(0.696 0.17 162.48)",
    accentForeground: "oklch(0.985 0 0)",
    chart: [
      "oklch(0.696 0.17 162.48)",
      "oklch(0.6 0.118 184.704)",
      "oklch(0.398 0.07 227.392)",
      "oklch(0.828 0.189 84.429)",
      "oklch(0.769 0.188 70.08)",
    ],
  },
  {
    name: "emerald",
    primary: "oklch(0.769 0.188 70.08)",
    primaryForeground: "oklch(0.145 0 0)",
    accent: "oklch(0.769 0.188 70.08)",
    accentForeground: "oklch(0.985 0 0)",
    chart: [
      "oklch(0.769 0.188 70.08)",
      "oklch(0.6 0.118 184.704)",
      "oklch(0.398 0.07 227.392)",
      "oklch(0.828 0.189 84.429)",
      "oklch(0.646 0.222 41.116)",
    ],
  },
  {
    name: "orange",
    primary: "oklch(0.828 0.189 84.429)",
    primaryForeground: "oklch(0.145 0 0)",
    accent: "oklch(0.828 0.189 84.429)",
    accentForeground: "oklch(0.985 0 0)",
    chart: [
      "oklch(0.828 0.189 84.429)",
      "oklch(0.769 0.188 70.08)",
      "oklch(0.6 0.118 184.704)",
      "oklch(0.398 0.07 227.392)",
      "oklch(0.646 0.222 41.116)",
    ],
  },
  {
    name: "rose",
    primary: "oklch(0.704 0.191 22.216)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.704 0.191 22.216)",
    accentForeground: "oklch(0.145 0 0)",
    chart: [
      "oklch(0.704 0.191 22.216)",
      "oklch(0.769 0.188 70.08)",
      "oklch(0.645 0.246 16.439)",
      "oklch(0.488 0.243 264.376)",
      "oklch(0.627 0.265 303.9)",
    ],
  },
  {
    name: "red",
    primary: "oklch(0.637 0.237 25.331)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.637 0.237 25.331)",
    accentForeground: "oklch(0.145 0 0)",
    chart: [
      "oklch(0.637 0.237 25.331)",
      "oklch(0.704 0.191 22.216)",
      "oklch(0.828 0.189 84.429)",
      "oklch(0.646 0.222 41.116)",
      "oklch(0.6 0.118 184.704)",
    ],
  },
  {
    name: "yellow",
    primary: "oklch(0.852 0.199 91.936)",
    primaryForeground: "oklch(0.145 0 0)",
    accent: "oklch(0.852 0.199 91.936)",
    accentForeground: "oklch(0.145 0 0)",
    chart: [
      "oklch(0.852 0.199 91.936)",
      "oklch(0.828 0.189 84.429)",
      "oklch(0.769 0.188 70.08)",
      "oklch(0.6 0.118 184.704)",
      "oklch(0.398 0.07 227.392)",
    ],
  },
  {
    name: "purple",
    primary: "oklch(0.627 0.265 303.9)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.627 0.265 303.9)",
    accentForeground: "oklch(0.145 0 0)",
    chart: [
      "oklch(0.627 0.265 303.9)",
      "oklch(0.63 0.18 248)",
      "oklch(0.488 0.243 264.376)",
      "oklch(0.646 0.222 41.116)",
      "oklch(0.704 0.191 22.216)",
    ],
  },
]

function applyPalette(palette: Palette) {
  const root = document.documentElement
  root.style.setProperty("--primary", palette.primary)
  root.style.setProperty("--primary-foreground", palette.primaryForeground)
  root.style.setProperty("--accent", palette.accent)
  root.style.setProperty("--accent-foreground", palette.accentForeground)
  palette.chart.forEach((c, i) => {
    root.style.setProperty(`--chart-${i + 1}`, c)
  })
  localStorage.setItem("theme-palette", palette.name)
}

export function ThemeSwatches() {
  const dots = useMemo(() => palettes, [])
  const [selected, setSelected] = useState<string>("emerald")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("theme-palette") || "emerald"
    setSelected(saved)
    const palette = dots.find((p) => p.name === saved) || dots[0]
    applyPalette(palette)
  }, [dots])

  const cycleTheme = () => {
    const currentIndex = dots.findIndex(p => p.name === selected)
    const nextIndex = (currentIndex + 1) % dots.length
    const nextPalette = dots[nextIndex]
    applyPalette(nextPalette)
    setSelected(nextPalette.name)
  }

  if (!mounted) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={cycleTheme}
        >
          <Paintbrush className="h-[1.2rem] w-[1.2rem] transition-all" style={{ color: "var(--primary)" }} />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Tema actual: {selected}</p>
      </TooltipContent>
    </Tooltip>
  )
}