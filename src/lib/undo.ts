import { supabase } from '../supabase';
import type { Transaction } from '../../types/supabase';

interface UndoAction {
    id: string;
    user_id: string;
    action_type: 'delete' | 'edit' | 'create';
    entity_type: 'transaction';
    entity_id: string;
    previous_data: any;
    created_at: string;
    expires_at: string;
}

const UNDO_EXPIRY_MINUTES = 5;

/**
 * Record an action for undo
 */
export async function recordUndoAction(
    userId: string,
    actionType: 'delete' | 'edit' | 'create',
    entityType: 'transaction',
    entityId: string,
    previousData: any
): Promise<string | null> {
    try {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + UNDO_EXPIRY_MINUTES);

        const { data, error } = await supabase
            .from('undo_actions')
            .insert({
                user_id: userId,
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId,
                previous_data: previousData,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data.id;
    } catch (error) {
        console.error('Error recording undo action:', error);
        return null;
    }
}

/**
 * Get recent undo actions for user
 */
export async function getRecentUndoActions(userId: string): Promise<UndoAction[]> {
    try {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('undo_actions')
            .select('*')
            .eq('user_id', userId)
            .gt('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;
        return data as UndoAction[];
    } catch (error) {
        console.error('Error fetching undo actions:', error);
        return [];
    }
}

/**
 * Undo an action
 */
export async function undoAction(undoId: string): Promise<boolean> {
    try {
        // Get the undo action
        const { data: undoAction, error: fetchError } = await supabase
            .from('undo_actions')
            .select('*')
            .eq('id', undoId)
            .single();

        if (fetchError || !undoAction) throw new Error('Undo action not found');

        // Check if expired
        if (new Date(undoAction.expires_at) < new Date()) {
            throw new Error('Undo action expired');
        }

        // Perform the undo based on action type
        if (undoAction.entity_type === 'transaction') {
            switch (undoAction.action_type) {
                case 'delete':
                    // Restore deleted transaction
                    await supabase
                        .from('transactions')
                        .update({ deleted_at: null })
                        .eq('id', undoAction.entity_id);
                    break;

                case 'edit':
                    // Restore previous transaction data
                    await supabase
                        .from('transactions')
                        .update(undoAction.previous_data)
                        .eq('id', undoAction.entity_id);
                    break;

                case 'create':
                    // Delete the created transaction
                    await supabase
                        .from('transactions')
                        .update({ deleted_at: new Date().toISOString() })
                        .eq('id', undoAction.entity_id);
                    break;
            }
        }

        // Delete the undo action
        await supabase
            .from('undo_actions')
            .delete()
            .eq('id', undoId);

        return true;
    } catch (error) {
        console.error('Error undoing action:', error);
        return false;
    }
}

/**
 * Clean up expired undo actions
 */
export async function cleanupExpiredUndoActions(userId: string): Promise<void> {
    try {
        const now = new Date().toISOString();

        await supabase
            .from('undo_actions')
            .delete()
            .eq('user_id', userId)
            .lt('expires_at', now);
    } catch (error) {
        console.error('Error cleaning up undo actions:', error);
    }
}
