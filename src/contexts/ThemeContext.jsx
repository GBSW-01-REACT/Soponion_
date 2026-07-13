import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const storageKey = 'soponion-theme'

function getInitialTheme() {
  const savedTheme = localStorage.getItem(storageKey)
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(storageKey, theme)
  }, [theme])

  const toggleTheme = () => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme은 ThemeProvider 안에서 사용해야 합니다.')
  return context
}
