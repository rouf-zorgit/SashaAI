import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
    const { signInWithEmail } = useAuthStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEmail(val);
        if (val && !validateEmail(val)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError(null);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Set persistence based on "Remember Me"
            // @ts-expect-error - setPersistence exists in v2 but types might be missing in this version
            await supabase.auth.setPersistence(rememberMe ? 'local' : 'session');

            await signInWithEmail(email, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
                    <p className="mt-2 text-gray-600">Sign in to continue to FinAI</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-6">
                    <div className="space-y-4">
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
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Email address"
                                    value={email}
                                    onChange={handleEmailChange}
                                />
                            </div>
                            {emailError && (
                                <p className="mt-1 text-xs text-red-600">{emailError}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                        Remember me
                                    </label>
                                </div>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Forgot password?
                                </Link>
                            </div>
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
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-gray-600">Don't have an account? </span>
                    <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign up
                    </Link>
                </div>
            </div>

            {/* Legal Footer */}
            <div className="mt-8 text-center text-xs text-gray-500">
                <p>
                    By signing in, you agree to our{' '}
                    <a href="#" className="underline hover:text-gray-700">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
