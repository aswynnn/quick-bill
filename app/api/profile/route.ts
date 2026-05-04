import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || null)
}

export async function POST(req: Request) {
  const supabase = getSupabase()
  const body = await req.json()

  // Check if a profile already exists
  const { data: existing } = await supabase
    .from('profile')
    .select('id')
    .limit(1)
    .single()

  let result
  if (existing?.id) {
    // Update existing
    const { data, error } = await supabase
      .from('profile')
      .update(body)
      .eq('id', existing.id)
      .select()
      .single()
    result = { data, error }
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('profile')
      .insert(body)
      .select()
      .single()
    result = { data, error }
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }
  return NextResponse.json(result.data)
}
