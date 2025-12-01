// ============================================================================
// MEMORY EXTRACTOR - System 8a
// ============================================================================
// Automatically extracts entities and facts from user messages
// Categorizes and saves to appropriate memory type (LTM, STM, Episodic)
// ============================================================================

import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface ExtractedEntity {
    type: 'salary' | 'fixed_cost' | 'preference' | 'goal' | 'name' | 'behavior' | 'other'
    value: any
    confidence: number
    source: string
}

export interface MemoryCategory {
    memoryType: 'ltm' | 'stm' | 'episodic'
    table: string
    data: any
}

/**
 * Extract entities from a message using pattern matching and AI
 */
export async function extractEntities(
    message: string,
    anthropicKey: string
): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = []

    // Pattern-based extraction (fast, reliable)

    // Extract salary
    const salaryPatterns = [
        /(?:my salary is|i earn|i make|income is)\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:bdt|taka|tk)?/i,
        /(?:salary|income):\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    ]

    for (const pattern of salaryPatterns) {
        const match = message.match(pattern)
        if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''))
            entities.push({
                type: 'salary',
                value: amount,
                confidence: 0.95,
                source: 'pattern_match'
            })
            break
        }
    }

    // Extract name
    const namePatterns = [
        /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /^([A-Z][a-z]+)$/
    ]

    for (const pattern of namePatterns) {
        const match = message.match(pattern)
        if (match && match[1].length > 1 && match[1].length < 50) {
            entities.push({
                type: 'name',
                value: match[1],
                confidence: 0.9,
                source: 'pattern_match'
            })
            break
        }
    }

    // Extract fixed costs (rent, bills, etc.)
    const fixedCostPatterns = [
        /(?:my rent is|rent:|pay\s+(?:for\s+)?rent)\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:electricity|internet|water|gas)\s+(?:bill|cost)?\s*(?:is)?\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    ]

    for (const pattern of fixedCostPatterns) {
        const match = message.match(pattern)
        if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''))
            const costType = message.toLowerCase().includes('rent') ? 'rent' :
                message.toLowerCase().includes('electricity') ? 'electricity' :
                    message.toLowerCase().includes('internet') ? 'internet' :
                        message.toLowerCase().includes('water') ? 'water' :
                            message.toLowerCase().includes('gas') ? 'gas' : 'other'

            entities.push({
                type: 'fixed_cost',
                value: { type: costType, amount },
                confidence: 0.9,
                source: 'pattern_match'
            })
        }
    }

    // Extract preferences
    const preferencePatterns = [
        /i (?:prefer|like|want|need)\s+(.+)/i,
        /(?:please|can you)\s+(?:be|use)\s+(.+)/i
    ]

    for (const pattern of preferencePatterns) {
        const match = message.match(pattern)
        if (match) {
            entities.push({
                type: 'preference',
                value: match[1].trim(),
                confidence: 0.7,
                source: 'pattern_match'
            })
            break
        }
    }

    // Extract goals
    const goalPatterns = [
        /i want to\s+(.+)/i,
        /my goal is to\s+(.+)/i,
        /i'm (?:planning to|trying to|hoping to)\s+(.+)/i
    ]

    for (const pattern of goalPatterns) {
        const match = message.match(pattern)
        if (match) {
            entities.push({
                type: 'goal',
                value: match[1].trim(),
                confidence: 0.85,
                source: 'pattern_match'
            })
            break
        }
    }

    // AI-based extraction for complex entities (if patterns didn't catch anything important)
    if (entities.length === 0 && anthropicKey) {
        try {
            const aiEntities = await extractWithAI(message, anthropicKey)
            entities.push(...aiEntities)
        } catch (error) {
            console.error('AI extraction failed:', error)
        }
    }

    return entities
}

/**
 * Use AI to extract entities when pattern matching fails
 */
async function extractWithAI(
    message: string,
    anthropicKey: string
): Promise<ExtractedEntity[]> {
    const prompt = `Extract structured information from this message. Return JSON array of entities.

Message: "${message}"

Extract:
- salary (monthly income)
- name (person's name)
- fixed_cost (rent, bills, subscriptions)
- preference (communication style, financial goals)
- goal (what they want to achieve)

Return format:
[
  {"type": "salary", "value": 50000, "confidence": 0.9},
  {"type": "name", "value": "John", "confidence": 0.95}
]

If nothing found, return []`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            system: 'You are a precise entity extraction system. Return only valid JSON.',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.1
        })
    })

    const data = await response.json()
    const result = JSON.parse(data.content[0].text)

    return (result.entities || result || []).map((e: any) => ({
        ...e,
        source: 'ai_extraction'
    }))
}

