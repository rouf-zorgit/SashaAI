import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({
                error: 'Missing environment variables',
                details: 'Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
            }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        console.log('🔧 Executing RLS fix...')

        const sql = `
            -- Drop ALL potential conflicting policies
            DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
            DROP POLICY IF EXISTS "Enable update for users based on user_id" ON transactions;
            DROP POLICY IF EXISTS "update_own_transactions" ON transactions;

            -- Create the correct policy
            CREATE POLICY "Users can update own transactions" 
            ON transactions 
            FOR UPDATE 
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        `

        const { error } = await supabase.rpc('exec_sql', { sql })

        if (error) {
            console.error('❌ SQL Execution Error:', error)

            // Fallback: Try to create policy directly if exec_sql fails (it might not exist)
            // Note: We can't run raw SQL without a helper function usually.
            // If this fails, we return the error.
            return NextResponse.json({
                error: 'Failed to execute SQL',
                details: error.message,
                hint: 'The exec_sql function might be missing. You MUST run the SQL in Supabase Dashboard.'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'RLS Policy Fixed Successfully! You can now edit transactions.'
        })

    } catch (error: any) {
        console.error('❌ Unexpected Error:', error)
        return NextResponse.json({
            error: 'Unexpected error',
            details: error.message
        }, { status: 500 })
    }
}
