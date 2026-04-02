"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateDisplayName(newName: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    data: { display_name: newName }
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
