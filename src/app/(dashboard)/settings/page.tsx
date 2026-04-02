"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Upload, Paintbrush, User as UserIcon, Check, Moon, Sun, Monitor, LayoutDashboard, Sidebar as SidebarIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useCustomTheme, PASTELS, DEEP_TONES, getTextColor } from "@/components/ThemeContext"

export default function SettingsPage() {
  const supabase = createClient()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [displayName, setDisplayName] = useState("")
  const [accent, setAccent] = useState("zinc") // "zinc", "blue", "green"
  
  const { sidebarColor, setSidebarColor, dashboardColor, setDashboardColor } = useCustomTheme()

  useEffect(() => {
    setMounted(true)
    fetchUser()
    const storedAccent = localStorage.getItem("palboard-accent") || "zinc"
    setAccent(storedAccent)
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setDisplayName(user.user_metadata?.display_name || "")
    }
    setLoading(false)
  }

  const handleUpdateName = async () => {
    if (!displayName.trim() || !user) return
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() }
    })
    if (!error) {
      // Small visual feedback could go here
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return
    
    // Check if the user is using the placeholder bucket, if so skip literal upload and mock for tutorial, else proceed:
    // Palboard uses 'avatars' standard Supabase storage.
    const file = e.target.files[0]
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
    
    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const newAvatarUrl = data.publicUrl
      
      await supabase.auth.updateUser({
        data: { avatarUrl: newAvatarUrl }
      })
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatarUrl: newAvatarUrl } })
    } else {
      console.error("Upload Error:", uploadError)
      alert("Upload failed. Ensure the 'avatars' storage bucket is created and public in Supabase.")
    }
    setUploading(false)
  }

  const changeAccent = (newAccent: string) => {
    setAccent(newAccent)
    localStorage.setItem("palboard-accent", newAccent)
    if (newAccent === "zinc") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", newAccent)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out pb-20 max-w-3xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your account and aesthetics.</p>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        
        {/* Account Section */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
             <UserIcon size={20} className="text-zinc-400 dark:text-zinc-500" /> Account
          </h2>
          
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl theme-card p-6 flex flex-col gap-8 shadow-sm">
             
             {/* Avatar Row */}
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden relative group">
                   {user?.user_metadata?.avatarUrl ? (
                      <img src={user.user_metadata.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                      <UserIcon size={32} className="text-zinc-300 dark:text-zinc-700" />
                   )}
                   
                   {/* Hover Overlay */}
                   <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      <span className="text-[0.6rem] font-medium mt-1 uppercase tracking-widest">{uploading ? 'Wait' : 'Upload'}</span>
                      <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         onChange={handleAvatarUpload} 
                         disabled={uploading}
                      />
                   </label>
                </div>
                <div className="flex flex-col gap-1">
                   <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Profile Picture</h3>
                   <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-snug">
                     Click your avatar to upload a custom image.<br/>(Recommended: Square 1:1 ratio)
                   </p>
                </div>
             </div>

             <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 w-full" />

             {/* Name Input Row */}
             <div className="flex flex-col gap-3 max-w-sm">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Display Name</label>
                <div className="flex items-center gap-2">
                   <input 
                      type="text" 
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      onBlur={handleUpdateName}
                      onKeyDown={e => { if (e.key === "Enter") handleUpdateName() }}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                      placeholder="Your preferred name"
                   />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  This name will be displayed on your Home dashboard stat card.
                </p>
             </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
             <Paintbrush size={20} className="text-zinc-400 dark:text-zinc-500" /> Appearance
          </h2>
          
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl theme-card p-6 flex flex-col gap-8 shadow-sm">
             
             {/* General Theme (Dark/Light) */}
             <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-1">
                 <h3 className="font-semibold" style={{ color: 'var(--custom-dash-text)' }}>System Theme</h3>
                 <p className="text-sm opacity-70" style={{ color: 'var(--custom-dash-text)' }}>Choose between global light or dark mode.</p>
               </div>
               
                {mounted && (
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => {
                        setTheme("light")
                        setSidebarColor('#FFFFFF')
                        setDashboardColor('#FFFFFF')
                     }}
                     className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent outline outline-2 outline-offset-2 outline-zinc-500' : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-zinc-200 dark:border-zinc-800'}`}
                   >
                     <Sun size={16} /> Light
                   </button>
                   <button 
                     onClick={() => {
                        setTheme("dark")
                        setSidebarColor('#09090b')
                        setDashboardColor('#000000')
                     }}
                     className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent outline outline-2 outline-offset-2 outline-zinc-500' : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-zinc-200 dark:border-zinc-800'}`}
                   >
                     <Moon size={16} /> Dark
                   </button>
                 </div>
               )}
             </div>

             <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

             {/* Sidebar Color Selection */}
             <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-1">
                 <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--custom-dash-text)' }}>
                   <SidebarIcon size={18} /> Sidebar Theme
                 </h3>
                 <p className="text-sm opacity-70" style={{ color: 'var(--custom-dash-text)' }}>Customize the color of the navigational sidebar.</p>
               </div>
               <div className="flex flex-col gap-3">
                 <div className="flex flex-wrap gap-3">
                   {PASTELS.map(color => {
                     const isActive = sidebarColor.toLowerCase() === color.hex.toLowerCase()
                     return (
                       <button
                         key={color.name}
                         onClick={() => setSidebarColor(color.hex)}
                         className={`w-10 h-10 rounded-full shadow-sm relative transition-transform hover:scale-110 flex items-center justify-center ${isActive ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950' : ''}`}
                         style={{ backgroundColor: color.hex, border: color.hex === '#FFFFFF' ? '1px solid #e4e4e7' : '1px solid transparent' }}
                         title={color.name}
                       >
                         {isActive && <Check size={16} className={getTextColor(color.hex)} />}
                       </button>
                     )
                   })}
                 </div>
                 <div className="flex flex-wrap gap-3">
                   {DEEP_TONES.map(color => {
                     const isActive = sidebarColor.toLowerCase() === color.hex.toLowerCase()
                     return (
                       <button
                         key={color.name}
                         onClick={() => setSidebarColor(color.hex)}
                         className={`w-10 h-10 rounded-full shadow-sm relative transition-transform hover:scale-110 flex items-center justify-center ${isActive ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950' : ''}`}
                         style={{ backgroundColor: color.hex, border: '1px solid transparent' }}
                         title={color.name}
                       >
                         {isActive && <Check size={16} className={getTextColor(color.hex)} />}
                       </button>
                     )
                   })}
                 </div>
               </div>
             </div>

             <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

             {/* Dashboard Color Selection */}
             <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-1">
                 <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--custom-dash-text)' }}>
                   <LayoutDashboard size={18} /> Dashboard Theme
                 </h3>
                 <p className="text-sm opacity-70" style={{ color: 'var(--custom-dash-text)' }}>Customize the main application background color.</p>
               </div>
               <div className="flex flex-col gap-3">
                 <div className="flex flex-wrap gap-3">
                   {PASTELS.map(color => {
                     const isActive = dashboardColor.toLowerCase() === color.hex.toLowerCase()
                     return (
                       <button
                         key={color.name}
                         onClick={() => setDashboardColor(color.hex)}
                         className={`w-10 h-10 rounded-full shadow-sm relative transition-transform hover:scale-110 flex items-center justify-center ${isActive ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950' : ''}`}
                         style={{ backgroundColor: color.hex, border: color.hex === '#FFFFFF' ? '1px solid #e4e4e7' : '1px solid transparent' }}
                         title={color.name}
                       >
                         {isActive && <Check size={16} className={getTextColor(color.hex)} />}
                       </button>
                     )
                   })}
                 </div>
                 <div className="flex flex-wrap gap-3">
                   {DEEP_TONES.map(color => {
                     const isActive = dashboardColor.toLowerCase() === color.hex.toLowerCase()
                     return (
                       <button
                         key={color.name}
                         onClick={() => setDashboardColor(color.hex)}
                         className={`w-10 h-10 rounded-full shadow-sm relative transition-transform hover:scale-110 flex items-center justify-center ${isActive ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950' : ''}`}
                         style={{ backgroundColor: color.hex, border: '1px solid transparent' }}
                         title={color.name}
                       >
                         {isActive && <Check size={16} className={getTextColor(color.hex)} />}
                       </button>
                     )
                   })}
                 </div>
               </div>
             </div>
             
          </div>
        </section>

      </div>
    </div>
  )
}
