import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Extract and validate the authenticated user ID from the JWT token in the request.
 * 
 * @param req - The incoming request with Authorization header
 * @returns The authenticated user's ID, or null if not authenticated
 * 
 * @example
 * const userId = await getAuthenticatedUserId(req)
 * if (!userId) {
 *   return new Response(
 *     JSON.stringify({ error: 'Unauthorized' }), 
 *     { status: 401, headers: corsHeaders }
 *   )
 * }
 */
export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return null

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}
