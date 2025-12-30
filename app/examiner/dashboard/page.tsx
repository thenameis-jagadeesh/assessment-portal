'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, TrendingUp, LogOut, Plus, Calendar, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AssessmentItem {
    id: string;
    title: string;
    description?: string;
    created_at: string;
    assigned_to: string[];
    questions_count: number;
}

export default function ExaminerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
    const [visibleAssessments, setVisibleAssessments] = useState<AssessmentItem[]>([]);
    const [showAllAssessments, setShowAllAssessments] = useState(false);
    const [stats, setStats] = useState({
        totalAssessments: 0,
        totalCandidates: 0,
        avgScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'examiner') {
            router.push('/');
            return;
        }

        setUser(parsedUser);
        fetchDashboardData(parsedUser.id);
    }, [router]);

    const fetchDashboardData = async (userId: string) => {
        try {
            const assessmentsRes = await fetch(getApiUrl(`/examiner/assessments?examinerId=${userId}`));
            if (assessmentsRes.ok) {
                const data = await assessmentsRes.json();
                setAssessments(data.assessments || []);
                setStats({
                    totalAssessments: data.assessments?.length || 0,
                    totalCandidates: data.totalCandidates || 0,
                    avgScore: data.avgScore || 0
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initially show only first 4 assessments
        setVisibleAssessments(showAllAssessments ? assessments : assessments.slice(0, 4));
    }, [assessments, showAllAssessments]);

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

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <img
                                    src="/logo.png"
                                    alt="GuhaTek Logo"
                                    className="h-14 w-auto object-contain dark:brightness-0 dark:invert"
                                />
                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">VinavalAI</h1>
                                        <span className="text-gray-400 dark:text-gray-600">•</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Assessment Portal</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{user.name} • {user.email}</p>
                                </div>
                            </div>
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

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Stats Overview */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {/* Total Assessments - Scroll to assessments list */}
                        <div
                            onClick={() => {
                                const assessmentsSection = document.getElementById('assessments-list');
                                assessmentsSection?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="card-premium p-6 cursor-pointer hover:scale-105 transition-transform"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <BookOpen className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAssessments}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Assessments</div>
                                </div>
                            </div>
                        </div>

                        {/* Total Candidates - Navigate to user management */}
                        <Link
                            href="/admin/users"
                            className="card-premium p-6 cursor-pointer hover:scale-105 transition-transform block"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Users className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCandidates}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Candidates</div>
                                </div>
                            </div>
                        </Link>

                        {/* Avg Score - Navigate to analytics */}
                        <Link
                            href="/admin"
                            className="card-premium p-6 cursor-pointer hover:scale-105 transition-transform block"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="text-green-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(stats.avgScore)}%</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Assessments List */}
                    <div id="assessments-list">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Assessments</h2>
                            <Link
                                href="/admin"
                                className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
                            >
                                View Analytics →
                            </Link>
                        </div>

                        {assessments.length === 0 ? (
                            <div className="card-premium p-12 text-center">
                                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Assessments Yet</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">Wait for an admin to create assessments</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {visibleAssessments.map((assessment) => (
                                    <div key={assessment.id} className="card-premium p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{assessment.title}</h3>
                                                {assessment.description && (
                                                    <p className="text-gray-600 dark:text-gray-400 mb-4">{assessment.description}</p>
                                                )}
                                                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} />
                                                        <span>Created {formatDate(assessment.created_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen size={16} />
                                                        <span>{assessment.questions_count} questions</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={16} />
                                                        <span>{assessment.assigned_to.length} candidates</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/examiner/assessment/${assessment.id}`}
                                                    className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {assessments.length > 4 && (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setShowAllAssessments(!showAllAssessments)}
                                            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            {showAllAssessments ? 'Show Less' : 'View More'}
                                            <ChevronDown
                                                size={20}
                                                className={`transform transition-transform ${showAllAssessments ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}