/**
 * Categorize extracted entity into appropriate memory type
 */
export function categorizeMemory(entity: ExtractedEntity): MemoryCategory | null {
    switch (entity.type) {
        case 'salary':
            return {
                memoryType: 'ltm',
                table: 'profiles',
                data: { income_monthly: entity.value }
            }

        case 'name':
            return {
                memoryType: 'ltm',
                table: 'profiles',
                data: { name: entity.value }
            }

        case 'fixed_cost':
            return {
                memoryType: 'ltm',
                table: 'profiles',
                data: {
                    fixed_costs: entity.value // Will be merged with existing
                }
            }

        case 'preference':
            return {
                memoryType: 'ltm',
                table: 'user_preferences',
                data: {
                    // Parse preference type from value
                    communication_style: entity.value.toLowerCase().includes('strict') ? 'Direct' :
                        entity.value.toLowerCase().includes('friendly') ? 'Friendly' :
                            entity.value.toLowerCase().includes('casual') ? 'Casual' : null
                }
            }

        case 'goal':
            return {
                memoryType: 'ltm',
                table: 'memory_events',
                data: {
                    kind: 'goal',
                    data: { goal: entity.value },
                    salience: 5
                }
            }

        case 'behavior':
            return {
                memoryType: 'episodic',
                table: 'episodic_events',
                data: {
                    event_type: 'pattern_detected',
                    event_data: { behavior: entity.value },
                    importance: 6
                }
            }

        default:
            return null
    }
}

/**
 * Automatically save extracted entity to appropriate database table
 */
export async function autoSaveMemory(
    entity: ExtractedEntity,
    userId: string,
    supabaseClient: any
): Promise<boolean> {
    const category = categorizeMemory(entity)
    if (!category) return false

    try {
        if (category.table === 'profiles') {
            // Update profile
            if (entity.type === 'fixed_cost') {
                // Merge with existing fixed_costs
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('fixed_costs')
                    .eq('id', userId)
                    .single()

                const existingCosts = profile?.fixed_costs || {}
                const newCosts = {
                    ...existingCosts,
                    [entity.value.type]: entity.value.amount
                }

                await supabaseClient
                    .from('profiles')
                    .update({ fixed_costs: newCosts })
                    .eq('id', userId)
            } else {
                await supabaseClient
                    .from('profiles')
                    .update(category.data)
                    .eq('id', userId)
            }
        } else if (category.table === 'user_preferences') {
            // Upsert preferences
            await supabaseClient
                .from('user_preferences')
                .upsert({
                    user_id: userId,
                    ...category.data
                })
        } else if (category.table === 'memory_events') {
            // Insert memory event
            await supabaseClient
                .from('memory_events')
                .insert({
                    user_id: userId,
                    ...category.data
                })
        } else if (category.table === 'episodic_events') {
            // Insert episodic event
            await supabaseClient
                .from('episodic_events')
                .insert({
                    user_id: userId,
                    occurred_at: new Date().toISOString(),
                    summary: `Detected: ${entity.value}`,
                    tags: [entity.type],
                    ...category.data
                })
        }

        console.log(`✅ Saved ${entity.type} to ${category.table}:`, entity.value)
        return true
    } catch (error) {
        console.error(`❌ Failed to save ${entity.type}:`, error)
        return false
    }
}

/**
 * Main extraction function - extract and save all entities from a message
 */
export async function extractFromMessage(
    message: string,
    userId: string,
    anthropicKey: string,
    supabaseClient: any
): Promise<ExtractedEntity[]> {
    // Extract entities
    const entities = await extractEntities(message, anthropicKey)

    if (entities.length === 0) {
        return []
    }

    console.log(`📝 Extracted ${entities.length} entities:`, entities)

    // Auto-save each entity
    for (const entity of entities) {
        if (entity.confidence >= 0.7) {
            await autoSaveMemory(entity, userId, supabaseClient)
        }
    }

    return entities
}
