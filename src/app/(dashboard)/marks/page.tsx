"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, ChevronDown, ChevronRight, Plus, Check, X, Trash2 } from "lucide-react"

type ExamType = "mid_term" | "end_term"

interface Mark {
  id: string
  semester_id: string
  subject_name: string
  exam_type: ExamType
  score: number
}

interface Semester {
  id: string
  user_id: string
  semester_number: number
  sgpa: number | null
  marks: Mark[]
}

export default function MarksPage() {
  const supabase = createClient()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Inline forms state
  const [addingMarkFor, setAddingMarkFor] = useState<{ id: string, type: ExamType } | null>(null)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newScore, setNewScore] = useState("")
  
  // SGPA edit state
  const [editingSgpaFor, setEditingSgpaFor] = useState<string | null>(null)
  const [tempSgpa, setTempSgpa] = useState("")

  // Row edit state
  const [editingMark, setEditingMark] = useState<{ id: string, field: 'subject_name' | 'score', value: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: sems, error } = await supabase
      .from("semesters")
      .select(`*, marks (*)`)
      .order("semester_number", { ascending: true })

    if (sems) {
      const existingNumbers = new Set(sems.map(s => s.semester_number))
      const missingSems = []
      
      for (let i = 1; i <= 8; i++) {
        if (!existingNumbers.has(i)) {
          missingSems.push({
            user_id: user.id,
            semester_number: i,
            sgpa: null
          })
        }
      }

      if (missingSems.length > 0) {
        const { data: insertedSems } = await supabase.from("semesters").insert(missingSems).select("*, marks (*)")
        if (insertedSems) {
          const combined = [...sems, ...insertedSems].sort((a, b) => a.semester_number - b.semester_number)
          setSemesters(combined as Semester[])
          if (combined.length > 0) setExpandedIds(new Set([combined[0].id]))
        }
      } else {
        setSemesters(sems as Semester[])
        if (sems.length > 0) setExpandedIds(new Set([sems[0].id]))
      }
    }
    setLoading(false)
  }

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedIds(newExpanded)
  }

  const handleCreateMark = async (semesterId: string, examType: ExamType) => {
    if (!newSubjectName.trim() || !newScore || isNaN(Number(newScore))) {
      setAddingMarkFor(null)
      return
    }

    const val = Number(newScore)
    const maxVal = examType === 'mid_term' ? 20 : 50
    if (val < 0 || val > maxVal) {
      alert(`Score must be between 0 and ${maxVal}`)
      return
    }

    const newMark = {
      user_id: userId!,
      semester_id: semesterId,
      subject_name: newSubjectName,
      exam_type: examType,
      score: val
    }

    const tempId = `temp-${Date.now()}`
    setSemesters(prev => prev.map(s => {
      if (s.id === semesterId) {
        return { ...s, marks: [...s.marks, { ...newMark, id: tempId }] }
      }
      return s
    }))

    setAddingMarkFor(null)
    setNewSubjectName("")
    setNewScore("")

    const { data, error } = await supabase.from("marks").insert([newMark]).select().single()
    if (data && !error) {
       setSemesters(prev => prev.map(s => {
        if (s.id === semesterId) {
          return { ...s, marks: s.marks.map(m => m.id === tempId ? data : m) }
        }
        return s
      }))
    } else {
      fetchData()
    }
  }

  const handleDeleteMark = async (semesterId: string, markId: string) => {
    setSemesters(prev => prev.map(s => {
        if (s.id === semesterId) {
            return { ...s, marks: s.marks.filter(m => m.id !== markId) }
        }
        return s
    }))
    const { error } = await supabase.from("marks").delete().eq("id", markId)
    if (error) fetchData()
  }

  const handleUpdateMark = async (semesterId: string, mark: Mark) => {
    if (!editingMark) return
    let valToSave: string | number = editingMark.value
    
    if (editingMark.field === 'score') {
        const val = Number(editingMark.value)
        const maxVal = mark.exam_type === 'mid_term' ? 20 : 50
        if (isNaN(val) || val < 0 || val > maxVal) {
            alert(`Score must be between 0 and ${maxVal}`)
            setEditingMark(null)
            return
        }
        valToSave = val
    } else {
        if (!editingMark.value.trim()) {
            setEditingMark(null)
            return
        }
        valToSave = editingMark.value.trim()
    }

    // Optimistic UI
    setSemesters(prev => prev.map(s => {
        if (s.id === semesterId) {
            return { ...s, marks: s.marks.map(m => m.id === mark.id ? { ...m, [editingMark.field]: valToSave } : m) }
        }
        return s
    }))
    
    setEditingMark(null)
    const { error } = await supabase.from("marks").update({ [editingMark.field]: valToSave }).eq("id", mark.id)
    if (error) fetchData()
  }

  const handleUpdateSgpa = async (semesterId: string) => {
    if (tempSgpa.trim() === "") {
        setEditingSgpaFor(null)
        return
    }
    const val = Number(tempSgpa)
    if (isNaN(val) || val < 0 || val > 10.0) {
        alert("SGPA must be a number between 0 and 10.0")
        return
    }

    setSemesters(prev => prev.map(s => s.id === semesterId ? { ...s, sgpa: val } : s))
    setEditingSgpaFor(null)
    
    const { error } = await supabase.from("semesters").update({ sgpa: val }).eq("id", semesterId)
    if (error) fetchData()
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
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Marks</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track your performance across semesters.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {semesters.map((sem) => {
          const isExpanded = expandedIds.has(sem.id)
          const midTerms = sem.marks.filter(m => m.exam_type === 'mid_term')
          const endTerms = sem.marks.filter(m => m.exam_type === 'end_term')

          return (
            <div key={sem.id} className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-sm transition-all duration-300 theme-card">
              
              {/* Semester Header */}
              <div 
                onClick={(e) => toggleExpand(sem.id, e)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded transition-colors">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <h2 className="font-semibold text-lg" style={{ color: 'var(--custom-dash-text)' }}>Semester {sem.semester_number}</h2>
                </div>

                <div className="flex items-center" onClick={e => e.stopPropagation()}>
                    {editingSgpaFor === sem.id ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">SGPA:</span>
                            <input 
                                autoFocus
                                type="number"
                                max="10"
                                step="0.01"
                                value={tempSgpa}
                                onChange={e => setTempSgpa(e.target.value)}
                                onBlur={() => handleUpdateSgpa(sem.id)}
                                onKeyDown={e => { if(e.key === "Enter") handleUpdateSgpa(sem.id); if(e.key === "Escape") setEditingSgpaFor(null); }}
                                className="w-16 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-50 tracking-tight"
                                placeholder="e.g. 9.5"
                            />
                        </div>
                    ) : (
                        <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => { setEditingSgpaFor(sem.id); setTempSgpa(sem.sgpa ? sem.sgpa.toString() : ""); }}
                        >
                            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                              SGPA: <span className="font-bold ml-1 border-b border-transparent group-hover:border-zinc-300 dark:group-hover:border-zinc-700" style={{ color: 'var(--custom-dash-text)' }}>{sem.sgpa ?? "--"}</span>
                            </span>
                        </div>
                    )}
                </div>
              </div>

              {/* Semester Body (Marks Tables) */}
              {isExpanded && (
                <div className="border-t p-4 md:p-6 flex flex-col gap-8 md:flex-row" style={{ backgroundColor: 'var(--custom-card-overlay)', borderColor: 'var(--custom-card-border)' }}>
                  
                  {/* Mid Term Section */}
                  <div className="flex-1 flex flex-col gap-3">
                    <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-800 pb-2">Mid Term Examinations</h3>
                    
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold px-2 opacity-70" style={{ color: 'var(--custom-dash-text)' }}>
                             <span>Subject</span>
                             <span>Score (/20)</span>
                        </div>
                        {midTerms.map(mark => (
                            <div key={mark.id} className="group relative flex items-center justify-between theme-card border border-white/5 dark:border-black/10 rounded-lg p-3 shadow-sm transition-colors hover:brightness-105">
                                {/* Delete Overlay */}
                                <button 
                                    onClick={() => handleDeleteMark(sem.id, mark.id)}
                                    className="absolute -left-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Subject Name Edit */}
                                {editingMark?.id === mark.id && editingMark.field === 'subject_name' ? (
                                    <input
                                        autoFocus
                                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none flex-1"
                                        value={editingMark.value}
                                        onChange={e => setEditingMark({ ...editingMark, value: e.target.value })}
                                        onBlur={() => handleUpdateMark(sem.id, mark)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") handleUpdateMark(sem.id, mark)
                                            if (e.key === "Escape") setEditingMark(null)
                                        }}
                                    />
                                ) : (
                                    <span 
                                        onClick={() => setEditingMark({ id: mark.id, field: 'subject_name', value: mark.subject_name })}
                                        className="text-sm font-medium cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-1 -ml-1 rounded transition-colors flex-1"
                                        style={{ color: 'var(--custom-dash-text)' }}
                                    >
                                        {mark.subject_name}
                                    </span>
                                )}

                                {/* Score Edit */}
                                {editingMark?.id === mark.id && editingMark.field === 'score' ? (
                                    <input
                                        autoFocus
                                        type="number"
                                        max="20"
                                        className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none w-12 text-right"
                                        value={editingMark.value}
                                        onChange={e => setEditingMark({ ...editingMark, value: e.target.value })}
                                        onBlur={() => handleUpdateMark(sem.id, mark)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") handleUpdateMark(sem.id, mark)
                                            if (e.key === "Escape") setEditingMark(null)
                                        }}
                                    />
                                ) : (
                                    <span 
                                        onClick={() => setEditingMark({ id: mark.id, field: 'score', value: mark.score.toString() })}
                                        className="text-sm font-semibold cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-1 -mr-1 rounded transition-colors"
                                        style={{ color: 'var(--custom-dash-text)' }}
                                    >
                                        {mark.score}
                                    </span>
                                )}
                            </div>
                        ))}
                        
                        {/* Inline Add Mid Term */}
                        {addingMarkFor?.id === sem.id && addingMarkFor?.type === 'mid_term' ? (
                            <div className="flex items-center gap-2 mt-2 theme-card border border-white/5 dark:border-black/5 rounded-lg p-2 shadow-sm">
                                <input 
                                    autoFocus
                                    className="flex-1 bg-transparent border-none text-sm outline-none px-2 text-zinc-900 dark:text-zinc-100" 
                                    placeholder="Subject Name"
                                    value={newSubjectName} 
                                    onChange={e => setNewSubjectName(e.target.value)} 
                                />
                                <input 
                                    type="number"
                                    max="20"
                                    className="w-16 bg-transparent border-l border-zinc-200 dark:border-zinc-800 text-sm outline-none px-2 text-right text-zinc-900 dark:text-zinc-100" 
                                    placeholder="Score"
                                    value={newScore} 
                                    onChange={e => setNewScore(e.target.value)}
                                    onKeyDown={e => { if(e.key === "Enter") handleCreateMark(sem.id, 'mid_term'); if(e.key === "Escape") setAddingMarkFor(null); }}
                                />
                                <button onClick={() => handleCreateMark(sem.id, 'mid_term')} className="text-zinc-900 dark:text-zinc-50 ml-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded"><Check size={14} /></button>
                                <button onClick={() => setAddingMarkFor(null)} className="text-zinc-500 hover:text-red-500 p-1.5 rounded"><X size={14} /></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => { setAddingMarkFor({ id: sem.id, type: 'mid_term' }); setNewSubjectName(""); setNewScore(""); }}
                                className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mt-1 transition-colors px-2 py-2 min-h-[44px] w-fit"
                            >
                                <Plus size={14} /> Add Mid Term Mark
                            </button>
                        )}
                    </div>
                  </div>

                  {/* End Term Section */}
                  <div className="flex-1 flex flex-col gap-3">
                    <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-800 pb-2">End Term Examinations</h3>
                    
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold px-2 opacity-70" style={{ color: 'var(--custom-dash-text)' }}>
                             <span>Subject</span>
                             <span>Score (/50)</span>
                        </div>
                        {endTerms.map(mark => (
                            <div key={mark.id} className="group relative flex items-center justify-between theme-card border border-white/5 dark:border-black/10 rounded-lg p-3 shadow-sm transition-colors hover:brightness-105">
                                {/* Delete Overlay */}
                                <button 
                                    onClick={() => handleDeleteMark(sem.id, mark.id)}
                                    className="absolute -left-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Subject Name Edit */}
                                {editingMark?.id === mark.id && editingMark.field === 'subject_name' ? (
                                    <input
                                        autoFocus
                                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none flex-1"
                                        value={editingMark.value}
                                        onChange={e => setEditingMark({ ...editingMark, value: e.target.value })}
                                        onBlur={() => handleUpdateMark(sem.id, mark)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") handleUpdateMark(sem.id, mark)
                                            if (e.key === "Escape") setEditingMark(null)
                                        }}
                                    />
                                ) : (
                                    <span 
                                        onClick={() => setEditingMark({ id: mark.id, field: 'subject_name', value: mark.subject_name })}
                                        className="text-sm font-medium cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-1 -ml-1 rounded transition-colors flex-1"
                                        style={{ color: 'var(--custom-dash-text)' }}
                                    >
                                        {mark.subject_name}
                                    </span>
                                )}

                                {/* Score Edit */}
                                {editingMark?.id === mark.id && editingMark.field === 'score' ? (
                                    <input
                                        autoFocus
                                        type="number"
                                        max="50"
                                        className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none w-12 text-right"
                                        value={editingMark.value}
                                        onChange={e => setEditingMark({ ...editingMark, value: e.target.value })}
                                        onBlur={() => handleUpdateMark(sem.id, mark)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") handleUpdateMark(sem.id, mark)
                                            if (e.key === "Escape") setEditingMark(null)
                                        }}
                                    />
                                ) : (
                                    <span 
                                        onClick={() => setEditingMark({ id: mark.id, field: 'score', value: mark.score.toString() })}
                                        className="text-sm font-semibold cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-1 -mr-1 rounded transition-colors"
                                        style={{ color: 'var(--custom-dash-text)' }}
                                    >
                                        {mark.score}
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Inline Add End Term */}
                        {addingMarkFor?.id === sem.id && addingMarkFor?.type === 'end_term' ? (
                            <div className="flex items-center gap-2 mt-2 theme-card border border-white/5 dark:border-black/5 rounded-lg p-2 shadow-sm">
                                <input 
                                    autoFocus
                                    className="flex-1 bg-transparent border-none text-sm outline-none px-2 text-zinc-900 dark:text-zinc-100" 
                                    placeholder="Subject Name"
                                    value={newSubjectName} 
                                    onChange={e => setNewSubjectName(e.target.value)} 
                                />
                                <input 
                                    type="number"
                                    max="50"
                                    className="w-16 bg-transparent border-l border-zinc-200 dark:border-zinc-800 text-sm outline-none px-2 text-right text-zinc-900 dark:text-zinc-100" 
                                    placeholder="Score"
                                    value={newScore} 
                                    onChange={e => setNewScore(e.target.value)}
                                    onKeyDown={e => { if(e.key === "Enter") handleCreateMark(sem.id, 'end_term'); if(e.key === "Escape") setAddingMarkFor(null); }}
                                />
                                <button onClick={() => handleCreateMark(sem.id, 'end_term')} className="text-zinc-900 dark:text-zinc-50 ml-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded"><Check size={14} /></button>
                                <button onClick={() => setAddingMarkFor(null)} className="text-zinc-500 hover:text-red-500 p-1.5 rounded"><X size={14} /></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => { setAddingMarkFor({ id: sem.id, type: 'end_term' }); setNewSubjectName(""); setNewScore(""); }}
                                className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mt-1 transition-colors px-2 py-2 min-h-[44px] w-fit"
                            >
                                <Plus size={14} /> Add End Term Mark
                            </button>
                        )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
