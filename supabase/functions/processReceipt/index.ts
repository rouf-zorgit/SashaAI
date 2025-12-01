import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getAuthenticatedUserId } from '../_shared/auth.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OCRRequest {
    userId: string  // ⚠️ IGNORED - we validate from JWT instead
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

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('=== OCR Function Called ===')

        // ✅ SECURITY FIX: Validate user from JWT token, not request body
        const authenticatedUserId = await getAuthenticatedUserId(req)
        if (!authenticatedUserId) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized - Invalid or missing authentication token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { imageBase64 }: OCRRequest = await req.json()
        // ⚠️ NOTE: userId from request body is IGNORED - we use authenticatedUserId from JWT

        if (!imageBase64) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required field: imageBase64' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }


        // Get Claude API key
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
        if (!anthropicKey) {
            console.error('CRITICAL: Anthropic API key not found')
            throw new Error('Anthropic API key not configured')
        }

        console.log('Processing receipt image...')

        // Call Claude Vision API
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
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
            }),
        })

        console.log('Claude Vision response status:', claudeResponse.status)

        if (!claudeResponse.ok) {
            const error = await claudeResponse.text()
            console.error('Claude Vision API error:', error)
            throw new Error('Failed to process receipt image')
        }

        const claudeData = await claudeResponse.json()
        const content = claudeData.content[0].text

        // Parse the JSON response
        let parsedData
        try {
            parsedData = JSON.parse(content)
        } catch {
            console.error('Failed to parse Claude response:', content)
            throw new Error('Invalid response from AI')
        }

        if (parsedData.error) {
            return new Response(
                JSON.stringify({ success: false, error: parsedData.error }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
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

        console.log('OCR successful:', response.transaction)

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('OCR Function error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to process receipt. Please try again.'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
