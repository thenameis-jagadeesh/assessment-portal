'use client';

import { useEffect, useState } from 'react';
import { Assessment, User } from '@/types';
import { BarChart3, Users, Clock, Home, Activity, Plus, BookOpen, Calendar, ChevronRight, LogOut, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminDashboard() {
    const router = useRouter();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin') {
            router.push('/');
            return;
        }
        setCurrentUser(parsedUser);

        const fetchAssessments = async () => {
            try {
                const res = await fetch(getApiUrl('/admin/assessments')); // Fetch all assessments
                if (!res.ok) throw new Error('Failed to load');
                const data = await res.json();
                setAssessments(data.assessments || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessments();
    }, [router]);

    const handleDeleteAssessment = async (e: React.MouseEvent, assessmentId: string, assessmentTitle: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete the assessment "${assessmentTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(getApiUrl(`/assessments/${assessmentId}/delete`), {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete assessment');
            }

            // Refresh the list
            const updatedRes = await fetch(getApiUrl('/admin/assessments'));
            if (updatedRes.ok) {
                const data = await updatedRes.json();
                setAssessments(data.assessments || []);
            }

            alert('Assessment deleted successfully');
        } catch (error: any) {
            console.error('Delete Error:', error);
            alert(`Error deleting assessment: ${error.message || 'Unknown error occurred'}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <NextImage
                                    src="/logo.png"
                                    alt="GuhaTek Logo"
                                    width={120}
                                    height={40}
                                    className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
                                    priority
                                />
                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">VinavalAI</h1>
                                        <span className="text-gray-400 dark:text-gray-600">•</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Assessment Portal</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back, {currentUser?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/examiner/create"
                                    className="px-4 py-2 btn-gradient text-sm font-semibold rounded-lg shadow-md flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Create Assessment
                                </Link>
                                <Link
                                    href="/admin/users"
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400 text-sm font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Users size={18} />
                                    Manage Users
                                </Link>
                                <div className="flex items-center gap-4">
                                    <ThemeToggle />
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Assessments</h2>
                            <p className="text-gray-600 dark:text-gray-400">Overview of all tests in the system</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Total:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{assessments.length}</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Loading assessments...</p>
                        </div>
                    ) : assessments.length === 0 ? (
                        <div className="card-premium p-20 text-center">
                            <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <BookOpen size={40} className="text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Assessments Yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">Start by creating your first assessment using AI or by uploading a document.</p>
                            <Link href="/examiner/create" className="inline-flex px-8 py-3 btn-gradient font-bold rounded-xl shadow-lg">
                                <Plus size={20} className="mr-2" />
                                Create First Assessment
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {assessments.map((assessment) => (
                                <Link
                                    key={assessment.assessment_id}
                                    href={`/examiner/assessment/${assessment.assessment_id}`}
                                    className="group"
                                >
                                    <div className="card-premium p-6 hover:border-purple-300 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30 transition-colors">
                                                <BookOpen className="text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                                                    {assessment.title}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {formatDate(assessment.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={14} />
                                                        {assessment.assigned_to?.length || 0} Candidates
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {assessment.duration_minutes || 30}m
                                                    </span>
                                                    {assessment.difficulty && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${assessment.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                                                            assessment.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-green-100 text-green-600'
                                                            }`}>
                                                            {assessment.difficulty}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right mr-4 hidden md:block">
                                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</div>
                                                <div className="text-green-600 dark:text-green-400 font-bold">Active</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDeleteAssessment(e, assessment.assessment_id, assessment.title)}
                                                    className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                    title="Delete Assessment"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
