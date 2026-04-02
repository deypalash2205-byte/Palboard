"use client"

import React, { useState, useEffect } from "react"
import { Plus, ChevronDown, ChevronRight, Paperclip, CheckCircle2, Circle, Clock, Loader2, CalendarIcon, Trash2, File, ChevronLeft as LeftIcon, ChevronRight as RightIcon, Check, X, Inbox } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

type Status = "not started" | "in progress" | "completed"

interface Attachment {
  id: string
  record_id: string
  file_name: string
  file_url: string
}

interface Subtopic {
  id: string
  subject_id: string
  title: string
  status: Status
  due_date: string | null
  attachments?: Attachment[]
}

interface Subject {
  id: string
  user_id: string
  title: string
  status: Status
  due_date: string | null
  subtopics: Subtopic[]
  attachments?: Attachment[]
}

export default function TasksPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)

  // Custom Calendar Popover Component
  const PopoverCalendar = ({ 
    initialDate, 
    onSelect, 
    onClose 
  }: { 
    initialDate: string | null, 
    onSelect: (date: string) => void, 
    onClose: () => void 
  }) => {
    const [current, setCurrent] = useState(initialDate ? new Date(initialDate + "T00:00:00") : new Date())
    
    const y = current.getFullYear()
    const m = current.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const firstDay = new Date(y, m, 1).getDay()
    const today = new Date()
  
    const handlePrev = (e: any) => { e.stopPropagation(); setCurrent(new Date(y, m - 1, 1)) }
    const handleNext = (e: any) => { e.stopPropagation(); setCurrent(new Date(y, m + 1, 1)) }
  
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
  
    const isSelected = (d: number) => {
       if (!initialDate) return false
       const dateStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
       return initialDate === dateStr
    }
  
    const isTodayDate = (d: number) => {
       return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d
    }
  
    return (
      <div 
        className="absolute top-full mt-2 right-0 z-50 p-4 theme-card border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] w-[280px] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
         <div className="flex items-center justify-between mb-4">
           <span className="text-sm font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
             {current.toLocaleString('default', { month: 'long', year: 'numeric' })}
           </span>
           <div className="flex items-center gap-1">
             <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"><LeftIcon size={16}/></button>
             <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"><RightIcon size={16}/></button>
           </div>
         </div>
         <div className="grid grid-cols-7 gap-1 mb-2">
           {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
             <div key={d} className="text-[10px] font-bold tracking-widest uppercase text-center text-zinc-400 dark:text-zinc-500 py-1">{d}</div>
           ))}
         </div>
         <div className="grid grid-cols-7 gap-1">
           {days.map((d, i) => {
             if (d === null) return <div key={`empty-${i}`} className="w-8 h-8 mx-auto" />
             const sel = isSelected(d)
             const t = isTodayDate(d)
             return (
               <button
                 key={d}
                 onClick={(e) => {
                   e.stopPropagation();
                   const dateStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                   onSelect(dateStr)
                 }}
                 className={`w-8 h-8 mx-auto flex items-center justify-center text-xs rounded-full transition-all duration-200 hover:scale-110 ${
                   sel 
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-sm'
                    : t 
                      ? 'border border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:font-medium'
                 }`}
               >
                 {d}
               </button>
             )
           })}
         </div>
         <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
            <button onClick={(e) => { e.stopPropagation(); onClose() }} className="text-xs font-semibold tracking-wide px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Close</button>
         </div>
      </div>
    )
  }

  // Creation Modals & Inputs
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [newSubjectTitle, setNewSubjectTitle] = useState("")
  const [editingTitleFor, setEditingTitleFor] = useState<{ id: string, type: "subject" | "subtopic", currentTitle: string } | null>(null)
  const [uploadingRecords, setUploadingRecords] = useState<Set<string>>(new Set())

  const [addingSubtopicTo, setAddingSubtopicTo] = useState<string | null>(null)
  const [newSubtopicTitle, setNewSubtopicTitle] = useState("")
  const [editingDateFor, setEditingDateFor] = useState<{ id: string, type: "subject" | "subtopic" } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data, error } = await supabase
      .from("subjects")
      .select(`
        *,
        subtopics (*)
      `)
      .order("created_at", { ascending: false })

    const { data: attachmentsData } = await supabase.from('attachments').select('*')

    if (!error && data) {
      const atts = (attachmentsData || []) as Attachment[]
      const mappedSubjects = data.map((s: any) => ({
        ...s,
        attachments: atts.filter(a => a.record_id === s.id),
        subtopics: s.subtopics.map((st: any) => ({
          ...st,
          attachments: atts.filter(a => a.record_id === st.id)
        }))
      }))
      setSubjects(mappedSubjects as Subject[])
      // Expand all by default
      setExpandedIds(new Set(data.map((s: Subject) => s.id)))
    }
    setLoading(false)
  }

  // Next status toggle
  const getNextStatus = (current: Status): Status => {
    if (current === "not started") return "in progress"
    if (current === "in progress") return "completed"
    return "not started"
  }

  // --- MUTATIONS (Optimistic UI) ---

  const handleCreateSubject = async () => {
    if (!newSubjectTitle.trim() || !userId) {
      setIsAddingSubject(false)
      return
    }

    const newSubj = {
      title: newSubjectTitle,
      user_id: userId,
      status: "not started" as Status,
    }

    // Optimistic insert
    const tempId = `temp-${Date.now()}`
    const nextSubjects = [{ ...newSubj, id: tempId, due_date: null, subtopics: [] }, ...subjects]
    setSubjects(nextSubjects)
    setNewSubjectTitle("")
    setIsAddingSubject(false)

    const { data, error } = await supabase.from("subjects").insert([newSubj]).select("*, subtopics(*)").single()
    if (data && !error) {
      setSubjects(prev => prev.map(s => s.id === tempId ? data : s))
      setExpandedIds(prev => new Set(prev).add(data.id))
    } else {
      setSubjects(subjects) // revert
    }
  }

  const handleCreateSubtopic = async (subjectId: string, title: string) => {
    if (!title.trim()) return

    const newSub = {
      title,
      subject_id: subjectId,
      status: "not started" as Status,
    }

    // Optimistic insert
    const tempId = `temp-sub-${Date.now()}`
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, subtopics: [...s.subtopics, { ...newSub, id: tempId, due_date: null }] }
      }
      return s
    }))

    const { data, error } = await supabase.from("subtopics").insert([newSub]).select().single()
    if (data && !error) {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          return { ...s, subtopics: s.subtopics.map(st => st.id === tempId ? data : st) }
        }
        return s
      }))
    } else {
      fetchData() // Revert on error
    }
  }

  const toggleSubjectStatus = async (subjectId: string, currentStatus: Status) => {
    const nextStatus = getNextStatus(currentStatus)
    
    // Optimistic update
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, status: nextStatus } : s))
    
    const { error } = await supabase.from("subjects").update({ status: nextStatus }).eq("id", subjectId)
    if (error) fetchData() // Revert on error
  }

  const toggleSubtopicStatus = async (subjectId: string, subtopicId: string, currentStatus: Status) => {
    const nextStatus = getNextStatus(currentStatus)

    // Optimistic update
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, subtopics: s.subtopics.map(st => st.id === subtopicId ? { ...st, status: nextStatus } : st) }
      }
      return s
    }))

    const { error } = await supabase.from("subtopics").update({ status: nextStatus }).eq("id", subtopicId)
    if (error) fetchData() // Revert on error
  }

  const updateSubjectDate = async (subjectId: string, newDate: string | null) => {
    // Optimistic update
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, due_date: newDate } : s))
    const { error } = await supabase.from("subjects").update({ due_date: newDate || null }).eq("id", subjectId)
    if (error) fetchData()
  }

  const updateSubtopicDate = async (subjectId: string, subtopicId: string, newDate: string | null) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, subtopics: s.subtopics.map(st => st.id === subtopicId ? { ...st, due_date: newDate } : st) }
      }
      return s
    }))
    const { error } = await supabase.from("subtopics").update({ due_date: newDate || null }).eq("id", subtopicId)
    if (error) fetchData()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, recordId: string) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    setUploadingRecords(prev => new Set(prev).add(recordId))

    const fileExt = file.name.split('.').pop()
    const fileName = file.name.replace(`.${fileExt}`, '')
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '')
    const filePath = `${recordId}/${cleanFileName}-${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage.from('library-assets').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('library-assets').getPublicUrl(filePath)
      
      const { data: insertData, error: dbError } = await supabase.from('attachments').insert([{
        record_id: recordId,
        file_name: file.name,
        file_url: data.publicUrl
      }]).select().single()

      if (dbError) throw dbError
      
      setSubjects(prev => prev.map(s => {
        if (s.id === recordId) return { ...s, attachments: [...(s.attachments || []), insertData as Attachment] }
        return {
          ...s,
          subtopics: s.subtopics.map(st => st.id === recordId ? { ...st, attachments: [...(st.attachments || []), insertData as Attachment] } : st)
        }
      }))
      
    } catch (error) {
      console.error(error)
      alert("Failed to upload file. Make sure the 'library-assets' bucket exists.")
    } finally {
      setUploadingRecords(prev => {
        const next = new Set(prev)
        next.delete(recordId)
        return next
      })
      e.target.value = ''
    }
  }

  const handleDeleteAttachment = async (attachmentId: string, fileUrl: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Optimistic Update
    setSubjects(prev => prev.map(s => ({
      ...s,
      attachments: s.attachments?.filter(a => a.id !== attachmentId),
      subtopics: s.subtopics.map(st => ({
        ...st,
        attachments: st.attachments?.filter(a => a.id !== attachmentId)
      }))
    })))

    const urlParts = fileUrl.split('/library-assets/')
    if (urlParts.length === 2) {
      const filePath = urlParts[1]
      await supabase.storage.from('library-assets').remove([filePath])
    }
    await supabase.from("attachments").delete().eq("id", attachmentId)
  }

  const handleDeleteSubject = async (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const previousSubjects = [...subjects]
    setSubjects(prev => prev.filter(s => s.id !== subjectId))
    const { error } = await supabase.from("subjects").delete().eq("id", subjectId)
    if (error) setSubjects(previousSubjects)
  }

  const handleDeleteSubtopic = async (subjectId: string, subtopicId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const previousSubjects = [...subjects]
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, subtopics: s.subtopics.filter(st => st.id !== subtopicId) }
      }
      return s
    }))
    const { error } = await supabase.from("subtopics").delete().eq("id", subtopicId)
    if (error) setSubjects(previousSubjects)
  }

  const handleUpdateSubjectTitle = async (subjectId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, title: newTitle } : s))
    const { error } = await supabase.from("subjects").update({ title: newTitle }).eq("id", subjectId)
    if (error) fetchData()
  }

  const handleUpdateSubtopicTitle = async (subjectId: string, subtopicId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, subtopics: s.subtopics.map(st => st.id === subtopicId ? { ...st, title: newTitle } : st) }
      }
      return s
    }))
    const { error } = await supabase.from("subtopics").update({ title: newTitle }).eq("id", subtopicId)
    if (error) fetchData()
  }

  // --- UI HELPERS ---

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedIds(newExpanded)
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "not started": return "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
      case "in progress": return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900 hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer"
      case "completed": return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-900 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer"
    }
  }

  const StatusPill = ({ status, onClick }: { status: Status, onClick: (e: React.MouseEvent) => void }) => (
    <span 
      onClick={onClick}
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize flex items-center gap-1.5 whitespace-nowrap transition-colors ${getStatusColor(status)}`}
    >
      {status === 'completed' ? <CheckCircle2 size={12} /> : status === 'in progress' ? <Clock size={12} /> : <Circle size={12} />}
      {status}
    </span>
  )

  const DateDisplay = ({ date, isEditing, onStartEdit, onChange, onClose }: { date: string | null, isEditing: boolean, onStartEdit: (e: React.MouseEvent) => void, onChange: (newDate: string | null) => void, onClose: () => void }) => {
    return (
      <div className="relative flex items-center justify-end">
        {isEditing && <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onClose() }} />}
        
        <button 
          onClick={onStartEdit}
          className={`text-xs font-medium tracking-wide tabular-nums flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 ${isEditing ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 scale-105' : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
        >
          <CalendarIcon size={12} className={isEditing ? 'opacity-70' : ''} />
          {date ? new Date(date + "T00:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Set Date"}
        </button>

        {isEditing && (
           <PopoverCalendar initialDate={date} onSelect={onChange} onClose={onClose} />
        )}
      </div>
    )
  }

  const calculateProgress = (subtopics: Subtopic[]) => {
    if (subtopics.length === 0) return 0
    const completed = subtopics.filter(st => st.status === "completed").length
    return Math.round((completed / subtopics.length) * 100)
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
      <div className="flex items-end justify-between border-b border-zinc-200 dark:border-zinc-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Tasks</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your subjects and assignments.</p>
        </div>
        <button 
          onClick={() => setIsAddingSubject(true)}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Subject</span>
        </button>
      </div>

      {isAddingSubject && (
        <div className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 w-full overflow-hidden">
          <input
            autoFocus
            type="text"
            value={newSubjectTitle}
            onChange={e => setNewSubjectTitle(e.target.value)}
            placeholder="Type subject name and press Enter..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 w-full min-w-0"
            onKeyDown={async e => {
              if (e.key === "Enter") handleCreateSubject()
              if (e.key === "Escape") setIsAddingSubject(false)
            }}
          />
          <button onClick={() => setIsAddingSubject(false)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Cancel</button>
        </div>
      )}

      {/* Subjects List */}
      <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-sm theme-card">
        {subjects.map((subject, index) => {
          const isExpanded = expandedIds.has(subject.id)
          const hasSubtopics = subject.subtopics.length > 0
          const progress = calculateProgress(subject.subtopics)
          
          return (
            <div key={subject.id} className={`${index !== subjects.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''} ${index === 0 ? 'rounded-t-xl' : ''} ${index === subjects.length - 1 ? 'rounded-b-xl' : ''}`}>
              
              {/* Subject Row */}
              <div 
                className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 group"
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-3 cursor-text">
                    <button 
                      onClick={(e) => toggleExpand(subject.id, e)}
                      className={`p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors ${!hasSubtopics && 'opacity-30'}`}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {editingTitleFor?.id === subject.id && editingTitleFor?.type === "subject" ? (
                      <input
                        autoFocus
                        className="font-semibold text-zinc-900 dark:text-zinc-50 bg-transparent border-none outline-none flex-1"
                        value={editingTitleFor.currentTitle}
                        onChange={e => setEditingTitleFor({ ...editingTitleFor, currentTitle: e.target.value })}
                        onBlur={() => { handleUpdateSubjectTitle(subject.id, editingTitleFor.currentTitle); setEditingTitleFor(null) }}
                        onKeyDown={e => {
                          if (e.key === "Enter") { handleUpdateSubjectTitle(subject.id, editingTitleFor.currentTitle); setEditingTitleFor(null) }
                          if (e.key === "Escape") setEditingTitleFor(null)
                        }}
                      />
                    ) : (
                      <span 
                        onClick={(e) => { e.stopPropagation(); setEditingTitleFor({ id: subject.id, type: "subject", currentTitle: subject.title }); }} 
                        className="font-semibold text-zinc-900 dark:text-zinc-50 cursor-text flex-1 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 rounded px-1 -ml-1 transition-colors"
                      >
                        {subject.title}
                      </span>
                    )}
                  </div>

                  {/* Subject Attachments View */}
                  {subject.attachments && subject.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 w-full ml-9">
                      {subject.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-800/50 group/att cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700">
                          <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <File size={12} /> <span className="max-w-[150px] truncate">{att.file_name}</span>
                          </a>
                          <button onClick={(e) => handleDeleteAttachment(att.id, att.file_url, e)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover/att:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  {hasSubtopics ? (
                    <div className="flex items-center gap-3 w-48">
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-900 dark:bg-zinc-50 transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-8">{progress}%</span>
                    </div>
                  ) : (
                    <>
                      <StatusPill status={subject.status} onClick={(e) => { e.stopPropagation(); toggleSubjectStatus(subject.id, subject.status) }} />
                      <div className="w-28 flex justify-end">
                        <DateDisplay 
                          date={subject.due_date} 
                          isEditing={editingDateFor?.id === subject.id && editingDateFor?.type === "subject"}
                          onStartEdit={(e) => { e.stopPropagation(); setEditingDateFor({ id: subject.id, type: "subject" }) }}
                          onChange={newDate => { updateSubjectDate(subject.id, newDate); setEditingDateFor(null) }}
                          onClose={() => setEditingDateFor(null)}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* explicit Add Subtopic button if empty */}
                  {!hasSubtopics && (
                    <div className="flex items-center">
                      <label 
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer inline-flex items-center justify-center mr-1"
                        title="Attach File"
                      >
                         {uploadingRecords.has(subject.id) ? <Loader2 size={16} className="animate-spin text-zinc-900 dark:text-zinc-50" /> : <Paperclip size={16} />}
                         <input 
                           type="file" 
                           className="hidden" 
                           onChange={(e) => handleFileUpload(e, subject.id)}
                           disabled={uploadingRecords.has(subject.id)}
                         />
                      </label>
                      <button
                       onClick={(e) => { e.stopPropagation(); setAddingSubtopicTo(subject.id); setExpandedIds(prev => new Set(prev).add(subject.id)); }}
                       className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 rounded text-xs font-medium transition-all"
                      >
                        <Plus size={12} /> Add Subtopic
                      </button>
                    </div>
                  )}

                  {/* Subject Delete Button */}
                  <button 
                    onClick={(e) => handleDeleteSubject(subject.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-all ml-1"
                    title="Delete Subject"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Subtopics Accordion */}
              {isExpanded && (
                <div className="bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-800/50 px-4 py-2">
                  <div className="ml-10 flex flex-col gap-1 py-2">
                    {subject.subtopics.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between py-2 group/sub">
                        
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-3">
                            {editingTitleFor?.id === sub.id && editingTitleFor?.type === "subtopic" ? (
                               <input
                                 autoFocus
                                 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-transparent border-none outline-none flex-1"
                                 value={editingTitleFor.currentTitle}
                                 onChange={e => setEditingTitleFor({ ...editingTitleFor, currentTitle: e.target.value })}
                                 onBlur={() => { handleUpdateSubtopicTitle(subject.id, sub.id, editingTitleFor.currentTitle); setEditingTitleFor(null) }}
                                 onKeyDown={e => {
                                   if (e.key === "Enter") { handleUpdateSubtopicTitle(subject.id, sub.id, editingTitleFor.currentTitle); setEditingTitleFor(null) }
                                   if (e.key === "Escape") setEditingTitleFor(null)
                                 }}
                               />
                            ) : (
                              <span 
                                onClick={(e) => { e.stopPropagation(); setEditingTitleFor({ id: sub.id, type: "subtopic", currentTitle: sub.title }); }}
                                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-1 -ml-1 transition-colors"
                              >
                                {sub.title}
                              </span>
                            )}
                          </div>

                          {/* Subtopic Attachments View */}
                          {sub.attachments && sub.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 w-full pl-0">
                              {sub.attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-800/50 group/att cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700">
                                  <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                    <File size={12} /> <span className="max-w-[150px] truncate">{att.file_name}</span>
                                  </a>
                                  <button onClick={(e) => handleDeleteAttachment(att.id, att.file_url, e)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover/att:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <StatusPill status={sub.status} onClick={() => toggleSubtopicStatus(subject.id, sub.id, sub.status)} />
                          <div className="w-28 flex justify-end">
                            <DateDisplay 
                              date={sub.due_date} 
                              isEditing={editingDateFor?.id === sub.id && editingDateFor?.type === "subtopic"}
                              onStartEdit={(e) => { e.stopPropagation(); setEditingDateFor({ id: sub.id, type: "subtopic" }) }}
                              onChange={newDate => { updateSubtopicDate(subject.id, sub.id, newDate); setEditingDateFor(null) }}
                              onClose={() => setEditingDateFor(null)}
                            />
                          </div>
                          <label 
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 opacity-0 group-hover/sub:opacity-100 transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Attach File"
                          >
                            {uploadingRecords.has(sub.id) ? <Loader2 size={14} className="animate-spin text-zinc-900 dark:text-zinc-50" /> : <Paperclip size={14} />}
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, sub.id)}
                              disabled={uploadingRecords.has(sub.id)}
                            />
                          </label>
                          
                          {/* Subtopic Delete Button */}
                          <button 
                            onClick={(e) => handleDeleteSubtopic(subject.id, sub.id, e)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 opacity-0 group-hover/sub:opacity-100 transition-all"
                            title="Delete Subtopic"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                      </div>
                    ))}
                    {addingSubtopicTo === subject.id && (
                      <div className="flex flex-col gap-3 py-3 px-1 w-full md:w-2/3 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                         <div className="flex items-center gap-3 w-full">
                           <div className="w-6 h-6 rounded hidden sm:flex items-center justify-center text-zinc-400 shrink-0">
                               <Circle size={14} />
                           </div>
                           <input
                             autoFocus
                             className="text-sm font-medium tracking-wide text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 outline-none flex-1 px-3 py-3 rounded-lg shadow-sm transition-all w-full min-w-0 min-h-[44px]"
                             placeholder="What needs to be done?"
                             value={newSubtopicTitle}
                             onChange={e => setNewSubtopicTitle(e.target.value)}
                             onKeyDown={e => {
                               if (e.key === "Enter") { 
                                 if(newSubtopicTitle.trim()) handleCreateSubtopic(subject.id, newSubtopicTitle); 
                                 setAddingSubtopicTo(null); 
                                 setNewSubtopicTitle(""); 
                               }
                               if (e.key === "Escape") { setAddingSubtopicTo(null); setNewSubtopicTitle(""); }
                             }}
                           />
                         </div>
                         <div className="flex items-center gap-2 sm:ml-9 w-full">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if(newSubtopicTitle.trim()) handleCreateSubtopic(subject.id, newSubtopicTitle); 
                                setAddingSubtopicTo(null); 
                                setNewSubtopicTitle(""); 
                              }}
                              className="flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg tracking-wide text-xs font-semibold transition-colors shadow-sm min-h-[44px]"
                            >
                              <Check size={14} /> Save task
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setAddingSubtopicTo(null); setNewSubtopicTitle(""); }}
                              className="flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg tracking-wide text-xs font-semibold transition-colors min-h-[44px]"
                            >
                              <X size={14} /> Cancel
                            </button>
                         </div>
                      </div>
                    )}
                    {!addingSubtopicTo && (
                       <button 
                         onClick={() => setAddingSubtopicTo(subject.id)}
                         className="flex items-center gap-2 text-xs font-medium tracking-wide text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mt-2 py-1 transition-colors w-fit group"
                       >
                         <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-900 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                           <Plus size={14} />
                         </div>
                         <span>Add Subtopic</span>
                       </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {subjects.length === 0 && !isAddingSubject && (
          <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10 m-4 h-80">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center rounded-2xl mb-4">
               <Inbox size={24} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-bold tracking-tight text-lg mb-1">
              No subjects yet
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[280px] mb-6">
               Get started by creating your first subject to organize your tasks.
            </p>
            <button 
              onClick={() => setIsAddingSubject(true)}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-semibold tracking-wide hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
               Create your first Subject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
