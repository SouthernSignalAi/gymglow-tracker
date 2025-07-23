import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'gym-dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark' | 'gym-dark' // Resolved theme
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'fitness-tracker-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const [actualTheme, setActualTheme] = useState<'light' | 'dark' | 'gym-dark'>('light')

  useEffect(() => {
    const root = window.document.documentElement
    
    // Clear existing theme classes
    root.classList.remove('light', 'dark')
    root.removeAttribute('data-theme')

    let resolvedTheme: 'light' | 'dark' | 'gym-dark' = 'light'

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      resolvedTheme = systemTheme
      root.classList.add(systemTheme)
      root.setAttribute('data-theme', systemTheme)
    } else {
      resolvedTheme = theme
      root.classList.add(theme === 'gym-dark' ? 'dark' : theme)
      root.setAttribute('data-theme', theme)
    }

    setActualTheme(resolvedTheme)

    // Add transition class for smooth theme switching
    root.classList.add('theme-transition')
    setTimeout(() => root.classList.remove('theme-transition'), 300)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    actualTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}