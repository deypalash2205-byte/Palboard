"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Search, Book, CheckSquare, FileText, ChevronRight, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  title: string
  type: "subject" | "subtopic" | "attachment"
  url: string
}

export default function SearchPage() {
  const supabase = createClient()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    subjects: SearchResult[]
    subtopics: SearchResult[]
    attachments: SearchResult[]
  }>({ subjects: [], subtopics: [], attachments: [] })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 1) {
        performSearch(query)
      } else {
        setResults({ subjects: [], subtopics: [], attachments: [] })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const performSearch = async (searchTerm: string) => {
    setLoading(true)
    const term = `%${searchTerm}%`
    
    // Using simple ilike for partial matching
    const { data: subjects } = await supabase.from('subjects').select('id, title').ilike('title', term).limit(10)
    const { data: subtopics } = await supabase.from('subtopics').select('id, title').ilike('title', term).limit(10)
    const { data: attachments } = await supabase.from('attachments').select('id, file_name, file_url').ilike('file_name', term).limit(10)

    setResults({
      subjects: (subjects || []).map(s => ({ id: s.id, title: s.title, type: "subject", url: `/tasks` })),
      subtopics: (subtopics || []).map(s => ({ id: s.id, title: s.title, type: "subtopic", url: `/tasks` })),
      attachments: (attachments || []).map(a => ({ id: a.id, title: a.file_name, type: "attachment", url: a.file_url }))
    })
    
    setLoading(false)
  }

  const hasResults = results.subjects.length > 0 || results.subtopics.length > 0 || results.attachments.length > 0

  return (
    <div className="flex flex-col items-center pt-10 md:pt-20 px-4 w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      
      {/* Big Search Input */}
      <div className="relative w-full group flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-5 h-5 transition-colors group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects or tasks..."
            className="w-full pl-12 pr-10 py-4 md:py-6 text-lg md:text-xl theme-card border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm transition-all shadow-zinc-900/5 dark:shadow-black/20"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-300 rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        <button 
          onClick={() => router.back()}
          className="p-3 md:hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 text-zinc-500 flex-shrink-0 theme-card flex items-center justify-center min-h-[44px]"
        >
           <X size={20} />
        </button>
      </div>

      {/* Results Container */}
      <div className="w-full mt-8 flex flex-col gap-8">
        {!hasResults && query.length > 1 && !loading && (
          <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-lg">
            No results found for "{query}".
          </div>
        )}
        
        {/* Subjects */}
        {results.subjects.length > 0 && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
             <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-2">Subjects</h3>
             <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden theme-card shadow-sm">
                {results.subjects.map((res, i) => (
                   <Link href={res.url} key={res.id} className={`flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${i !== results.subjects.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                           <Book size={14} />
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{res.title}</span>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500" />
                   </Link>
                ))}
             </div>
          </div>
        )}

        {/* Subtopics / Tasks */}
        {results.subtopics.length > 0 && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
             <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-2">Tasks</h3>
             <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden theme-card shadow-sm">
                {results.subtopics.map((res, i) => (
                   <Link href={res.url} key={res.id} className={`flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${i !== results.subtopics.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                           <CheckSquare size={14} />
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{res.title}</span>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500" />
                   </Link>
                ))}
             </div>
          </div>
        )}

        {/* Attachments / Library */}
        {results.attachments.length > 0 && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
             <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-2">Library</h3>
             <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden theme-card shadow-sm">
                {results.attachments.map((res, i) => (
                   <a href={res.url} target="_blank" rel="noopener noreferrer" key={res.id} className={`flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${i !== results.attachments.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                           <FileText size={14} />
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-md">{res.title}</span>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500" />
                   </a>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  )
}
