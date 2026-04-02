"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, X, ExternalLink } from "lucide-react"
import Link from "next/link"

interface CalendarTask {
  id: string
  title: string
  status: "not started" | "in progress" | "completed"
  due_date: string
  type: "subject" | "subtopic"
  subjectTitle: string
}

export default function CalendarPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data: subjectData } = await supabase.from("subjects").select("id, title, status, due_date").not("due_date", "is", null)
    const { data: subtopicData } = await supabase.from("subtopics").select("id, title, status, due_date, subjects(title)").not("due_date", "is", null)
    
    const combinedTasks: CalendarTask[] = [
      ...(subjectData || []).map((s: any) => ({ ...s, type: "subject" as const, subjectTitle: s.title })),
      ...(subtopicData || []).map((s: any) => ({ ...s, type: "subtopic" as const, subjectTitle: s.subjects?.title || "Unknown Subject" }))
    ]
    
    setTasks(combinedTasks)
    setLoading(false)
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const handleToday = () => setCurrentDate(new Date())

  const getColorClasses = (subjectName: string) => {
    const chars = subjectName.split('')
    const hash = chars.reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    const colors = [
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800",
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800"
    ]
    return colors[hash % colors.length]
  }

  const renderCells = () => {
    const cells = []
    
    // Empty cells for prior month
    for (let i = 0; i < firstDay; i++) {
        cells.push(<div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-zinc-100 dark:border-zinc-800/50 p-2 opacity-30 bg-zinc-50 dark:bg-zinc-900/20" />)
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateString))
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
      
      const MAX_VISIBLE = 3;
      const visibleTasks = dayTasks.slice(0, MAX_VISIBLE);
      const hiddenCount = dayTasks.length > MAX_VISIBLE ? dayTasks.length - MAX_VISIBLE : 0;

      cells.push(
        <div key={day} className={`min-h-[120px] p-2 flex flex-col gap-1 transition-colors border-b border-r border-zinc-100 dark:border-zinc-800/80 hover:brightness-105 ${isToday ? 'bg-zinc-50/80 dark:bg-zinc-900/50 ring-1 ring-inset ring-zinc-900 dark:ring-zinc-100 shadow-inner' : 'theme-card'}`}>
           <div className="flex justify-between items-start">
             <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {day}
             </span>
           </div>
           
           <div className="flex flex-col gap-1 mt-1 flex-1 pr-1">
             {visibleTasks.map(task => {
                const colorCode = getColorClasses(task.subjectTitle)
                const isCompleted = task.status === 'completed'
                return (
                  <button 
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedTask(task) }}
                    className={`text-[10px] font-semibold tracking-wide px-1.5 py-1 rounded w-full truncate border shadow-sm transition-all duration-200 hover:scale-[1.02] hover:brightness-110 text-left ${isCompleted ? 'opacity-40 line-through bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500' : colorCode}`}
                    title={task.title}
                  >
                    {task.title}
                  </button>
                )
             })}
             {hiddenCount > 0 && (
               <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 px-1 mt-0.5">
                 +{hiddenCount} more
               </div>
             )}
           </div>
        </div>
      )
    }

    // Padding end cells to complete grid
    const totalCells = cells.length
    const remainingCells = (7 - (totalCells % 7)) % 7
    for (let i = 0; i < remainingCells; i++) {
        cells.push(<div key={`end-empty-${i}`} className="min-h-[120px] border-b border-r border-zinc-100 dark:border-zinc-800/50 p-2 opacity-30 bg-zinc-50 dark:bg-zinc-900/20" />)
    }

    return cells
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out pb-20 h-full w-full">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <CalendarIcon className="text-zinc-400 dark:text-zinc-500" /> Calendar
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Monthly view of your submission dates.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <button 
            onClick={handleToday} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide border border-zinc-200 dark:border-zinc-800 theme-card hover:brightness-105 text-zinc-900 dark:text-zinc-100 transition-colors shadow-sm"
          >
            Today
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 w-36 text-center">
              {monthNames[month]} {year}
            </span>
            <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden theme-card shadow-sm">
              <button onClick={handlePrevMonth} className="px-3 py-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
              <button onClick={handleNextMonth} className="px-3 py-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" size={24} />
        </div>
      ) : (
        <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden theme-card shadow-sm flex-1 mb-10 w-full max-w-6xl mx-auto">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/50 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 flex-1">
            {renderCells()}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4" onClick={(e) => { e.stopPropagation(); setSelectedTask(null); }}>
          <div className="theme-card border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{selectedTask.type}</span>
                 <button onClick={() => setSelectedTask(null)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-1.5 rounded-md"><X size={14}/></button>
               </div>
               <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight mb-2">{selectedTask.title}</h2>
               <p className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400 mb-8 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                 {selectedTask.subjectTitle}
               </p>
               
               <div className="flex items-center gap-3 w-full">
                 <Link href="/tasks" onClick={() => setSelectedTask(null)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-sm font-semibold tracking-wide hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-sm">
                   Go to Tasks <ExternalLink size={16} className="opacity-70" />
                 </Link>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
