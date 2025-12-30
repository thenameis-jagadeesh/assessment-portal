'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Trophy, TrendingUp, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import Link from 'next/link';
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
    scheduled_for?: string;
    duration_minutes?: number;
    status: 'upcoming' | 'completed';
}

interface Result {
    assessment_id: string;
    assessment_title: string;
    score: number;
    max_score: number;
    graded_at: string;
}

export default function CandidateDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [upcomingAssessments, setUpcomingAssessments] = useState<AssessmentItem[]>([]);
    const [visibleUpcomingAssessments, setVisibleUpcomingAssessments] = useState<AssessmentItem[]>([]);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);
    const [pastResults, setPastResults] = useState<Result[]>([]);
    const [visiblePastResults, setVisiblePastResults] = useState<Result[]>([]);
    const [showAllResults, setShowAllResults] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'candidate') {
            router.push('/');
            return;
        }

        setUser(parsedUser);
        fetchDashboardData(parsedUser.id);
    }, [router]);

    const fetchDashboardData = async (userId: string) => {
        try {
            // Fetch assigned assessments
            const assessmentsRes = await fetch(`/api/candidate/assessments?userId=${userId}`);
            if (assessmentsRes.ok) {
                const data = await assessmentsRes.json();
                setUpcomingAssessments(data.assessments || []);
            }

            // Fetch past results
            const resultsRes = await fetch(`/api/candidate/results?userId=${userId}`);
            if (resultsRes.ok) {
                const data = await resultsRes.json();
                setPastResults(data.results || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Filter to show only upcoming assessments (not completed)
        const upcoming = upcomingAssessments.filter(a => a.status === 'upcoming');
        setVisibleUpcomingAssessments(showAllUpcoming ? upcoming : upcoming.slice(0, 4));
    }, [upcomingAssessments, showAllUpcoming]);

    useEffect(() => {
        // Initially show only first 4 past results (changed from 5 to 4)
        setVisiblePastResults(showAllResults ? pastResults : pastResults.slice(0, 4));
    }, [pastResults, showAllResults]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">VinavalAI</h1>
                                    <span className="text-gray-400 dark:text-gray-600">•</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Assessment Portal</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Welcome, {user.name} • {user.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
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
                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <BookOpen className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{upcomingAssessments.filter(a => a.status === 'upcoming').length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Tests</div>
                                </div>
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Trophy className="text-green-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{pastResults.length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                                </div>
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {pastResults.length > 0
                                            ? Math.round(
                                                pastResults.reduce((acc, r) => acc + (r.score / r.max_score) * 100, 0) /
                                                pastResults.length
                                            )
                                            : 0}%
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Assessments */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Assessments</h2>
                        {upcomingAssessments.filter(a => a.status === 'upcoming').length === 0 ? (
                            <div className="card-premium p-12 text-center">
                                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-gray-600 dark:text-gray-400">No upcoming assessments</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {visibleUpcomingAssessments.map((assessment) => (
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
                                                        <span>{formatDate(assessment.scheduled_for)}</span>
                                                    </div>
                                                    {assessment.duration_minutes && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={16} />
                                                            <span>{assessment.duration_minutes} minutes</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/assessment/${assessment.id}`}
                                                className="px-6 py-3 btn-gradient font-semibold rounded-xl shadow-lg"
                                            >
                                                Start Test
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                {upcomingAssessments.filter(a => a.status === 'upcoming').length > 4 && (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                                            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            {showAllUpcoming ? 'Show Less' : 'View More'}
                                            <ChevronDown
                                                size={20}
                                                className={`transform transition-transform ${showAllUpcoming ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Past Results */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Results</h2>
                        {pastResults.length === 0 ? (
                            <div className="card-premium p-12 text-center">
                                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-gray-600 dark:text-gray-400">No completed assessments yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {visiblePastResults.map((result, idx) => (
                                    <div key={idx} className="card-premium p-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{result.assessment_title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(result.graded_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-purple-600">
                                                    {Math.round((result.score / result.max_score) * 100)}%
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {result.score}/{result.max_score} points
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {pastResults.length > 4 && (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setShowAllResults(!showAllResults)}
                                            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            {showAllResults ? 'Show Less' : 'View More'}
                                            <ChevronDown
                                                size={20}
                                                className={`transform transition-transform ${showAllResults ? 'rotate-180' : ''}`}
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