// Session management utilities for chat

/**
 * Generate a unique session ID for chat conversations
 * Format: session_<timestamp>_<random>
 */
export function generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
}

/**
 * Validate if a string is a valid session ID
 */
export function isValidSessionId(sessionId: string): boolean {
    return /^session_\d+_[a-z0-9]+$/.test(sessionId);
}

/**
 * Extract timestamp from session ID
 */
export function getSessionTimestamp(sessionId: string): number | null {
    const match = sessionId.match(/^session_(\d+)_/);
    return match ? parseInt(match[1], 10) : null;
}
