import { createClient } from '@/lib/supabase/client'
import { Reminder } from '@/types/database'

export async function getUserReminders(userId: string): Promise<Reminder[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })

    if (error) throw error
    return data || []
}

export async function createReminder(
    userId: string,
    reminder: {
        title: string
        amount: number
        due_date: string
        is_recurring: boolean
    }
) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('reminders')
        .insert({
            user_id: userId,
            ...reminder,
        })
        .select()
        .single()

    if (error) throw error

    // Create notification for reminder
    await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type: 'reminder',
            title: `Reminder: ${reminder.title}`,
            message: `Due on ${reminder.due_date}`,
            related_id: data.id,
        })

    return data
}

export async function markReminderPaid(reminderId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('reminders')
        .update({ is_paid: true })
        .eq('id', reminderId)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteReminder(reminderId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)

    if (error) throw error
}
