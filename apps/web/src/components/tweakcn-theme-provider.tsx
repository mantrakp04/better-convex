"use client"

import * as React from "react"
import type { Theme } from "@/lib/tweakcn"

type ThemeMode = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeMode
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "class",
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeMode>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light")

  const getSystemTheme = React.useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }, [])

  const applyTheme = React.useCallback((resolved: "light" | "dark") => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    if (attribute === "class") {
      root.classList.remove("light", "dark")
      root.classList.add(resolved)
    } else {
      root.setAttribute(attribute, resolved)
    }
  }, [attribute])

  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as ThemeMode | null
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setThemeState(stored)
    }
  }, [storageKey])

  React.useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [theme, getSystemTheme, applyTheme])

  React.useEffect(() => {
    if (!enableSystem || theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, enableSystem, getSystemTheme, applyTheme])

  const setTheme = React.useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }, [storageKey])

  const value = React.useMemo(() => ({
    theme,
    setTheme,
    resolvedTheme,
  }), [theme, setTheme, resolvedTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// TweakCN Theme functionality
export function useTweakCNThemes() {
  const [currentTheme, setCurrentTheme] = React.useState<Theme | null>(null)

  const applyTheme = React.useCallback((theme: Theme | null) => {
    if (typeof window === 'undefined') return

    if (theme) {
      applyThemeStyles(theme)
      localStorage.setItem("theme-config", JSON.stringify(theme))
      setCurrentTheme(theme)
    } else {
      clearThemeStyles()
      localStorage.removeItem("theme-config")
      setCurrentTheme(null)
    }
  }, [])

  React.useEffect(() => {
    const stored = localStorage.getItem("theme-config")
    if (stored) {
      try {
        const theme = JSON.parse(stored) as Theme
        setCurrentTheme(theme)
        applyThemeStyles(theme)
      } catch (error) {
        console.error("Failed to parse stored theme:", error)
      }
    }
  }, [])

  return {
    currentTheme,
    applyTheme,
    setTheme: applyTheme,
  }
}

const THEME_STYLE_ID = "tweakcn-theme-styles"

function generateThemeCSS(theme: Theme): string {
  const cssLines: string[] = []

  const getCSSVariables = (vars: Record<string, string>) => {
    return Object.entries(vars)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n")
  }

  if (theme.cssVars.theme) {
    const themeVars = getCSSVariables(theme.cssVars.theme)
    cssLines.push(`:root {\n${themeVars}\n}`)
  }

  const lightVars = getCSSVariables(theme.cssVars.light)
  cssLines.push(`:root {\n${lightVars}\n}`)

  const darkVars = getCSSVariables(theme.cssVars.dark)
  cssLines.push(`.dark {\n${darkVars}\n}`)

  return cssLines.join("\n\n")
}

function applyThemeStyles(theme: Theme) {
  const existingStyle = document.getElementById(THEME_STYLE_ID)
  if (existingStyle) {
    existingStyle.remove()
  }

  const styleTag = document.createElement("style")
  styleTag.id = THEME_STYLE_ID
  styleTag.textContent = generateThemeCSS(theme)
  document.head.appendChild(styleTag)
}

function clearThemeStyles() {
  const existingStyle = document.getElementById(THEME_STYLE_ID)
  if (existingStyle) {
    existingStyle.remove()
  }
}
