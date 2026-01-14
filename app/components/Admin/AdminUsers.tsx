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
    status: 'active' | 'pending';
    joined: string;
    scores?: { [key: string]: number };
}

export const AdminUsers: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student' });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch users from Supabase
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                // Fetch profiles with their auth email
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, updated_at')
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error('Error fetching profiles:', error);
                    setIsLoading(false);
                    return;
                }

                // Map profiles to User interface
                const mappedUsers: User[] = (profiles || []).map(p => ({
                    id: p.id,
                    name: p.full_name || 'Unknown User',
                    email: '', // We'll display the ID for now since email needs auth.users access
                    role: (p.role as 'student' | 'admin') || 'student',
                    status: 'active' as const,
                    joined: new Date(p.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    scores: { 'Perceiving Emotions': 0, 'Using Emotions': 0, 'Understanding Emotions': 0, 'Managing Emotions': 0 }
                }));

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
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const selectedUser = useMemo(() => users.find(u => u.id === id), [id, users]);

    const handleRowClick = (userId: string) => {
        navigate(`/admin/users/${userId}`);
    };

    const closePanel = () => {
        navigate('/admin/users');
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Invite user via Supabase Auth
            // Note: This requires the Service Role Key or handled via a secure Edge Function.
            // For now, we use the client-side attempt, but standard anon keys can't do this.
            // Recommendation to user: Create an Edge Function for "invite-user" to handle this securely.

            const { error: inviteError } = await supabase.auth.signInWithOtp({
                email: newUser.email,
                options: {
                    data: {
                        full_name: newUser.name,
                        role: newUser.role,
                        onboarding_complete: false
                    },
                    shouldCreateUser: true,
                    emailRedirectTo: window.location.origin
                }
            });

            if (inviteError) throw inviteError;

            // 2. Insert/Upsert into profiles table to ensure role visibility
            // We usually wait for the user to actually sign up, but pre-creating profiles helps admins.
            // Using a placeholder ID or handling it on onboarding is better.

            alert(`Invitation sent to ${newUser.email}!`);
            setShowInviteModal(false);
            setNewUser({ name: '', email: '', role: 'student' });
        } catch (err: any) {
            console.error('Invite failed:', err);
            alert(`Failed to invite user: ${err.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
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

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center">
                {/* Role Filter Pills - Now before search, styled like Classes branch pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full lg:w-auto">
                    {['all', 'student', 'admin'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role as any)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${roleFilter === role
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent shadow-md'
                                : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-100 dark:border-transparent hover:border-gray-300 dark:hover:bg-white/10'
                                }`}
                        >
                            {role === 'all' ? 'All' : role}s
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-dark-nav border border-gray-100 dark:border-white/5 rounded-2xl px-12 py-[14px] text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none leading-none"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full lg:w-auto px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all outline-none"
                >
                    + Invite User
                </button>
            </div>

            {isLoading ? (
                <TableSkeleton rows={5} columns={5} />
            ) : (
                <div className="bg-white dark:bg-dark-nav rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50 dark:border-white/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {filteredUsers.map(user => (
                                    <tr
                                        key={user.id}
                                        onClick={() => handleRowClick(user.id)}
                                        className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-gray-500">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${user.role === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-500">{user.joined}</td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-lg transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Side Panel */}
            {selectedUser && createPortal(
                <>
                    <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-dark-nav shadow-2xl z-[200] transform transition-transform duration-500 ease-out border-l border-gray-100 dark:border-white/10 ${selectedUser ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="h-full flex flex-col p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-10">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${selectedUser.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
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
                                        className={`py-3.5 rounded-2xl text-xs font-bold transition-all border ${newUser.role === 'student' ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                                        className={`py-3.5 rounded-2xl text-xs font-bold transition-all border ${newUser.role === 'admin' ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        Admin
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-4 rounded-[200px] border border-gray-200 dark:border-gray-700 font-black text-[10px] uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-4 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Send Invite</button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
};
