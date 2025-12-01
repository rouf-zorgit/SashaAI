import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all user data
        const [
            { data: profile },
            { data: transactions },
            { data: goals },
            { data: reminders },
            { data: messages }
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('transactions').select('*').eq('user_id', user.id).is('deleted_at', null).order('date', { ascending: false }),
            supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('reminders').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
            supabase.from('messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ])

        // Create CSV content
        let csvContent = ''

        // Profile Section
        csvContent += '=== PROFILE ===\n'
        csvContent += 'Field,Value\n'
        if (profile) {
            csvContent += `Email,${profile.email}\n`
            csvContent += `Full Name,${profile.full_name || ''}\n`
            csvContent += `Currency,${profile.currency}\n`
            csvContent += `Country,${profile.country || ''}\n`
            csvContent += `Monthly Salary,${profile.monthly_salary || ''}\n`
            csvContent += `Primary Goal,${profile.primary_goal || ''}\n`
        }
        csvContent += '\n\n'

        // Transactions Section
        csvContent += '=== TRANSACTIONS ===\n'
        csvContent += 'Date,Type,Category,Amount,Currency,Merchant,Description,Confidence,Confirmed\n'
        transactions?.forEach(tx => {
            const row = [
                tx.date || '',
                tx.type || '',
                tx.category || '',
                tx.amount || '',
                tx.currency || '',
                tx.merchant_name || '',
                (tx.description || '').replace(/,/g, ';'), // Replace commas to avoid CSV issues
                tx.confidence || '',
                tx.is_confirmed ? 'Yes' : 'No'
            ]
            csvContent += row.join(',') + '\n'
        })
        csvContent += '\n\n'

        // Goals Section
        csvContent += '=== GOALS ===\n'
        csvContent += 'Title,Category,Target Amount,Current Amount,Deadline,Status\n'
        goals?.forEach(goal => {
            const row = [
                (goal.title || '').replace(/,/g, ';'),
                goal.category || '',
                goal.target_amount || '',
                goal.current_amount || '',
                goal.deadline || '',
                goal.is_completed ? 'Completed' : 'Active'
            ]
            csvContent += row.join(',') + '\n'
        })
        csvContent += '\n\n'

        // Reminders Section
        csvContent += '=== REMINDERS ===\n'
        csvContent += 'Title,Amount,Due Date,Recurring,Status\n'
        reminders?.forEach(reminder => {
            const row = [
                (reminder.title || '').replace(/,/g, ';'),
                reminder.amount || '',
                reminder.due_date || '',
                reminder.is_recurring ? 'Yes' : 'No',
                reminder.is_paid ? 'Paid' : 'Pending'
            ]
            csvContent += row.join(',') + '\n'
        })
        csvContent += '\n\n'

        // Chat History Section
        csvContent += '=== CHAT HISTORY ===\n'
        csvContent += 'Date,Role,Message\n'
        messages?.forEach(msg => {
            const row = [
                new Date(msg.created_at).toISOString().split('T')[0],
                msg.role || '',
                (msg.content || '').replace(/,/g, ';').replace(/\n/g, ' ')
            ]
            csvContent += row.join(',') + '\n'
        })

        // Create response with CSV file
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `finai-export-${timestamp}.csv`

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })

    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
    }
}
