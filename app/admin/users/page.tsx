'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Users, Mail, Trash2, ArrowLeft, Shield, FileText, Download, XCircle, Award, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import NextImage from 'next/image';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'candidate' | 'examiner' | 'admin';
    created_at: string;
}

export default function ManageUsersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'examiner' as 'candidate' | 'examiner' | 'admin'
    });
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userResults, setUserResults] = useState<any[]>([]);
    const [fetchingResults, setFetchingResults] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'examiner' && parsedUser.role !== 'admin') {
            router.push('/');
            return;
        }

        setCurrentUser(parsedUser);
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(getApiUrl('/admin/users'));
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(getApiUrl('/auth/signup'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create user');
            }

            // Reset form and close modal
            setFormData({ name: '', email: '', role: 'examiner' });
            setShowCreateModal(false);

            // Refresh users list
            fetchUsers();

            alert('User created successfully!');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!currentUser) return;

        const confirmDelete = confirm(
            `Are you sure you want to delete "${userName}"?\n\nThis will:\n- Remove the user from the system\n- Remove them from all assessments\n- This action cannot be undone`
        );

        if (!confirmDelete) return;

        try {
            const res = await fetch(getApiUrl('/admin/users'), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    admin_id: currentUser.id
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            const data = await res.json();
            alert(data.message);

            // Refresh users list
            fetchUsers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };
    const handleViewReports = async (user: User) => {
        setSelectedUser(user);
        setShowReportsModal(true);
        setFetchingResults(true);
        try {
            const res = await fetch(getApiUrl(`/admin/users/${user.id}/results`));
            if (res.ok) {
                const data = await res.json();
                setUserResults(data.results || []);
            }
        } catch (error) {
            console.error('Error fetching user results:', error);
        } finally {
            setFetchingResults(false);
        }
    };

    const downloadUserFullReport = () => {
        if (!selectedUser || userResults.length === 0) return;

        const reportData = [
            ['Candidate Performance Report'],
            ['Name', selectedUser.name],
            ['Email', selectedUser.email],
            ['Total Assessments', userResults.length],
            ['Generated At', new Date().toLocaleString()],
            [],
            ['Assessment Title', 'Score', 'Max Score', 'Percentage', 'Attempt', 'Submitted At']
        ];

        userResults.forEach(r => {
            reportData.push([
                r.assessment_title,
                r.score,
                r.max_score,
                `${r.percentage}%`,
                r.attempt_number || 1,
                new Date(r.graded_at).toLocaleString()
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, 'All Assessments');
        XLSX.writeFile(wb, `${selectedUser.name.replace(/\s+/g, '_')}_Full_Report.xlsx`);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    const candidates = users.filter(u => u.role === 'candidate');
    const examiners = users.filter(u => u.role === 'examiner');
    const admins = users.filter(u => u.role === 'admin');

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="px-6 py-4">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium mb-2"
                        >
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Link>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <NextImage
                                    src="/logo.png"
                                    alt="GuhaTek Logo"
                                    width={100}
                                    height={35}
                                    className="h-9 w-auto object-contain dark:brightness-0 dark:invert"
                                    priority
                                />
                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">VinavalAI</h1>
                                        <span className="text-gray-400 dark:text-gray-600">•</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Assessment Portal</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">User Management</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <ThemeToggle />
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 btn-gradient font-semibold rounded-xl shadow-lg flex items-center gap-2"
                                >
                                    <UserPlus size={20} />
                                    Create User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Stats */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Users className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{candidates.length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Candidates</div>
                                </div>
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Shield className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{examiners.length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Examiners</div>
                                </div>
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Shield className="text-orange-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{admins.length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Admins</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admins List */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admins</h2>
                        <div className="card-premium overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Created</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {admins.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(user.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                                                    Admin
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Examiners List */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Examiners</h2>
                        <div className="card-premium overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Created</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {examiners.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(user.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                                    Examiner
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Candidates List */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Candidates</h2>
                        <div className="card-premium overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Created</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {candidates.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(user.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                    Candidate
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewReports(user)}
                                                        className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <FileText size={16} />
                                                        Reports
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="card-premium p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New User</h2>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Role
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'candidate' })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'candidate'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <Users className={`mx-auto mb-2 ${formData.role === 'candidate' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                                        <div className="font-semibold text-xs">Candidate</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'examiner' })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'examiner'
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <Shield className={`mx-auto mb-2 ${formData.role === 'examiner' ? 'text-purple-600' : 'text-gray-400'}`} size={24} />
                                        <div className="font-semibold text-xs">Examiner</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'admin'
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <Shield className={`mx-auto mb-2 ${formData.role === 'admin' ? 'text-orange-600' : 'text-gray-400'}`} size={24} />
                                        <div className="font-semibold text-xs">Admin</div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                    required
                                />
                            </div>



                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 btn-gradient font-semibold rounded-xl"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* User Reports Modal */}
            {showReportsModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="card-premium p-8 max-w-4xl w-full animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="text-purple-600" />
                                    Candidate Reports: {selectedUser.name}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedUser.email}</p>
                            </div>
                            <button
                                onClick={() => setShowReportsModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6">
                            {fetchingResults ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">Fetching results...</p>
                                </div>
                            ) : userResults.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No assessment results found for this candidate.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                            <div className="text-sm text-purple-600 font-semibold mb-1">Assessments Taken</div>
                                            <div className="text-2xl font-bold text-purple-900">{userResults.length}</div>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <div className="text-sm text-blue-600 font-semibold mb-1">Average Score</div>
                                            <div className="text-2xl font-bold text-blue-900">
                                                {Math.round(userResults.reduce((acc, r) => acc + r.percentage, 0) / userResults.length)}%
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                            <div className="text-sm text-green-600 font-semibold mb-1">Highest Score</div>
                                            <div className="text-2xl font-bold text-green-900">
                                                {Math.max(...userResults.map(r => r.percentage))}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden border border-gray-200 rounded-xl">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Assessment</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Score</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {userResults.map((result, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-4">
                                                            <div className="font-semibold text-gray-900 dark:text-white">{result.assessment_title}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Attempt {result.attempt_number || 1}</div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                            {result.score}/{result.max_score}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${result.percentage >= 70 ? 'bg-green-100 text-green-700' :
                                                                result.percentage >= 40 ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {result.percentage}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(result.graded_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReportsModal(false)}
                                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={downloadUserFullReport}
                                disabled={userResults.length === 0}
                                className="flex-1 px-4 py-3 btn-gradient font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Download size={20} />
                                Download Full History
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
