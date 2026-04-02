"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-9 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-medium text-zinc-900 dark:text-zinc-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 outline-none cursor-pointer"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  )
}
