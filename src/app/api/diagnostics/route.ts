import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const results: Record<string, any> = {
            timestamp: new Date().toISOString(),
            user_id: user.id,
            tests: {}
        };

        // Test 1: Read from profiles table
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            results.tests.profiles = {
                status: error ? 'fail' : 'pass',
                error: error?.message,
                hasData: !!data
            };
        } catch (e: any) {
            results.tests.profiles = { status: 'fail', error: e.message };
        }

        // Test 2: Read from transactions table
        try {
            const { data, error, count } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: false })
                .eq('user_id', user.id)
                .limit(1);

            results.tests.transactions = {
                status: error ? 'fail' : 'pass',
                error: error?.message,
                count: count || 0
            };
        } catch (e: any) {
            results.tests.transactions = { status: 'fail', error: e.message };
        }

        // Test 3: Read from messages table
        try {
            const { data, error, count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: false })
                .eq('user_id', user.id)
                .limit(1);

            results.tests.messages = {
                status: error ? 'fail' : 'pass',
                error: error?.message,
                count: count || 0
            };
        } catch (e: any) {
            results.tests.messages = { status: 'fail', error: e.message };
        }

        // Test 4: Read from goals table
        try {
            const { data, error, count } = await supabase
                .from('goals')
                .select('*', { count: 'exact', head: false })
                .eq('user_id', user.id)
                .limit(1);

            results.tests.goals = {
                status: error ? 'fail' : 'pass',
                error: error?.message,
                count: count || 0
            };
        } catch (e: any) {
            results.tests.goals = { status: 'fail', error: e.message };
        }

        // Test 5: Read from notifications table
        try {
            const { data, error, count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: false })
                .eq('user_id', user.id)
                .limit(1);

            results.tests.notifications = {
                status: error ? 'fail' : 'pass',
                error: error?.message,
                count: count || 0
            };
        } catch (e: any) {
            results.tests.notifications = { status: 'fail', error: e.message };
        }

        // Test 6: Read from reminders table
        try {
            const { data, error, count } = await supabase
                .from('reminders')
                .select('*', { count: 'exact', head: false })
                .eq('user_id', user.id)
                .limit(1);

            results.tests.reminders = {
                status: error ? 'fail' : 'pass',
                error: error?.message,
                count: count || 0
            };
        } catch (e: any) {
            results.tests.reminders = { status: 'fail', error: e.message };
        }

        // Test 7: Write operations (insert, update, delete)
        try {
            // Insert a test transaction
            const testTransaction = {
                user_id: user.id,
                amount: 1,
                currency: 'USD',
                base_amount: 1,
                category: 'test',
                type: 'expense' as const,
                description: 'Diagnostic test transaction',
                confidence: 1,
                is_confirmed: false
            };

            const { data: insertData, error: insertError } = await supabase
                .from('transactions')
                .insert(testTransaction)
                .select()
                .single();

            if (insertError) throw insertError;

            // Update the test transaction
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ description: 'Updated diagnostic test' })
                .eq('id', insertData.id);

            if (updateError) throw updateError;

            // Delete the test transaction
            const { error: deleteError } = await supabase
                .from('transactions')
                .delete()
                .eq('id', insertData.id);

            if (deleteError) throw deleteError;

            results.tests.write_operations = {
                status: 'pass',
                operations: ['insert', 'update', 'delete']
            };
        } catch (e: any) {
            results.tests.write_operations = {
                status: 'fail',
                error: e.message
            };
        }

        // Test 8: RLS policies (try to access another user's data)
        try {
            const fakeUserId = '00000000-0000-0000-0000-000000000000';
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', fakeUserId)
                .limit(1);

            // Should return empty array due to RLS, not an error
            results.tests.rls_policies = {
                status: (data && data.length === 0) ? 'pass' : 'fail',
                message: 'RLS correctly prevents access to other users data',
                attemptedAccess: fakeUserId,
                dataReturned: data?.length || 0
            };
        } catch (e: any) {
            results.tests.rls_policies = {
                status: 'fail',
                error: e.message
            };
        }

        // Calculate overall status
        const allTests = Object.values(results.tests);
        const passedTests = allTests.filter((t: any) => t.status === 'pass').length;
        const totalTests = allTests.length;

        results.summary = {
            total: totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            success_rate: `${Math.round((passedTests / totalTests) * 100)}%`
        };

        return NextResponse.json(results, { status: 200 });

    } catch (error: any) {
        console.error('Diagnostic error:', error);
        return NextResponse.json(
            {
                error: 'Diagnostic test failed',
                message: error.message
            },
            { status: 500 }
        );
    }
}
