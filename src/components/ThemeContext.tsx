"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'

export const PASTELS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Pastel Red', hex: '#fee2e2' },
  { name: 'Pastel Blue', hex: '#e0f2fe' },
  { name: 'Pastel Pink', hex: '#fce7f3' },
  { name: 'Pastel Orange', hex: '#ffedd5' },
  { name: 'Pastel Yellow', hex: '#fef9c3' },
  { name: 'Pastel Green', hex: '#dcfce7' },
  { name: 'Lavender', hex: '#f3e8ff' },
]

export const DEEP_TONES = [
  { name: 'Black', hex: '#09090b' },
  { name: 'Deep Crimson', hex: '#7f1d1d' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Forest Green', hex: '#14532d' },
  { name: 'Royal Purple', hex: '#581c87' },
  { name: 'Charcoal', hex: '#1f2937' },
  { name: 'Deep Teal', hex: '#134e4a' },
]

export const getTextColor = (hex: string) => {
  if (!hex) return 'text-zinc-950'
  const isLight = PASTELS.some(p => p.hex.toLowerCase() === hex.toLowerCase())
  return isLight ? 'text-zinc-950' : 'text-white'
}

type ThemeContextType = {
  sidebarColor: string
  dashboardColor: string
  setSidebarColor: (v: string) => void
  setDashboardColor: (v: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  sidebarColor: '#09090b',
  dashboardColor: '#09090b',
  setSidebarColor: () => {},
  setDashboardColor: () => {}
})

const lightenDarkenColor = (col: string, amt: number) => {
  let usePound = false;
  if (col[0] == "#") { col = col.slice(1); usePound = true; }
  if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];
  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255; else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255; else if (g < 0) g = 0;
  return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  // Always default to current dark-mode baseline
  const [sidebarColor, setSidebarColor] = useState<string>('#09090b')
  const [dashboardColor, setDashboardColor] = useState<string>('#09090b')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedS = localStorage.getItem('palboard-sidebar-color')
    const savedD = localStorage.getItem('palboard-dashboard-color')
    if (savedS) setSidebarColor(savedS)
    if (savedD) setDashboardColor(savedD)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    if (sidebarColor) {
      localStorage.setItem('palboard-sidebar-color', sidebarColor)
      document.documentElement.style.setProperty('--custom-sidebar-bg', sidebarColor)
      document.documentElement.style.setProperty('--custom-sidebar-text', getTextColor(sidebarColor) === 'text-white' ? '#fafafa' : '#09090b')
    } else {
      localStorage.removeItem('palboard-sidebar-color')
      document.documentElement.style.removeProperty('--custom-sidebar-bg')
      document.documentElement.style.removeProperty('--custom-sidebar-text')
    }
    
    if (dashboardColor) {
      document.documentElement.setAttribute('data-custom-dash', 'true')
      localStorage.setItem('palboard-dashboard-color', dashboardColor)
      
      document.documentElement.style.setProperty('--custom-dash-bg', dashboardColor)
      document.documentElement.style.setProperty('--custom-dash-text', getTextColor(dashboardColor) === 'text-white' ? '#fafafa' : '#09090b')
      
      const isPastel = PASTELS.some(p => p.hex.toLowerCase() === dashboardColor.toLowerCase())
      // Pastel = Make cards 15 units darker | Deep Tone = Make cards 20 units lighter
      document.documentElement.style.setProperty('--custom-card-bg', lightenDarkenColor(dashboardColor, isPastel ? -15 : 20))
      
      // Dynamic Card Overlays & Borders
      document.documentElement.style.setProperty('--custom-card-border', isPastel ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)')
      document.documentElement.style.setProperty('--custom-card-overlay', isPastel ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)')
      document.documentElement.setAttribute('data-theme-tone', isPastel ? 'light' : 'dark')
    } else {
      document.documentElement.removeAttribute('data-custom-dash')
      document.documentElement.removeAttribute('data-theme-tone')
      localStorage.removeItem('palboard-dashboard-color')
      document.documentElement.style.removeProperty('--custom-dash-bg')
      document.documentElement.style.removeProperty('--custom-dash-text')
      document.documentElement.style.removeProperty('--custom-card-bg')
      document.documentElement.style.removeProperty('--custom-card-border')
      document.documentElement.style.removeProperty('--custom-card-overlay')
    }

  }, [sidebarColor, dashboardColor, mounted])

  return (
    <ThemeContext.Provider value={{ sidebarColor, dashboardColor, setSidebarColor, setDashboardColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useCustomTheme = () => useContext(ThemeContext)
