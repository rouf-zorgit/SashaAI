// ============================================================================
// UTILITY FUNCTIONS FOR PROCESSCHAT
// ============================================================================

import type { EmotionDetection } from './types.ts';

// Environment check
const isDev = Deno.env.get('ENVIRONMENT') === 'development';

/**
 * Conditional logging - only logs in development
 */
export function log(message: string, ...args: any[]): void {
    if (isDev) {
        console.log(message, ...args);
    }
}

/**
 * Error logging - always logs
 */
export function logError(message: string, error: Error | unknown): void {
    console.error(message, error);
}

/**
 * Detect emotion from message text
 */
export function detectEmotion(message: string): EmotionDetection {
    const emotionIndicators = {
        frustrated: /\b(frustrated|annoyed|angry|mad|upset|hate|terrible|awful)\b/i,
        stressed: /\b(stressed|overwhelmed|worried|anxious|nervous|panic|pressure)\b/i,
        happy: /\b(happy|great|awesome|excellent|love|yay|yes!|amazing|good|bonus|promotion|raise)\b/i,
        excited: /\b(excited|fantastic|wonderful|thrilled|pumped|rich|wealthy)\b/i,
        worried: /\b(worried|concerned|afraid|scared|fear)\b/i
    };

    for (const [emotion, pattern] of Object.entries(emotionIndicators)) {
        if (pattern.test(message)) {
            return { emotion, intensity: 0.7 };
        }
    }

    return { emotion: 'neutral', intensity: 0.5 };
}

/**
 * Check if message is spam
 */
export function isSpam(message: string): boolean {
    const spamPatterns = [
        /^(.)\1{10,}$/,
        /test{5,}/i,
        /spam/i,
        /^[0-9]{20,}$/
    ];

    return spamPatterns.some(pattern => pattern.test(message));
}

/**
 * Determine familiarity level based on interaction count
 */
export function getFamiliarityLevel(interactionCount: number): string {
    if (interactionCount === 0) return 'stranger';
    if (interactionCount < 5) return 'new';
    if (interactionCount < 20) return 'familiar';
    return 'close';
}

/**
 * Build memory context string from various sources
 */
export function buildMemoryContext(
    profile: any,
    preferences: any,
    memories: any[],
    patterns: any[],
    _recurringPayments: any[]
): string {
    let context = '';

    if (profile?.full_name) {
        context += `User's name: ${profile.full_name}\n`;
    }

    if (profile?.monthly_salary || profile?.income_monthly) {
        const salary = profile.monthly_salary || profile.income_monthly;
        context += `Monthly income: ${salary} BDT\n`;
    }

    if (memories && memories.length > 0) {
        context += `\nKnown facts:\n`;
        memories.slice(0, 5).forEach(m => {
            if (m.data) {
                context += `- ${JSON.stringify(m.data)}\n`;
            }
        });
    }

    if (recurringPayments && recurringPayments.length > 0) {
        context += `\nRecurring bills:\n`;
        recurringPayments.forEach(p => {
            context += `- ${p.merchant_name}: ${p.amount} BDT (${p.frequency})\n`;
        });
    }

    if (patterns && patterns.length > 0) {
        context += `\nSpending patterns:\n`;
        patterns.forEach(p => {
            context += `- ${p.pattern_type}: ${p.trigger_category || 'general'}\n`;
        });
    }

    return context;
}

/**
 * Generate proactive nudge based on patterns and date
 */
export function generateProactiveNudge(
    patterns: any[],
    _recurringPayments: any[]
): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    // Weekend spending check
    if (dayOfWeek === 5 || dayOfWeek === 6) {
        const weekendPattern = patterns.find(p => p.pattern_type === 'weekend_spike');
        if (weekendPattern) {
            return "It's the weekend. Watch out for impulse spending!";
        }
    }

    // Payday check (assuming 1st and 15th)
    if (dayOfMonth === 1 || dayOfMonth === 15) {
        return "Payday! Remember to save before you spend.";
    }

    // Bill reminder
    if (dayOfMonth < 5) {
        return "New month. Remind user to pay rent/bills first.";
    }

    return '';
}
