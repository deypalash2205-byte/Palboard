import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { createClient } from "@/utils/supabase/server"
import { CustomThemeProvider } from "@/components/ThemeContext"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const displayName = user?.user_metadata?.display_name || "Student"

  return (
    <CustomThemeProvider>
      <div 
        className="flex h-screen w-full overflow-hidden font-sans tracking-normal selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-500"
        style={{ 
          backgroundColor: 'var(--custom-dash-bg, #09090b)', 
          color: 'var(--custom-dash-text, #fafafa)' 
        }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <Header initialName={displayName} />
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 pb-[120px] md:pb-8">
          {children}
        </main>
      </div>
    </div>
    </CustomThemeProvider>
  )
}
