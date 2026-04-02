"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Search, FileText, Image as ImageIcon, File, ExternalLink, Library, Trash2, ChevronRight, Inbox } from "lucide-react"
import Link from "next/link"

interface Attachment {
  id: string
  record_id: string
  file_name: string
  file_url: string
  created_at: string
}

export default function LibraryPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchAttachments()
  }, [])

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .from("attachments")
      .select("*")
      .order("created_at", { ascending: false })
      
    if (data && !error) {
      setAttachments(data as Attachment[])
    }
    setLoading(false)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ""
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return <ImageIcon size={20} className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText size={20} className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
    return <File size={20} className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
  }

  const filteredAttachments = attachments.filter(a => 
    a.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteAttachment = async (attachment: Attachment, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic UI update
    setAttachments(prev => prev.filter(a => a.id !== attachment.id))

    const urlParts = attachment.file_url.split('/library-assets/')
    if (urlParts.length === 2) {
      const filePath = urlParts[1]
      await supabase.storage.from('library-assets').remove([filePath])
    }
    
    await supabase.from('attachments').delete().eq('id', attachment.id)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out pb-20">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Library className="text-zinc-400 dark:text-zinc-500" /> Library
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your centralized repository of task resources and notes.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Grid Content */}
      {filteredAttachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAttachments.map((file) => (
            <a 
              key={file.id} 
              href={file.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 p-4 border border-zinc-200 dark:border-zinc-800 theme-card hover:brightness-105 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group-hover:bg-white dark:group-hover:bg-zinc-950 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors">
                  {getFileIcon(file.file_name)}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDeleteAttachment(file, e)} 
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ExternalLink size={14} className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors" />
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={file.file_name}>
                  {file.file_name}
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {new Date(file.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10 h-80">
          <div className="w-16 h-16 theme-card shadow-sm border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center rounded-2xl mb-4">
             {searchQuery ? <Search size={24} className="text-zinc-300 dark:text-zinc-600" /> : <Inbox size={24} className="text-zinc-300 dark:text-zinc-600" />}
          </div>
          <h3 className="text-zinc-900 dark:text-zinc-100 font-bold tracking-tight text-lg mb-1">
            {searchQuery ? "No matching files" : "Your Library is empty"}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[280px] mb-6">
             {searchQuery 
               ? `Check for typos or try a different search term.` 
               : "Upload resources natively inside your tasks, and they will securely sync here."}
          </p>
          {!searchQuery && (
            <Link href="/tasks" className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-semibold tracking-wide hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm">
               Get started by adding a subject
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
