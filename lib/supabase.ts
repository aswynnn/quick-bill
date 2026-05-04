import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side singleton
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper: upload logo to Supabase Storage, return public URL
export async function uploadLogo(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const filename = `logo-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('logos')
    .upload(filename, file, { upsert: true })

  if (error) {
    console.error('Logo upload error:', error)
    return null
  }

  const { data } = supabase.storage.from('logos').getPublicUrl(filename)
  return data.publicUrl
}
