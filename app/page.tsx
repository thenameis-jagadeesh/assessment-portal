'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock } from 'lucide-react';
import NextImage from 'next/image';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Password Reset State
    const [showResetModal, setShowResetModal] = useState(false);
    const [tempUser, setTempUser] = useState<any>(null);
    const [resetData, setResetData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(getApiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Check for first login
            if (data.is_first_login) {
                setTempUser(data.user);
                setShowResetModal(true);
                return;
            }

            // Store user session
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'candidate') {
                router.push('/candidate/dashboard');
            } else if (data.user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/examiner/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetData.newPassword !== resetData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/auth/reset-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: tempUser.id,
                    oldPassword: formData.password,
                    newPassword: resetData.newPassword
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to reset password');
            }

            // Update local user object with new status
            const updatedUser = { ...tempUser, is_first_login: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Redirect
            if (updatedUser.role === 'candidate') {
                router.push('/candidate/dashboard');
            } else {
                router.push('/examiner/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            {/* Background Pattern */}
            <div className="absolute inset-0 pattern-grid opacity-5 pointer-events-none" />

            <div className="relative z-10 w-full max-w-[440px]">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <NextImage
                        src="/logo.png"
                        alt="GuhaTek Logo"
                        width={160}
                        height={64}
                        className="h-16 w-auto mx-auto mb-4 object-contain dark:brightness-0 dark:invert"
                        priority
                    />
                    <h1 className="text-2xl font-bold text-[#1e293b] dark:text-white mb-1 tracking-tight">
                        VinavalAI
                    </h1>
                    <p className="text-[#64748b] dark:text-gray-400 text-sm">
                        Assessment Portal
                    </p>
                    <p className="text-[#64748b] dark:text-gray-400 text-sm mt-1">
                        Sign in to continue
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-gray-900 rounded-[24px] shadow-xl shadow-blue-100/50 dark:shadow-none p-8 dark:border dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-[#334155] dark:text-gray-300 mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]">
                                    <Mail size={22} />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-14 pr-4 py-3.5 bg-[#eef2ff] dark:bg-gray-800 border-none rounded-2xl text-[#1e293b] dark:text-white placeholder:text-[#94a3b8] focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-base"
                                    placeholder="gokul@gmail.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#334155] dark:text-gray-300 mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]">
                                    <Lock size={22} />
                                </div>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-14 pr-4 py-3.5 bg-[#eef2ff] dark:bg-gray-800 border-none rounded-2xl text-[#1e293b] dark:text-white placeholder:text-[#94a3b8] focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-base"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 mt-1"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-[#64748b] dark:text-gray-500 text-sm mt-10 leading-relaxed max-w-[300px] mx-auto">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
            {
                showResetModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                        <div className="card-premium p-8 max-w-md w-full animate-scale-in">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
                            <p className="text-gray-600 mb-6">
                                This is your first login. Please set a new secure password to continue.
                            </p>

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            value={resetData.newPassword}
                                            onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                            placeholder="New secure password"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            value={resetData.confirmPassword}
                                            onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                            placeholder="Confirm new password"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 btn-gradient rounded-xl font-bold text-lg shadow-lg"
                                >
                                    {loading ? 'Updating...' : 'Set Password & Login'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
