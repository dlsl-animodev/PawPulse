import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json({ error: 'Unable to load doctors right now.' }, { status: 500 })
  }

  return NextResponse.json(doctors ?? [], {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=300',
    },
  })
}
