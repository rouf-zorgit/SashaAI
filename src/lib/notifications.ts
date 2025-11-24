import { supabase } from '../supabase';

export interface Notification {
    id: string;
    user_id: string;
    type: 'insight' | 'reminder' | 'alert';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
}

/**
 * Create a notification
 */
export async function createNotification(
    userId: string,
    type: 'insight' | 'reminder' | 'alert',
    title: string,
    message: string,
    actionUrl?: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                action_url: actionUrl,
                is_read: false
            });

        return !error;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as Notification[];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        return !error;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Check if user can receive notification (anti-spam)
 */
export async function canSendNotification(
    userId: string,
    type: 'insight' | 'reminder' | 'alert'
): Promise<boolean> {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get today's notifications of this type
        const { data, error } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', type)
            .gte('created_at', todayStart.toISOString());

        if (error) throw error;

        // Limits per day
        const limits = {
            insight: 2,
            reminder: 10,
            alert: 5
        };

        return (data?.length || 0) < limits[type];
    } catch (error) {
        console.error('Error checking notification limit:', error);
        return false;
    }
}

/**
 * Detect spending spike and create notification
 */
export async function detectSpendingSpike(userId: string): Promise<void> {
    try {
        const canSend = await canSendNotification(userId, 'insight');
        if (!canSend) return;

        // Get last 7 days spending
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .is('deleted_at', null)
            .gte('created_at', sevenDaysAgo.toISOString());

        if (!transactions || transactions.length < 5) return;

        // Calculate daily averages
        const dailySpending: Record<string, number> = {};
        transactions.forEach(t => {
            const date = new Date(t.created_at).toDateString();
            dailySpending[date] = (dailySpending[date] || 0) + Math.abs(Number(t.amount));
        });

        const amounts = Object.values(dailySpending);
        const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const today = dailySpending[new Date().toDateString()] || 0;

        // Spike if today is 2x average
        if (today > average * 2) {
            await createNotification(
                userId,
                'insight',
                'Spending Spike Detected',
                `You've spent ৳${today.toFixed(0)} today, which is ${((today / average - 1) * 100).toFixed(0)}% more than your daily average.`,
                '/history'
            );
        }
    } catch (error) {
        console.error('Error detecting spending spike:', error);
    }
}

/**
 * Check budget overruns and create notifications
 */
export async function checkBudgetOverruns(userId: string): Promise<void> {
    try {
        const canSend = await canSendNotification(userId, 'alert');
        if (!canSend) return;

        const { data: budgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (!budgets) return;

        for (const budget of budgets) {
            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'expense')
                .eq('category', budget.category)
                .is('deleted_at', null)
                .gte('created_at', budget.start_date);

            const spent = transactions?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
            const percentage = (spent / budget.amount) * 100;

            if (percentage >= 100) {
                await createNotification(
                    userId,
                    'alert',
                    'Budget Exceeded',
                    `Your ${budget.category} budget is ${percentage.toFixed(0)}% used (৳${spent.toFixed(0)} / ৳${budget.amount.toFixed(0)})`,
                    '/budgets'
                );
            } else if (percentage >= budget.alert_threshold) {
                await createNotification(
                    userId,
                    'alert',
                    'Budget Alert',
                    `Your ${budget.category} budget is ${percentage.toFixed(0)}% used. You have ৳${(budget.amount - spent).toFixed(0)} remaining.`,
                    '/budgets'
                );
            }
        }
    } catch (error) {
        console.error('Error checking budget overruns:', error);
    }
}

/**
 * Send bill reminders
 */
export async function sendBillReminders(userId: string): Promise<void> {
    try {
        const canSend = await canSendNotification(userId, 'reminder');
        if (!canSend) return;

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const { data: reminders } = await supabase
            .from('bill_reminders')
            .select('*')
            .eq('user_id', userId)
            .eq('is_paid', false)
            .lte('due_date', threeDaysFromNow.toISOString());

        if (!reminders) return;

        for (const reminder of reminders) {
            const dueDate = new Date(reminder.due_date);
            const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            if (daysUntil <= 3 && daysUntil >= 0) {
                await createNotification(
                    userId,
                    'reminder',
                    'Bill Due Soon',
                    `${reminder.title} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}${reminder.amount ? ` (৳${reminder.amount.toFixed(0)})` : ''}`,
                    '/reminders'
                );
            } else if (daysUntil < 0) {
                await createNotification(
                    userId,
                    'reminder',
                    'Overdue Bill',
                    `${reminder.title} is ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue!`,
                    '/reminders'
                );
            }
        }
    } catch (error) {
        console.error('Error sending bill reminders:', error);
    }
}
