import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OCRRequest {
    userId: string
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
        const { userId, imageBase64 }: OCRRequest = await req.json()

        if (!userId || !imageBase64) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get OpenAI API key
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiKey) {
            console.error('CRITICAL: OpenAI API key not found')
            throw new Error('OpenAI API key not configured')
        }

        console.log('Processing receipt image...')

        // Call OpenAI Vision API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
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
}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500,
                temperature: 0.3,
            }),
        })

        console.log('OpenAI Vision response status:', openaiResponse.status)

        if (!openaiResponse.ok) {
            const error = await openaiResponse.text()
            console.error('OpenAI Vision API error:', error)
            throw new Error('Failed to process receipt image')
        }

        const openaiData = await openaiResponse.json()
        const content = openaiData.choices[0].message.content

        // Parse the JSON response
        let parsedData
        try {
            parsedData = JSON.parse(content)
        } catch (e) {
            console.error('Failed to parse OpenAI response:', content)
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
