import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { userId, updates } = await request.json()

        const supabase = await createClient()

        console.log('Testing profile update for user:', userId)
        console.log('Updates:', updates)

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.error('Update error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        console.log('Update successful:', data)
        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
