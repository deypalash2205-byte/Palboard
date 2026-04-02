"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"

interface Mark {
  exam_type: "mid_term" | "end_term"
  score: number
}

interface Semester {
  id: string
  semester_number: number
  sgpa: number | null
  marks: Mark[]
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [semesters, setSemesters] = useState<Semester[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: sems } = await supabase
      .from("semesters")
      .select(`*, marks(exam_type, score)`)
      .order("semester_number", { ascending: true })

    if (sems) {
      setSemesters(sems as Semester[])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    )
  }

  // Formatting data for SGPA Line Chart
  const sgpaData = semesters
    .filter(s => s.sgpa !== null)
    .map(s => ({
      name: `Sem ${s.semester_number}`,
      SGPA: Number(s.sgpa)
    }))

  // Formatting data for Mid vs End Term Bar Chart
  const termData = semesters.map(s => {
    const midTerms = s.marks.filter(m => m.exam_type === 'mid_term')
    const endTerms = s.marks.filter(m => m.exam_type === 'end_term')

    const avgMid = midTerms.length > 0 ? (midTerms.reduce((acc, curr) => acc + curr.score, 0) / midTerms.length).toFixed(1) : 0
    const avgEnd = endTerms.length > 0 ? (endTerms.reduce((acc, curr) => acc + curr.score, 0) / endTerms.length).toFixed(1) : 0

    return {
      name: `Sem ${s.semester_number}`,
      "Mid Term Avg": Number(avgMid) || 0,
      "End Term Avg": Number(avgEnd) || 0
    }
  })

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out pb-20">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Visualize your academic trajectory over time.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Graph 1: SGPA Trend */}
        <div className="border border-zinc-200 dark:border-zinc-800 theme-card rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Overall SGPA Trend</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Progression across all complete semesters.</p>
          </div>
          
          <div className="w-full mt-4 overflow-hidden -ml-4 sm:ml-0">
            {sgpaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sgpaData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} domain={[0, 10]} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', color: '#f4f4f5' }}
                        itemStyle={{ color: '#f4f4f5' }}
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
                <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400 border border-dashed rounded-lg">
                    Not enough SGPA data. Update Marks page!
                </div>
            )}
          </div>
        </div>

        {/* Graph 2: Mid vs End Term */}
        <div className="border border-zinc-200 dark:border-zinc-800 theme-card rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Mid Term vs End Term</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Comparing average scores strictly by semester.</p>
          </div>
          
          <div className="w-full mt-4 overflow-hidden -ml-4 sm:ml-0">
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={termData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barGap={0}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', color: '#f4f4f5' }}
                     itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#71717A', marginTop: 10 }} />
                  <Bar dataKey="Mid Term Avg" fill="var(--custom-dash-text, #71717A)" radius={[4, 4, 0, 0]} barSize={20} style={{ opacity: 0.5 }} />
                  <Bar dataKey="End Term Avg" fill="var(--custom-dash-text, #18181B)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
