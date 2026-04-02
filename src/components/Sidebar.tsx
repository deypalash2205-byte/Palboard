"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Award, 
  BarChart, 
  BookOpen, 
  Search, 
  Settings, 
  Mail, 
  LogOut,
  Menu,
  X,
  MoreHorizontal
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Marks", href: "/marks", icon: Award },
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Search", href: "/search", icon: Search },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/login")
  }

  const mobilePrimaryLinks = [
    navLinks.find(l => l.name === 'Home')!,
    navLinks.find(l => l.name === 'Tasks')!,
    navLinks.find(l => l.name === 'Search')!,
    navLinks.find(l => l.name === 'Marks')!,
  ]

  const moreLinks = [
    navLinks.find(l => l.name === 'Calendar')!,
    navLinks.find(l => l.name === 'Library')!,
    navLinks.find(l => l.name === 'Analytics')!,
    { name: "Settings", href: "/settings", icon: Settings }
  ]

  const isMoreActive = moreLinks.some(l => l.href === pathname)

  return (
    <>
      {mounted && (
        <>
          <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none pb-2">
            {mobilePrimaryLinks.map((link) => {
               const Icon = link.icon
               const isActive = pathname === link.href
               return (
                 <Link
                   key={link.name}
                   href={link.href}
                   className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[64px] rounded-xl transition-all duration-300 select-none ${isActive ? "text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-500 dark:text-zinc-400 scale-95"}`}
                 >
                   <Icon size={20} className={isActive ? "scale-110 drop-shadow-sm transition-transform" : "scale-100 transition-transform"} />
                   <span className="text-[10px] tracking-wide">{link.name}</span>
                 </Link>
               )
            })}
            
            <button
               onClick={() => setMoreOpen(!moreOpen)}
               className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[64px] rounded-xl transition-all duration-300 select-none ${isMoreActive || moreOpen ? "text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-500 dark:text-zinc-400 scale-95"}`}
            >
               <MoreHorizontal size={20} className={isMoreActive || moreOpen ? "scale-110 drop-shadow-sm transition-transform" : "scale-100 transition-transform"} />
               <span className="text-[10px] tracking-wide">More</span>
            </button>
          </div>

          {moreOpen && (
            <>
              <div className="md:hidden fixed inset-0 z-40 bg-zinc-900/20 dark:bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setMoreOpen(false)} />
              <div className="md:hidden fixed bottom-20 left-4 right-4 z-50 p-2 rounded-2xl theme-card border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl animate-in slide-in-from-bottom-8 fade-in duration-300 flex flex-col gap-1">
                 {moreLinks.map(link => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                       <Link
                         key={link.name}
                         href={link.href}
                         onClick={() => setMoreOpen(false)}
                         className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-medium min-h-[48px] ${isActive ? "bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-100 font-bold" : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"} `}
                       >
                          <Icon size={20} className={isActive ? "scale-110" : ""} /> 
                          {link.name}
                       </Link>
                    )
                 })}
              </div>
            </>
          )}
        </>
      )}

      <aside 
        className={`hidden md:flex inset-y-0 left-0 z-40 h-full w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800/50 transition-all duration-300 ease-in-out flex-col relative`}
        style={{ 
          backgroundColor: 'var(--custom-sidebar-bg, #09090b)', 
          color: 'var(--custom-sidebar-text, #fafafa)' 
        }}
      >
        <div className="p-6 md:flex hidden items-center h-[73px]">
          <span className="font-sans font-bold text-xl transition-colors duration-300" style={{ color: 'var(--custom-sidebar-text, inherit)' }}>Palboard</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 select-none hover:brightness-90 dark:hover:brightness-125 min-h-[44px] ${
                  isActive ? "shadow-sm ring-1 ring-black/5 dark:ring-white/5" : "opacity-80"
                }`}
                style={{ backgroundColor: isActive ? 'color-mix(in srgb, currentColor 10%, transparent)' : 'transparent' }}
              >
                <Icon size={18} />
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-zinc-200/20 dark:border-zinc-800/50 flex flex-col gap-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors select-none min-h-[44px] opacity-80 hover:brightness-90 dark:hover:brightness-125"
          >
            <Settings size={18} />
            Settings
          </Link>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors select-none min-h-[44px] opacity-80 hover:brightness-90 dark:hover:brightness-125"
          >
            <Mail size={18} />
            Gmail
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-sm font-medium transition-colors select-none min-h-[44px] text-left w-full opacity-80 hover:brightness-90 dark:hover:brightness-125 dark:text-red-400 text-red-600"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  )
}
