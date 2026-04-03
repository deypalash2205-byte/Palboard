"use client"

import React, { useState, useRef, useEffect } from "react"
import { Edit2, Check, X, Settings, LogOut, ChevronDown, User as UserIcon } from "lucide-react"
import { updateDisplayName } from "@/app/actions/user"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

interface HeaderProps {
  initialName: string
}

export function Header({ initialName }: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName || "Student")
  const [pendingName, setPendingName] = useState(name)
  const [isLoading, setIsLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!pendingName.trim() || pendingName === name) {
      setIsEditing(false)
      setPendingName(name)
      return
    }

    setIsLoading(true)
    const result = await updateDisplayName(pendingName)
    setIsLoading(false)

    if (result.error) {
      // Revert on error
      setPendingName(name)
    } else {
      setName(pendingName)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setPendingName(name)
    setIsEditing(false)
  }

  return (
    <header className="w-full px-4 md:px-8 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between w-full group">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") handleCancel()
              }}
              disabled={isLoading}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-base font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 w-48 text-center"
            />
            <button 
              onClick={handleSave} 
              disabled={isLoading}
              className="text-green-600 dark:text-green-500 hover:text-green-700 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={handleCancel} 
              disabled={isLoading}
              className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-x-1.5 flex-1 min-w-0 md:justify-center">
              {mounted && (
                <span 
                  className="md:hidden font-sans font-bold text-sm sm:text-base transition-colors select-none shrink-0" 
                  style={{ color: 'var(--custom-dash-text, inherit)' }}
                >
                  Palboard
                </span>
              )}
              <h1 className="hidden md:block text-xs sm:text-sm md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight shrink min-w-0 truncate text-left md:text-center">
                {name}&apos;s Dashboard
              </h1>
              <button
                onClick={() => setIsEditing(true)}
                className="hidden md:block opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                aria-label="Edit name"
              >
                <Edit2 size={14} />
              </button>
            </div>

            <div className="flex items-center shrink-0 md:hidden ml-3 gap-2">
               <button
                 onClick={() => setIsEditing(true)}
                 className="opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                 aria-label="Edit name"
               >
                 <Edit2 size={14} />
               </button>
               <div className="relative">
                 <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0"
                 >
                  <UserIcon size={16} />
               </button>
               {dropdownOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute top-10 right-0 z-50 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                      <Link 
                        href="/settings" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 select-none min-h-[44px]"
                      >
                         <Settings size={16} /> Settings
                      </Link>
                      <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-1 font-sans" />
                      <button 
                        onClick={async () => {
                           await supabase.auth.signOut()
                           router.refresh()
                           router.push("/login")
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 select-none min-h-[44px]"
                      >
                         <LogOut size={16} /> Log Out
                      </button>
                    </div>
                 </>
               )}
               </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
