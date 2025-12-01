import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

interface OCRRequest {
    imageBase64: string
}

interface OCRResponse {
    success: boolean
    transaction?: {
        amount: number
        currency: string
        merchant: string
        category: string
        date: string
        items?: string[]
    }
    error?: string
}

export async function POST(req: NextRequest) {
    try {
        logger.info('=== OCR Function Called ===')

        // ✅ SECURITY: Validate user from JWT token
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Invalid or missing authentication token' },
                { status: 401 }
            )
        }

        const { imageBase64 } = await req.json() as OCRRequest

        if (!imageBase64) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: imageBase64' },
                { status: 400 }
            )
        }

        // Get Claude API key
        const anthropicKey = process.env.ANTHROPIC_API_KEY
        if (!anthropicKey) {
            logger.error('CRITICAL: Anthropic API key not found')
            throw new Error('Anthropic API key not configured')
        }

        logger.info('Processing receipt image...')

        // Call Claude Vision API
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const claudeResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: imageBase64
                            }
                        },
                        {
                            type: 'text',
                            text: `Analyze this receipt image and extract transaction information. Return ONLY valid JSON with this structure:
{
  "amount": number (total amount),
  "currency": "BDT" or detected currency code,
  "merchant": "store/restaurant name",
  "category": "Groceries" | "Dining" | "Transport" | "Shopping" | "Entertainment" | "Healthcare" | "Utilities" | "Other",
  "date": "YYYY-MM-DD" (receipt date, or today if not visible),
  "items": ["item1", "item2"] (optional, main items purchased)
}

If you cannot read the receipt clearly, return:
{
  "error": "Could not read receipt clearly. Please try a clearer image."
}

IMPORTANT: Return ONLY the JSON object, no additional text or explanation.`
                        }
                    ]
                }
            ],
            temperature: 0.3
        })

        logger.info('Claude Vision response received')

        const content = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '{}'

        // Parse the JSON response
        let parsedData
        try {
            parsedData = JSON.parse(content)
        } catch {
            logger.error('Failed to parse Claude response:', content)
            throw new Error('Invalid response from AI')
        }

        if (parsedData.error) {
            return NextResponse.json({ success: false, error: parsedData.error })
        }

        // Validate and return transaction data
        const response: OCRResponse = {
            success: true,
            transaction: {
                amount: parseFloat(parsedData.amount) || 0,
                currency: parsedData.currency || 'BDT',
                merchant: parsedData.merchant || 'Unknown',
                category: parsedData.category || 'Other',
                date: parsedData.date || new Date().toISOString().split('T')[0],
                items: parsedData.items || []
            }
        }

        logger.info('OCR successful:', response.transaction)

        return NextResponse.json(response)

    } catch (error: any) {
        logger.error('OCR Function error:', error)

        return NextResponse.json({
            success: false,
            error: 'Failed to process receipt. Please try again.'
        }, { status: 200 })
    }
}
