"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, ArrowRight, User as UserIcon, Activity } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import Link from "next/link"

interface DataState {
  ovr: number
  avgSgpa: number
  avgMid: number
  avgEnd: number
  sgpaData: any[]
  activeTasks: any[]
  userMeta: any
}

export default function HomePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DataState>({
    ovr: 0,
    avgSgpa: 0,
    avgMid: 0,
    avgEnd: 0,
    sgpaData: [],
    activeTasks: [],
    userMeta: null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Parallel fetch
    const [semsResponse, subjsResponse] = await Promise.all([
      supabase.from("semesters").select(`*, marks(*)`).order("semester_number", { ascending: true }),
      supabase.from("subjects").select(`*, subtopics(*)`)
    ])

    const sems = semsResponse.data || []
    const subjs = subjsResponse.data || []

    // 1. Calculate Averages
    let totalSgpa = 0, sgpaCount = 0
    let totalMid = 0, midCount = 0
    let totalEnd = 0, endCount = 0

    const sgpaData: any[] = []

    sems.forEach(sem => {
      if (sem.sgpa !== null) {
        totalSgpa += Number(sem.sgpa)
        sgpaCount++
        sgpaData.push({ name: `Sem ${sem.semester_number}`, SGPA: Number(sem.sgpa) })
      }
      sem.marks.forEach((m: any) => {
        if (m.exam_type === 'mid_term') { totalMid += Number(m.score); midCount++ }
        if (m.exam_type === 'end_term') { totalEnd += Number(m.score); endCount++ }
      })
    })

    const avgSgpa = sgpaCount > 0 ? (totalSgpa / sgpaCount) : 0
    const avgMid = midCount > 0 ? (totalMid / midCount) : 0
    const avgEnd = endCount > 0 ? (totalEnd / endCount) : 0

    // OVR Calculation (weighted approach)
    // SGPA weighs 50%, End Term weighs 30%, Mid Term weighs 20%
    const sgpaPercent = (avgSgpa / 10) * 100
    const endPercent = (avgEnd / 50) * 100
    const midPercent = (avgMid / 20) * 100
    
    let ovr = 0
    if (sgpaCount > 0 || midCount > 0 || endCount > 0) {
      ovr = Math.round((sgpaPercent * 0.5) + (endPercent * 0.3) + (midPercent * 0.2))
    }

    // 2. Active Tasks Sorting
    const tasks = subjs.map(subj => {
      let progress = 0
      if (subj.subtopics.length > 0) {
        const completed = subj.subtopics.filter((st: any) => st.status === 'completed').length
        progress = Math.round((completed / subj.subtopics.length) * 100)
      } else {
        progress = subj.status === 'completed' ? 100 : 0
      }
      return { ...subj, progress }
    }).filter(t => t.progress < 100)
    
    // Sort highest progress to lowest
    tasks.sort((a, b) => b.progress - a.progress)

    setData({
      ovr,
      avgSgpa: Number(avgSgpa.toFixed(2)),
      avgMid: Number(avgMid.toFixed(1)),
      avgEnd: Number(avgEnd.toFixed(1)),
      sgpaData,
      activeTasks: tasks.slice(0, 5), // Show top 5
      userMeta: user.user_metadata
    })

    setLoading(false)
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
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your academic snapshot.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* -- Left Column: FIFA Stat Card -- */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="relative overflow-hidden border border-zinc-200 dark:border-zinc-800/50 theme-card rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            
            {/* OVR Badge */}
            <div className="absolute top-4 left-4 font-black text-2xl tracking-tighter px-3 py-1 rounded-lg" style={{ backgroundColor: 'var(--custom-dash-text, #18181b)', color: 'var(--custom-card-bg, var(--background))' }}>
              {data.ovr}
              <span className="block text-[0.5rem] uppercase tracking-widest opacity-80 -mt-1">OVR</span>
            </div>

            {/* Avatar Placeholder */}
            <div className="w-24 h-24 mt-4 bg-zinc-200 dark:bg-zinc-800 rounded-full border-4 border-white dark:border-zinc-950 shadow-md flex items-center justify-center overflow-hidden relative">
               {data.userMeta?.avatarUrl ? (
                 <img src={data.userMeta.avatarUrl} alt="Player Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon size={40} className="text-zinc-400 dark:text-zinc-600" />
               )}
            </div>

            <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
              {data.userMeta?.display_name || "Player"}
            </h2>
            <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-4" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full px-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">{data.avgSgpa}</span>
                <span className="text-[0.6rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">SGPA</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">{data.avgMid}</span>
                <span className="text-[0.6rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Mid Term</span>
              </div>
              <div className="flex flex-col items-center col-span-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">{data.avgEnd}</span>
                <span className="text-[0.6rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">End Term</span>
              </div>
            </div>

          </div>
        </div>

        {/* -- Right Column: Tasks & Charts -- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Mini Analytics Chart */}
          <div className="border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-950/50 theme-card rounded-2xl p-6 shadow-sm flex flex-col gap-4 w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-zinc-400 dark:text-zinc-500" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">SGPA Trajectory</h3>
              </div>
              <Link href="/analytics" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors">
                 Full Analytics <ArrowRight size={12} />
              </Link>
            </div>
            
            <div className="flex-1 w-full relative flex items-center justify-center -ml-4 sm:ml-0">
              {data.sgpaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.sgpaData} margin={{ top: 15, right: 30, left: 0, bottom: 10 }}>
                    <XAxis dataKey="name" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} padding={{ left: 40, right: 40 }} dy={10} />
                    <YAxis domain={[0, 10]} hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', color: '#f4f4f5' }}
                        itemStyle={{ color: '#f4f4f5' }}
                        cursor={{ stroke: '#E4E4E7', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="SGPA" 
                        stroke="var(--custom-dash-text, #18181b)" 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 2, fill: 'var(--custom-card-bg, #fff)', stroke: 'var(--custom-dash-text, #18181b)' }} 
                        activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    Awaiting data points.
                </div>
              )}
            </div>
          </div>

          {/* Active Tasks Overview */}
          <div className="border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-950/50 theme-card rounded-2xl p-6 shadow-sm flex flex-col gap-4 flex-1">
             <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Priority Tasks</h3>
                <Link href="/tasks" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors">
                  View All <ArrowRight size={12} />
                </Link>
             </div>

             <div className="flex flex-col gap-1 mt-2">
                {data.activeTasks.length > 0 ? data.activeTasks.map(task => (
                   <Link 
                     href="/tasks" 
                     key={task.id} 
                     className="group flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                   >
                     <div className="flex flex-col gap-1.5 flex-1 pr-6">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-3 w-full max-w-[200px]">
                          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-zinc-900 dark:bg-zinc-50 transition-all duration-500 ease-out"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                     </div>
                     <span className="text-xs font-bold font-mono text-zinc-400 dark:text-zinc-500 w-10 text-right">
                        {task.progress}%
                     </span>
                   </Link>
                )) : (
                   <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                     No active tasks. You're all caught up!
                   </div>
                )}
             </div>
          </div>

        </div>
      </div>
      
    </div>
  )
}
