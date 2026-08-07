import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'crev-theme'

function readInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}

/**
 * Light/dark theme toggle for the teacher dashboard.
 *
 * The theme class is applied to <html> so portals (modals) inherit the dark
 * palette too. The choice persists to localStorage. No theme tokens are
 * changed — darkness comes from a scoped override block in index.css.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('t-dark')
    } else {
      root.classList.remove('t-dark')
    }
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}