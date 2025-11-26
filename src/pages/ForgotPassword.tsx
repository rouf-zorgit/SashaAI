import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
                    <p className="mt-2 text-gray-600">Enter your email to receive a reset link</p>
                </div>

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-green-800">
                            <p className="font-medium">Check your email</p>
                            <p className="text-sm mt-1">
                                If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                            </p>
                            <p className="text-xs mt-3 text-green-700">
                                Didn't receive it? Check your spam folder or{' '}
                                <Link to="/signup" className="underline font-semibold hover:text-green-900">
                                    create a new account
                                </Link>.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Sign In
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
