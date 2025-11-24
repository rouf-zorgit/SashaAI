import { supabase } from '../supabase';

// ============================================
// USER PROFILE EXTENDED
// ============================================

export interface UserProfileExtended {
    user_id: string;
    spending_personality?: 'impulsive' | 'cautious' | 'balanced';
    primary_goal?: 'save' | 'invest' | 'debt_free' | 'budget';
    risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
    trigger_categories?: string[];
    salary_day?: number;
    monthly_income?: number;
    monthly_budget?: number;
    sarcasm_preference?: 'high' | 'medium' | 'low' | 'off';
    onboarding_completed?: boolean;
    leaderboard_opt_in?: boolean;
    anonymous_username?: string;
    created_at?: string;
    updated_at?: string;
}

export async function getUserProfileExtended(userId: string): Promise<UserProfileExtended | null> {
    const { data, error } = await supabase
        .from('user_profiles_extended')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching extended profile:', error);
        return null;
    }

    return data;
}

export async function createUserProfileExtended(profile: UserProfileExtended): Promise<UserProfileExtended> {
    const { data, error } = await supabase
        .from('user_profiles_extended')
        .insert(profile)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateUserProfileExtended(
    userId: string,
    updates: Partial<UserProfileExtended>
): Promise<UserProfileExtended> {
    const { data, error } = await supabase
        .from('user_profiles_extended')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// SPENDING PATTERNS
// ============================================

export interface SpendingPattern {
    id?: string;
    user_id: string;
    pattern_type: 'weekend_spike' | 'payday_splurge' | 'stress_shopping' | 'recurring_bill' | 'impulse_category';
    trigger_day?: string;
    trigger_category?: string;
    avg_amount?: number;
    frequency?: string;
    confidence?: number;
    first_detected?: string;
    last_occurred?: string;
    occurrence_count?: number;
    created_at?: string;
}

export async function getUserPatterns(userId: string): Promise<SpendingPattern[]> {
    const { data, error } = await supabase
        .from('spending_patterns')
        .select('*')
        .eq('user_id', userId)
        .order('confidence', { ascending: false });

    if (error) {
        console.error('Error fetching patterns:', error);
        return [];
    }

    return data || [];
}

export async function createPattern(pattern: SpendingPattern): Promise<SpendingPattern> {
    const { data, error } = await supabase
        .from('spending_patterns')
        .insert(pattern)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updatePattern(
    patternId: string,
    updates: Partial<SpendingPattern>
): Promise<SpendingPattern> {
    const { data, error } = await supabase
        .from('spending_patterns')
        .update(updates)
        .eq('id', patternId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// SMART NOTIFICATIONS
// ============================================

export interface SmartNotification {
    id?: string;
    user_id: string;
    notification_type: 'bill_reminder' | 'budget_alert' | 'pattern_warning' | 'goal_update' | 'weekly_summary' | 'smart_reminder';
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    is_read?: boolean;
    action_url?: string;
    scheduled_for?: string;
    sent_at?: string;
    created_at?: string;
}

export async function getUserNotifications(userId: string, limit = 20): Promise<SmartNotification[]> {
    const { data, error } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data || [];
}

export async function getUnreadNotifications(userId: string): Promise<SmartNotification[]> {
    const { data, error } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching unread notifications:', error);
        return [];
    }

    return data || [];
}

export async function createNotification(notification: SmartNotification): Promise<SmartNotification> {
    const { data, error } = await supabase
        .from('smart_notifications')
        .insert(notification)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('smart_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
        .from('smart_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
}

// ============================================
// STREAKS
// ============================================

export interface Streak {
    id?: string;
    user_id: string;
    streak_type: 'budget' | 'savings' | 'logging' | 'no_impulse';
    current_days?: number;
    best_days?: number;
    started_at?: string;
    last_updated?: string;
    is_active?: boolean;
    created_at?: string;
}

export async function getUserStreaks(userId: string): Promise<Streak[]> {
    const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching streaks:', error);
        return [];
    }

    return data || [];
}

export async function getStreak(userId: string, streakType: string): Promise<Streak | null> {
    const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', streakType)
        .eq('is_active', true)
        .single();

    if (error) return null;
    return data;
}

export async function createStreak(streak: Streak): Promise<Streak> {
    const { data, error } = await supabase
        .from('streaks')
        .insert(streak)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateStreak(
    streakId: string,
    updates: Partial<Streak>
): Promise<Streak> {
    const { data, error } = await supabase
        .from('streaks')
        .update(updates)
        .eq('id', streakId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// BADGES
// ============================================

export interface Badge {
    id: string;
    code: string;
    name: string;
    description?: string;
    icon?: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    criteria: any;
    created_at?: string;
}

export interface UserBadge {
    id?: string;
    user_id: string;
    badge_id: string;
    earned_at?: string;
    notified?: boolean;
    badge?: Badge;
}

export async function getAllBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('tier', { ascending: true });

    if (error) {
        console.error('Error fetching badges:', error);
        return [];
    }

    return data || [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

    if (error) {
        console.error('Error fetching user badges:', error);
        return [];
    }

    return data || [];
}

export async function awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId })
        .select('*, badge:badges(*)')
        .single();

    if (error) throw error;
    return data;
}

export async function hasUserEarnedBadge(userId: string, badgeId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

    return !error && !!data;
}

// ============================================
// COACHING SESSIONS
// ============================================

export interface CoachingSession {
    id?: string;
    user_id: string;
    topic: 'debt_payoff' | 'investing_basics' | 'emergency_fund' | 'budgeting' | 'salary_negotiation';
    status?: 'active' | 'completed' | 'abandoned';
    current_step?: number;
    total_steps?: number;
    progress_data?: any;
    started_at?: string;
    completed_at?: string;
    created_at?: string;
}

export async function getActiveCoachingSession(userId: string): Promise<CoachingSession | null> {
    const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (error) return null;
    return data;
}

export async function createCoachingSession(session: CoachingSession): Promise<CoachingSession> {
    const { data, error } = await supabase
        .from('coaching_sessions')
        .insert(session)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCoachingSession(
    sessionId: string,
    updates: Partial<CoachingSession>
): Promise<CoachingSession> {
    const { data, error } = await supabase
        .from('coaching_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// CASH FLOW PREDICTIONS
// ============================================

export interface CashFlowPrediction {
    id?: string;
    user_id: string;
    prediction_date: string;
    predicted_balance?: number;
    predicted_income?: number;
    predicted_expenses?: number;
    confidence?: number;
    warning_level?: 'safe' | 'caution' | 'danger' | 'crisis';
    created_at?: string;
}

export async function getCashFlowPredictions(
    userId: string,
    daysAhead = 30
): Promise<CashFlowPrediction[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const { data, error } = await supabase
        .from('cash_flow_predictions')
        .select('*')
        .eq('user_id', userId)
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .lte('prediction_date', endDate.toISOString().split('T')[0])
        .order('prediction_date', { ascending: true });

    if (error) {
        console.error('Error fetching predictions:', error);
        return [];
    }

    return data || [];
}

export async function saveCashFlowPrediction(prediction: CashFlowPrediction): Promise<CashFlowPrediction> {
    const { data, error } = await supabase
        .from('cash_flow_predictions')
        .insert(prediction)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// SCENARIO SIMULATIONS
// ============================================

export interface ScenarioSimulation {
    id?: string;
    user_id: string;
    scenario_text: string;
    scenario_type: 'savings' | 'income_change' | 'loan' | 'investment' | 'expense_cut';
    input_parameters?: any;
    results?: any;
    sasha_comment?: string;
    created_at?: string;
}

export async function getUserScenarios(userId: string, limit = 10): Promise<ScenarioSimulation[]> {
    const { data, error } = await supabase
        .from('scenario_simulations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching scenarios:', error);
        return [];
    }

    return data || [];
}

export async function saveScenario(scenario: ScenarioSimulation): Promise<ScenarioSimulation> {
    const { data, error } = await supabase
        .from('scenario_simulations')
        .insert(scenario)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================================================
// PHASE 1: AI PERSONALITY UPGRADES
// ============================================================================

// ============================================
// EMOTIONAL STATE TRACKING
// ============================================

export type Emotion = 'happy' | 'stressed' | 'frustrated' | 'excited' | 'worried' | 'neutral';

export interface EmotionalState {
    id: string;
    user_id: string;
    emotion: Emotion;
    intensity: number; // 0.0 to 1.0
    context?: string;
    detected_at: string;
    created_at: string;
}

export async function saveEmotionalState(
    userId: string,
    emotion: Emotion,
    intensity: number,
    context?: string
): Promise<{ data: EmotionalState | null; error: any }> {
    return await supabase
        .from('user_emotional_state')
        .insert({
            user_id: userId,
            emotion,
            intensity,
            context,
        })
        .select()
        .single();
}

export async function getRecentEmotionalState(
    userId: string,
    limit: number = 5
): Promise<{ data: EmotionalState[] | null; error: any }> {
    return await supabase
        .from('user_emotional_state')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(limit);
}

export async function getLatestEmotion(
    userId: string
): Promise<{ data: EmotionalState | null; error: any }> {
    return await supabase
        .from('user_emotional_state')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(1)
        .single();
}

// ============================================
// CONVERSATION CONTEXT (SHORT-TERM MEMORY)
// ============================================

export type ContextType = 'topic' | 'decision' | 'preference' | 'question';

export interface ConversationContext {
    id: string;
    user_id: string;
    session_id: string;
    context_type: ContextType;
    key: string;
    value: string;
    expires_at: string;
    created_at: string;
}

export async function saveContext(
    userId: string,
    sessionId: string,
    contextType: ContextType,
    key: string,
    value: string,
    expiresInMinutes: number = 30
): Promise<{ data: ConversationContext | null; error: any }> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    return await supabase
        .from('conversation_context')
        .insert({
            user_id: userId,
            session_id: sessionId,
            context_type: contextType,
            key,
            value,
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
}

export async function getSessionContext(
    sessionId: string
): Promise<{ data: ConversationContext[] | null; error: any }> {
    return await supabase
        .from('conversation_context')
        .select('*')
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
}

export async function getUserContext(
    userId: string,
    limit: number = 20
): Promise<{ data: ConversationContext[] | null; error: any }> {
    return await supabase
        .from('conversation_context')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);
}

export async function clearExpiredContext(): Promise<{ error: any }> {
    return await supabase.rpc('cleanup_expired_context');
}

// ============================================
// NEGOTIATION HISTORY
// ============================================

export type NegotiationOutcome = 'accepted' | 'rejected' | 'pending';

export interface NegotiationHistory {
    id: string;
    user_id: string;
    topic: string;
    sasha_position: string;
    user_position: string;
    compromise?: string;
    outcome?: NegotiationOutcome;
    created_at: string;
}

export async function saveNegotiation(
    userId: string,
    topic: string,
    sashaPosition: string,
    userPosition: string,
    compromise?: string,
    outcome?: NegotiationOutcome
): Promise<{ data: NegotiationHistory | null; error: any }> {
    return await supabase
        .from('negotiation_history')
        .insert({
            user_id: userId,
            topic,
            sasha_position: sashaPosition,
            user_position: userPosition,
            compromise,
            outcome,
        })
        .select()
        .single();
}

export async function updateNegotiationOutcome(
    negotiationId: string,
    outcome: NegotiationOutcome,
    compromise?: string
): Promise<{ data: NegotiationHistory | null; error: any }> {
    return await supabase
        .from('negotiation_history')
        .update({ outcome, compromise })
        .eq('id', negotiationId)
        .select()
        .single();
}

export async function getRecentNegotiations(
    userId: string,
    limit: number = 10
): Promise<{ data: NegotiationHistory[] | null; error: any }> {
    return await supabase
        .from('negotiation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
}

export async function getPendingNegotiations(
    userId: string
): Promise<{ data: NegotiationHistory[] | null; error: any }> {
    return await supabase
        .from('negotiation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('outcome', 'pending')
        .order('created_at', { ascending: false });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a session ID based on user ID and current time
 * Sessions expire after 30 minutes of inactivity
 */
export function generateSessionId(userId: string): string {
    const now = new Date();
    const sessionWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
    const sessionTimestamp = Math.floor(now.getTime() / sessionWindow);
    return `${userId}-${sessionTimestamp}`;
}

/**
 * Detect emotion from user message (basic implementation)
 * This will be enhanced in the Edge Function with AI
 */
export function detectBasicEmotion(message: string): { emotion: Emotion; intensity: number } {
    const lowerMessage = message.toLowerCase();

    // Frustrated indicators
    if (lowerMessage.match(/\b(frustrated|annoyed|angry|mad|upset)\b/)) {
        return { emotion: 'frustrated', intensity: 0.7 };
    }

    // Stressed indicators
    if (lowerMessage.match(/\b(stressed|overwhelmed|worried|anxious|nervous)\b/)) {
        return { emotion: 'stressed', intensity: 0.6 };
    }

    // Happy indicators
    if (lowerMessage.match(/\b(happy|great|awesome|excellent|love|yay|yes!)\b/)) {
        return { emotion: 'happy', intensity: 0.7 };
    }

    // Excited indicators
    if (lowerMessage.match(/\b(excited|amazing|fantastic|wonderful)\b/)) {
        return { emotion: 'excited', intensity: 0.8 };
    }

    // Worried indicators
    if (lowerMessage.match(/\b(worried|concerned|afraid|scared)\b/)) {
        return { emotion: 'worried', intensity: 0.6 };
    }

    // Default to neutral
    return { emotion: 'neutral', intensity: 0.5 };
}

// ============================================
// EPISODIC MEMORY (PHASE 3)
// ============================================

export type EventType = 'transaction' | 'conversation' | 'goal' | 'decision' | 'milestone' | 'achievement' | 'pattern_detected';

export interface EpisodicEvent {
    id?: string;
    user_id: string;
    event_type: EventType;
    event_data: any;
    occurred_at: string;
    importance?: number;
    tags?: string[];
    summary: string;
    related_to?: string[];
    created_at?: string;
}

/**
 * Save an episodic event
 */
export async function saveEpisode(
    userId: string,
    eventType: EventType,
    eventData: any,
    summary: string,
    occurredAt: Date = new Date(),
    importance: number = 5,
    tags: string[] = []
): Promise<{ data: EpisodicEvent | null; error: any }> {
    return await supabase
        .from('episodic_events')
        .insert({
            user_id: userId,
            event_type: eventType,
            event_data: eventData,
            occurred_at: occurredAt.toISOString(),
            importance,
            tags,
            summary
        })
        .select()
        .single();
}

/**
 * Get recent episodes for a user
 */
export async function getRecentEpisodes(
    userId: string,
    limit: number = 20
): Promise<{ data: EpisodicEvent[] | null; error: any }> {
    return await supabase
        .from('episodic_events')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(limit);
}

/**
 * Get episodes by time range
 */
export async function getEpisodesByTimeRange(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<{ data: EpisodicEvent[] | null; error: any }> {
    return await supabase
        .from('episodic_events')
        .select('*')
        .eq('user_id', userId)
        .gte('occurred_at', startDate.toISOString())
        .lte('occurred_at', endDate.toISOString())
        .order('occurred_at', { ascending: false });
}

/**
 * Get episodes by event type
 */
export async function getEpisodesByType(
    userId: string,
    eventType: EventType,
    limit: number = 10
): Promise<{ data: EpisodicEvent[] | null; error: any }> {
    return await supabase
        .from('episodic_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', eventType)
        .order('occurred_at', { ascending: false })
        .limit(limit);
}

/**
 * Search episodes by text
 */
export async function searchEpisodes(
    userId: string,
    searchTerm: string
): Promise<{ data: EpisodicEvent[] | null; error: any }> {
    return await supabase
        .from('episodic_events')
        .select('*')
        .eq('user_id', userId)
        .or(`summary.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
        .order('importance', { ascending: false })
        .limit(10);
}

/**
 * Get most important episodes
 */
export async function getImportantEpisodes(
    userId: string,
    limit: number = 10
): Promise<{ data: EpisodicEvent[] | null; error: any }> {
    return await supabase
        .from('episodic_events')
        .select('*')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .order('occurred_at', { ascending: false })
        .limit(limit);
}

/**
 * Detect patterns from episodes
 */
export async function detectEpisodicPatterns(userId: string): Promise<string[]> {
    const patterns: string[] = [];
    
    // Get last 30 days of transaction events
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const { data: events } = await supabase
        .from('episodic_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'transaction')
        .gte('occurred_at', startDate.toISOString());
    
    if (!events || events.length === 0) return patterns;
    
    // Detect weekend spending
    const weekendEvents = events.filter(e => {
        const day = new Date(e.occurred_at).getDay();
        return day === 0 || day === 6;
    });
    
    if (weekendEvents.length > events.length * 0.4) {
        patterns.push('Weekend spending spike detected');
    }
    
    // Detect late-night spending
    const lateNightEvents = events.filter(e => {
        const hour = new Date(e.occurred_at).getHours();
        return hour >= 22 || hour <= 4;
    });
    
    if (lateNightEvents.length > events.length * 0.2) {
        patterns.push('Late-night spending pattern detected');
    }
    
    // Detect category clustering
    const categoryCount: { [key: string]: number } = {};
    events.forEach(e => {
        if (e.event_data.category) {
            categoryCount[e.event_data.category] = (categoryCount[e.event_data.category] || 0) + 1;
        }
    });
    
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > events.length * 0.3) {
        patterns.push(`Heavy spending on ${topCategory[0]}`);
    }
    
    return patterns;
}

/**
 * Cluster events by time windows
 */
export async function clusterEventsByTime(
    userId: string,
    timeWindowDays: number = 7
): Promise<Map<string, EpisodicEvent[]>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindowDays);
    
    const { data: events } = await getEpisodesByTimeRange(userId, startDate, new Date());
    
    // Group by event type
    const clusters = new Map<string, EpisodicEvent[]>();
    events?.forEach(event => {
        const key = event.event_type;
        if (!clusters.has(key)) {
            clusters.set(key, []);
        }
        clusters.get(key)!.push(event);
    });
    
    return clusters;
}
