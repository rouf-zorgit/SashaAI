import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { initSentry, captureException } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry()

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Test Sentry error capture
        setTimeout(() => {
            try {
                // @ts-expect-error - intentional error for testing
                foo()
            } catch (e) {
                captureException(e as Error, {
                    test: 'Sentry verification test',
                    timestamp: new Date().toISOString()
                })
                console.log('✅ Test error captured and sent to Sentry')
            }
        }, 100)

        return new Response(
            JSON.stringify({
                message: 'Sentry test function executed successfully',
                note: 'Check your Sentry dashboard for the test error in a few seconds',
                timestamp: new Date().toISOString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        captureException(error as Error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})

// Supabase Edge Function config to skip auth
// @ts-expect-error - Deno.serve.config is valid but not in types
Deno.serve.config = {
    verify_jwt: false
}
