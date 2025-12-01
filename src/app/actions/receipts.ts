'use server'

import { createClient } from '@/lib/supabase/server'
import { Anthropic } from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { invalidateUserCache } from '@/lib/cache/server-cache'

export async function extractReceiptData(base64Image: string, mediaType: string = 'image/jpeg') {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            return { success: false, error: 'Server configuration error: Missing API key' }
        }

        const anthropic = new Anthropic({
            apiKey: apiKey,
        })

        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType as any,
                                data: base64Image,
                            },
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

IMPORTANT: Return ONLY the JSON object, no additional text or explanation.`,
                        },
                    ],
                },
            ],
        })

        const content = message.content[0].type === 'text' ? message.content[0].text : ''
        if (!content) throw new Error('No content from Claude')

        try {
            const parsed = JSON.parse(content)
            if (parsed.error) {
                return { success: false, error: parsed.error }
            }
            return { success: true, data: parsed }
        } catch (e) {
            console.error('Failed to parse Claude response', content)
            return { success: false, error: 'Failed to parse receipt data' }
        }
    } catch (error: any) {
        console.error('Extract receipt error:', error)
        return { success: false, error: error.message || 'Failed to analyze receipt' }
    }
}

export async function checkRateLimit() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { allowed: false, remaining: 0, error: 'Unauthorized' }

    // Get uploads from last 24 hours
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const { data, error } = await supabase
        .from('receipt_uploads')
        .select('id')
        .eq('user_id', user.id)
        .gte('uploaded_at', yesterday.toISOString())

    if (error) {
        console.error('Rate limit check error:', error)
        return { allowed: true, remaining: 20 } // Fail open
    }

    const count = data?.length || 0
    const remaining = Math.max(0, 20 - count)

    return {
        allowed: count < 20,
        remaining,
        count
    }
}

async function trackUpload(receiptUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('receipt_uploads')
        .insert({
            user_id: user.id,
            receipt_url: receiptUrl,
            uploaded_at: new Date().toISOString()
        })
}

export async function uploadReceipt(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'No file provided' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    // Sanitize filename to avoid issues
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const filename = `${user.id}/${timestamp}_${random}_${cleanName}`

    const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filename, file, {
            upsert: false,
            contentType: file.type,
        })

    if (error) {
        console.error('Upload error:', error)
        return { success: false, error: 'Upload failed' }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filename)

    // Track upload for rate limiting
    await trackUpload(publicUrl)

    return { success: true, url: publicUrl, path: filename }
}

export async function replaceReceipt(oldReceiptUrl: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // Upload new receipt
    const uploadResult = await uploadReceipt(formData)
    if (!uploadResult.success) {
        return uploadResult
    }

    // Delete old receipt
    await deleteReceipt(oldReceiptUrl)

    return uploadResult
}

export async function deleteReceipt(pathOrUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // Extract path if full URL is given
    let path = pathOrUrl
    if (pathOrUrl.startsWith('http')) {
        const url = new URL(pathOrUrl)
        // Assuming standard Supabase storage URL format: .../storage/v1/object/public/receipts/path/to/file
        // The publicUrl usually looks like: https://project.supabase.co/storage/v1/object/public/receipts/userId/file.jpg
        const parts = url.pathname.split('/receipts/')
        if (parts.length > 1) {
            path = parts[1]
        }
    }

    const { error } = await supabase.storage
        .from('receipts')
        .remove([path])

    if (error) {
        console.error('Delete error:', error)
        return { success: false, error: 'Delete failed' }
    }

    // Update any transaction that references this receipt
    const { error: dbError } = await supabase
        .from('transactions')
        .update({ receipt_url: null })
        .eq('receipt_url', pathOrUrl)

    if (dbError) {
        console.error('DB update error:', dbError)
    }

    revalidatePath('/profile/receipts')
    revalidatePath('/history')
    invalidateUserCache(user.id)

    return { success: true }
}
