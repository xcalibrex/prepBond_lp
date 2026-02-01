import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DS } from '../../design-system';
import { TableSkeleton, RadarChartSkeleton } from '../Skeletons';
import { supabase } from '../../services/supabase';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    status: 'active' | 'pending' | 'invited' | 'inactive';
    joined: string;
    onboarding_complete?: boolean;
    scores?: { [key: string]: number };
}

export const AdminUsers: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filterRole, setFilterRole] = useState<'all' | 'student' | 'admin'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'invited' | 'inactive'>('active');
    const [filterOnboarding, setFilterOnboarding] = useState<'all' | 'complete' | 'incomplete'>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student' });
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);

    // Dropdown Logic
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const [userToRemove, setUserToRemove] = useState<User | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const filterButtonRef = React.useRef<HTMLButtonElement>(null);
    const filterMenuRef = React.useRef<HTMLDivElement>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch users from Supabase
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                // Fetch profiles
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, updated_at, status, onboarding_complete')
                    .order('updated_at', { ascending: false });

                if (profilesError) {
                    console.error('Error fetching profiles:', profilesError);
                    setIsLoading(false);
                    return;
                }

                // Fetch assessment history for scores
                const { data: scoresData, error: scoresError } = await supabase
                    .from('assessment_history')
                    .select('user_id, branch, score');

                if (scoresError) {
                    console.error('Error fetching scores:', scoresError);
                }

                // Map profiles to User interface
                const mappedUsers: User[] = (profiles || []).map(p => {
                    // Find scores for this user
                    const userScores = {
                        'Perceiving Emotions': 0,
                        'Using Emotions': 0,
                        'Understanding Emotions': 0,
                        'Managing Emotions': 0
                    };

                    if (scoresData) {
                        scoresData
                            .filter(s => s.user_id === p.id)
                            .forEach(s => {
                                if (userScores.hasOwnProperty(s.branch)) {
                                    userScores[s.branch] = s.score;
                                }
                            });
                    }

                    return {
                        id: p.id,
                        name: p.full_name || 'Unknown User',
                        email: '', // Email not available in profiles table
                        role: (p.role as 'student' | 'admin') || 'student',
                        status: (p.status as 'active' | 'invited' | 'inactive') || 'active',
                        joined: new Date(p.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        onboarding_complete: p.onboarding_complete,
                        scores: userScores
                    };
                });

                setUsers(mappedUsers);
            } catch (err) {
                console.error('Error in fetchUsers:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        const matchesOnboarding = filterOnboarding === 'all' ||
            (filterOnboarding === 'complete' ? user.onboarding_complete : !user.onboarding_complete);

        return matchesSearch && matchesRole && matchesStatus && matchesOnboarding;
    });

    // Close filters on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node) &&
                filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole, filterStatus, filterOnboarding]);

    const selectedUser = useMemo(() => users.find(u => u.id === id), [id, users]);

    const handleRowClick = (userId: string) => {
        navigate(`/admin/users/${userId}`);
    };

    const closePanel = () => {
        navigate('/admin/users');
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);

        try {
            // 1. Invite user via Supabase Edge Function
            const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
                body: {
                    email: newUser.email,
                    full_name: newUser.name,
                    role: newUser.role
                }
            });

            if (inviteError) throw inviteError;

            // 2. Profile is now created atomically in the Edge Function
            // We just need to update the local state
            if (inviteData?.user?.id) {
                const createdUser: User = {
                    id: inviteData.user.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role as 'student' | 'admin',
                    status: 'invited',
                    joined: new Date().toLocaleDateString(),
                    onboarding_complete: false
                };
                setUsers([createdUser, ...users]);

                setShowInviteModal(false);
                setNewUser({ name: '', email: '', role: 'student' });
            }
        } catch (error: any) {
            console.error('Invite failed:', error);
            alert(`Invite failed: ${error.message}`);
        } finally {
            setIsInviting(false);
        }
    };

    const handleResendDirectly = async (userId: string) => {
        try {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            // Optimistic feedback or loading state could be added here
            setActiveMenuId(null);

            const { error } = await supabase.functions.invoke('invite-user', {
                body: {
                    user_id: user.id,
                    full_name: user.name,
                    role: user.role
                }
            });

            if (error) throw error;
            alert('Invitation resent successfully');

        } catch (e: any) {
            console.error('Resend failed:', e);
            alert(`Resend failed: ${e.message}`);
        }
    };

    const handleRemoveUser = async () => {
        if (!userToRemove) return;
        setIsRemoving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: 'inactive' })
                .eq('id', userToRemove.id);

            if (error) throw error;

            setUsers(users.map(u => u.id === userToRemove.id ? { ...u, status: 'inactive' } : u));
            setUserToRemove(null);
            setActiveMenuId(null);
        } catch (error) {
            console.error('Error removing user:', error);
            alert('Failed to deactivate user');
        } finally {
            setIsRemoving(false);
        }
    };

    // Format data for Radar Chart
    const radarData = useMemo(() => {
        if (!selectedUser?.scores) return [];
        return Object.entries(selectedUser.scores).map(([key, value]) => ({
            subject: key.replace(' Emotions', ''),
            A: value,
            fullMark: 100,
        }));
    }, [selectedUser]);

    // Open Menu with Position
    const toggleMenu = (userId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (activeMenuId === userId) {
            setActiveMenuId(null);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            // Adjust position to align nicely
            setMenuPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.right + window.scrollX - 192 // Align right edge (w-48 = 192px)
            });
            setActiveMenuId(userId);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in-up -m-6 md:-m-8 p-6 md:p-8 font-sans">
            {/* Header Row: Search + Filter + Invite */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 shrink-0 z-20 items-center justify-between">
                <div className="flex gap-3 flex-1 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-grow max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-sm hover:border-gray-300 dark:hover:border-white/20"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            ref={filterButtonRef}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`h-full px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm hover:border-gray-300 dark:hover:border-white/20 ${isFilterOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
                        >
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            <span className="hidden sm:inline">Filters</span>
                            {(filterRole !== 'all' || filterStatus !== 'all' || filterOnboarding !== 'all') && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                            )}
                        </button>

                        {/* Filter Dropdown Popover */}
                        {isFilterOpen && (
                            <div
                                ref={filterMenuRef}
                                className="absolute left-0 top-full mt-2 w-[320px] bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-black/50 border border-gray-100 dark:border-white/10 p-6 z-50 animate-fade-in-up backdrop-blur-xl"
                            >
                                <div className="space-y-6">
                                    {/* Role Filter */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            {['all', 'student', 'admin'].map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => setFilterRole(role as any)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize border transition-all duration-200 ${filterRole === role
                                                        ? 'bg-black text-white border-black dark:bg-white dark:text-black'
                                                        : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-white/5" />

                                    {/* Status Filter */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Status</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {['all', 'active', 'invited', 'inactive'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => setFilterStatus(status as any)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all duration-200 ${filterStatus === status
                                                        ? 'bg-black text-white border-black dark:bg-white dark:text-black'
                                                        : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-white/5" />

                                    {/* Onboarding Filter */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Onboarding</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setFilterOnboarding('complete')}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${filterOnboarding === 'complete'
                                                    ? 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400'
                                                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 border-transparent hover:bg-gray-100'
                                                    }`}
                                            >
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => setFilterOnboarding('incomplete')}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${filterOnboarding === 'incomplete'
                                                    ? 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400'
                                                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 border-transparent hover:bg-gray-100'
                                                    }`}
                                            >
                                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                Pending
                                            </button>
                                        </div>
                                    </div>

                                    {(filterRole !== 'all' || filterStatus !== 'all' || filterOnboarding !== 'all') && (
                                        <button
                                            onClick={() => {
                                                setFilterRole('all');
                                                setFilterStatus('all');
                                                setFilterOnboarding('all');
                                            }}
                                            className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors border-t border-gray-100 dark:border-white/5 pt-4"
                                        >
                                            Reset Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invite Button */}
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="
                group relative px-6 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black 
                shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.16)] 
                active:scale-[0.98] transition-all duration-200 flex items-center gap-2
                    "
                >
                    <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    <span>Invite User</span>
                </button>
            </div>

            {isLoading ? (
                <TableSkeleton rows={5} columns={5} />
            ) : (
                <div className="flex-1 bg-white dark:bg-dark-nav rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-0">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left relative border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white/80 dark:bg-dark-nav/90 backdrop-blur-md z-10">
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Onboarding</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Joined</th>
                                    <th className="px-8 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {paginatedUsers.map(user => (
                                    <tr
                                        key={user.id}
                                        onClick={() => handleRowClick(user.id)}
                                        className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-[#1A1A1A] shadow-sm">
                                                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {user.status === 'active' && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#1A1A1A] rounded-full" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{user.name}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                                                ${user.role === 'admin'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-500/20'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-500/20'
                                                } `}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5
                                                    ${user.status === 'active' ? 'bg-green-50 text-green-700' :
                                                        user.status === 'invited' ? 'bg-blue-50 text-blue-700' :
                                                            user.status === 'inactive' ? 'bg-gray-100 text-gray-500' :
                                                                'bg-orange-50 text-orange-700'
                                                    }
                                                 `}>
                                                    <span className={`w-1.5 h-1.5 rounded-full 
                                                        ${user.status === 'active' ? 'bg-green-500' :
                                                            user.status === 'invited' ? 'bg-blue-500' :
                                                                user.status === 'inactive' ? 'bg-gray-400' :
                                                                    'bg-orange-500'
                                                        } `}
                                                    />
                                                    {user.status || 'Pending'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Onboarding Column */}
                                        <td className="px-8 py-5 text-center">
                                            {user.onboarding_complete ? (
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-300 dark:bg-white/5 dark:text-gray-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-8 py-5 text-right">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tabular-nums">{user.joined}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right relative">
                                            <button
                                                onClick={(e) => toggleMenu(user.id, e)}
                                                className="p-2 text-gray-300 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-8 py-4 border-t border-gray-50 dark:border-white/5 bg-white dark:bg-dark-nav shrink-0 z-10 relative">
                        <div className="text-xs font-medium text-gray-400">
                            Showing <span className="text-gray-900 dark:text-white">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="text-gray-900 dark:text-white">{filteredUsers.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: totalPages || 1 }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-2 h-2 rounded-full transition-all ${currentPage === i + 1 ? 'bg-black dark:bg-white scale-125' : 'bg-gray-200 dark:bg-white/20 hover:bg-gray-300'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Popup Portal */}
            {activeMenuId && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}
                    />
                    <div
                        className="fixed z-50 w-52 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-black/50 border border-gray-100 dark:border-white/10 overflow-hidden animate-scale-in origin-top-right ring-1 ring-black/5"
                        style={{
                            top: menuPosition?.top,
                            left: menuPosition?.left
                        }}
                    >
                        <div className="p-1.5 flex flex-col gap-0.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleResendDirectly(users.find(u => u.id === activeMenuId)?.id || '');
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Resend Invitation
                            </button>
                            <div className="h-px bg-gray-50 dark:bg-white/5 my-0.5" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const user = users.find(u => u.id === activeMenuId);
                                    if (user) setUserToRemove(user);
                                    setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-3 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Remove User
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* Side Panel */}
            {selectedUser && createPortal(
                <>
                    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-dark-nav shadow-2xl z-[200] animate-fade-in-up border-l border-gray-100 dark:border-white/10">
                        <div className="h-full flex flex-col p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-10">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${selectedUser.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'} `}>
                                    {selectedUser.role} User
                                </span>
                                <button onClick={closePanel} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white rounded-full bg-gray-50 dark:bg-white/5 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-lg text-gray-500">
                                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">{selectedUser.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">MSCEIT Profile</h4>
                                    <div className="h-[300px] w-full bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                <PolarGrid stroke="#E4E4E7" strokeOpacity={1} />
                                                <PolarAngleAxis
                                                    dataKey="subject"
                                                    tick={{ fill: '#3F3F46', fontSize: 10, fontWeight: 600 }}
                                                />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#18181B', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Radar
                                                    name="Score"
                                                    dataKey="A"
                                                    stroke="#000000"
                                                    strokeWidth={2}
                                                    fill="#007bff"
                                                    fillOpacity={0.2}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Account Details</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Status</span>
                                            <span className="text-xs font-bold text-emerald-500 uppercase">{selectedUser.status}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Joined</span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedUser.joined}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-8 flex gap-3">
                                <button className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">Manage Permissions</button>
                                <button className="px-6 py-4 border border-red-200 dark:border-red-900/30 text-red-500 rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">Suspend</button>
                            </div>
                        </div>
                    </div>

                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[190] animate-fade-in"
                        onClick={closePanel}
                    />
                </>,
                document.body
            )}

            {/* Invite User Modal */}
            {showInviteModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md" onClick={() => setShowInviteModal(false)}></div>
                    <form onSubmit={handleInvite} className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up p-10">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">Invite User</h2>
                                <p className="text-xs text-gray-500 mt-1">Send an invitation to join the platform.</p>
                            </div>
                            <button type="button" onClick={() => setShowInviteModal(false)} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition-all rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-center md:text-left">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="e.g., Jane Smith"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-center md:text-left">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="e.g., jane@example.com"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-center md:text-left">Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, role: 'student' })}
                                        className={`group relative p-4 rounded-2xl text-sm font-bold transition-all border flex flex-col items-center gap-3 ${newUser.role === 'student'
                                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white ring-2 ring-black/10 dark:ring-white/20'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${newUser.role === 'student' ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/10'}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                                        </div>
                                        <span>Student</span>
                                        {newUser.role === 'student' && (
                                            <div className="absolute top-3 right-3 text-white dark:text-black">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                                        className={`group relative p-4 rounded-2xl text-sm font-bold transition-all border flex flex-col items-center gap-3 ${newUser.role === 'admin'
                                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white ring-2 ring-black/10 dark:ring-white/20'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${newUser.role === 'admin' ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/10'}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                        <span>Admin</span>
                                        {newUser.role === 'admin' && (
                                            <div className="absolute top-3 right-3 text-white dark:text-black">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-4 rounded-[200px] border border-gray-200 dark:border-gray-700 font-black text-[10px] uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                            <button type="submit" disabled={isInviting} className="flex-1 py-4 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none">
                                {isInviting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    'Send Invite'
                                )}
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}

            {/* Remove User Confirmation Modal */}
            {userToRemove && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUserToRemove(null)}></div>
                    <div className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up">
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-6">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remove User?</h3>
                        <p className="text-sm text-gray-500 mb-8">
                            Are you sure you want to remove <span className="font-bold text-gray-900 dark:text-white">{userToRemove.name}</span>? This will mark their account as inactive and prevent them from logging in.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setUserToRemove(null)}
                                className="flex-1 py-3 rounded-full border border-gray-200 dark:border-gray-700 font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveUser}
                                disabled={isRemoving}
                                className="flex-1 py-3 rounded-full bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isRemoving ? 'Removing...' : 'Confirm Remove'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
