/**
 * Theme provider for light/dark mode support.
 *
 * Manages the application theme by:
 * - Reading initial theme from localStorage (instant, no flash)
 * - Syncing with Electron settings via IPC on mount
 * - Applying 'light' or 'dark' class to <html> element
 * - Listening for system theme changes when in 'system' mode
 * - Providing theme state and setter to children via React context
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemeSetting = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  /** Current theme setting (system/light/dark) */
  theme: ThemeSetting
  /** Resolved theme after applying system preference */
  resolvedTheme: ResolvedTheme
  /** Update the theme setting */
  setTheme: (theme: ThemeSetting) => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {}
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ob-theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  if (setting === 'system') return getSystemTheme()
  return setting
}

function isValidThemeSetting(value: unknown): value is ThemeSetting {
  return value === 'system' || value === 'light' || value === 'dark'
}

function getInitialTheme(): ThemeSetting {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isValidThemeSetting(stored)) return stored
  }
  return 'system'
}

function applyThemeClass(resolved: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemeSetting>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getInitialTheme())
  )

  // Apply theme class to <html> when theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyThemeClass(resolved)
  }, [theme])

  // Listen for system theme changes (only in 'system' mode)
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (): void => {
      const resolved = resolveTheme('system')
      setResolvedTheme(resolved)
      applyThemeClass(resolved)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  // Sync with Electron settings on mount
  useEffect(() => {
    if (!window.api?.settings) return

    window.api.settings
      .load()
      .then((settings) => {
        const saved = settings?.theme
        if (isValidThemeSetting(saved) && saved !== getInitialTheme()) {
          setThemeState(saved)
          localStorage.setItem(STORAGE_KEY, saved)
        }
      })
      .catch(() => {
        // Settings not available, use localStorage value
      })
  }, [])

  const setTheme = useCallback((newTheme: ThemeSetting) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
