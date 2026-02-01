import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabase';
import { Branch } from '../../types';

interface PracticeTest {
    id: string;
    type: 'worksheet' | 'exam';
    title: string;
    description: string;
    branch?: Branch;
    time_limit_minutes?: number;
    created_at?: string;
    is_live?: boolean;
}

import { TestEditor } from './TestEditor';

export const AdminPractice: React.FC = () => {
    const [tests, setTests] = useState<PracticeTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTestId, setEditingTestId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'live'>('all');
    const [filterType, setFilterType] = useState<'all' | 'worksheet' | 'exam'>('all');

    // URL Param Logic
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const isEditor = searchParams.get('editor') === 'true';
        const uid = searchParams.get('uid');

        if (isEditor && uid) {
            setEditingTestId(uid);
        }
    }, [searchParams]);

    // New Test State
    const [newTest, setNewTest] = useState<Partial<PracticeTest>>({
        type: 'worksheet',
        title: '',
        description: '',
        branch: Branch.Perceiving,
        time_limit_minutes: 0,
        is_live: false
    });

    const fetchTests = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('practice_tests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tests:', error);
        } else if (data) {
            setTests(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const [confirmStatusModal, setConfirmStatusModal] = useState<{ isOpen: boolean; test: PracticeTest | null }>({
        isOpen: false,
        test: null
    });

    const handleStatusClick = (test: PracticeTest) => {
        setConfirmStatusModal({ isOpen: true, test });
    };

    const executeToggleLive = async () => {
        const test = confirmStatusModal.test;
        if (!test) return;

        const newValue = !test.is_live;

        // Optimistic update
        setTests(tests.map(t => t.id === test.id ? { ...t, is_live: newValue } : t));
        setConfirmStatusModal({ isOpen: false, test: null });

        const { error } = await supabase
            .from('practice_tests')
            .update({ is_live: newValue })
            .eq('id', test.id);

        if (error) {
            console.error('Error updating live status:', error);
            fetchTests(); // Revert on error
        }
    };

    // Map Enum to DB Code
    const BRANCH_TO_DB: Record<string, 'PERCEIVING' | 'USING' | 'UNDERSTANDING' | 'MANAGING'> = {
        [Branch.Perceiving]: 'PERCEIVING',
        [Branch.Using]: 'USING',
        [Branch.Understanding]: 'UNDERSTANDING',
        [Branch.Managing]: 'MANAGING'
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTest.title || !newTest.type) {
            alert('Title and Type are required');
            return;
        }

        const payload = {
            title: newTest.title,
            description: newTest.description,
            type: newTest.type,
            // Convert to DB-friendly uppercase code
            branch: (newTest.type === 'worksheet' && newTest.branch) ? BRANCH_TO_DB[newTest.branch] : null,
            time_limit_minutes: newTest.time_limit_minutes || null,
            is_live: newTest.is_live
        };

        const { error } = await supabase
            .from('practice_tests')
            .insert([payload]);

        if (error) {
            alert('Error creating test: ' + error.message);
        } else {
            setIsCreateModalOpen(false);
            setNewTest({
                type: 'worksheet',
                title: '',
                description: '',
                branch: Branch.Perceiving, // Reset to Enum default
                time_limit_minutes: 0,
                is_live: false
            });
            fetchTests();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete all sections and questions associated with this test.')) return;

        const { error } = await supabase
            .from('practice_tests')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting test');
        } else {
            fetchTests();
        }
    };

    const filteredTests = tests.filter(test => {
        const statusMatch = filterStatus === 'all' ? true : test.is_live;
        const typeMatch = filterType === 'all' ? true : test.type === filterType;
        return statusMatch && typeMatch;
    });

    return (
        <div className="pb-32 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-full">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-gray-400'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterType('worksheet')}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filterType === 'worksheet' ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-gray-400'}`}
                    >
                        Worksheets
                    </button>
                    <button
                        onClick={() => setFilterType('exam')}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filterType === 'exam' ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-gray-400'}`}
                    >
                        Exams
                    </button>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-full">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-gray-400'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('live')}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'live' ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-gray-400'}`}
                        >
                            Live Only
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                    >
                        + Create New
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">Loading tests...</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-6 py-4 text-left">Title</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Type</th>
                                <th className="px-6 py-4 text-left">Branch</th>
                                <th className="px-6 py-4 text-left">Time Limit</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredTests.map(test => (
                                <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{test.title}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">{test.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleStatusClick(test)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors
                                            ${test.is_live
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'}`}
                                        >
                                            {test.is_live ? 'LIVE' : 'DRAFT'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide 
                                            ${test.type === 'exam' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                            {test.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {test.branch || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {test.time_limit_minutes ? `${test.time_limit_minutes} min` : 'None'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSearchParams({ editor: 'true', uid: test.id })}
                                            className="text-blue-500 hover:text-blue-700 font-bold text-xs mr-4"
                                        >
                                            EDIT CONTENT
                                        </button>
                                        <button
                                            onClick={() => handleDelete(test.id)}
                                            className="text-red-400 hover:text-red-600 font-bold text-xs"
                                        >
                                            DELETE
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {tests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        No practice tests found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Status Confirmation Modal */}
            {confirmStatusModal.isOpen && confirmStatusModal.test && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmStatusModal({ isOpen: false, test: null })}></div>
                    <div className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-fade-in-up text-center border border-gray-100 dark:border-white/5">
                        <h2 className="text-xl font-bold font-serif mb-2 text-gray-900 dark:text-white">
                            {confirmStatusModal.test.is_live ? 'Unpublish Test?' : 'Publish Test?'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                            {confirmStatusModal.test.is_live
                                ? "This will switch the test to DRAFT mode and hide it from all students immediately."
                                : "This will make the test LIVE and visible to all students immediately."}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmStatusModal({ isOpen: false, test: null })}
                                className="flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-widest border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeToggleLive}
                                className={`flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:opacity-90 text-white transition-colors
                                    ${confirmStatusModal.test.is_live ? 'bg-black dark:bg-white dark:text-black' : 'bg-emerald-500'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Modal */}
            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-dark-nav w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-fade-in-up">
                        <h2 className="text-2xl font-bold font-serif mb-6 text-gray-900 dark:text-white">Create New Test</h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Type</label>
                                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setNewTest({ ...newTest, type: 'worksheet' })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newTest.type === 'worksheet' ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Worksheet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewTest({ ...newTest, type: 'exam' })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newTest.type === 'exam' ? 'bg-black text-white' : 'text-gray-500'}`}
                                    >
                                        Exam
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Title</label>
                                <input
                                    type="text"
                                    value={newTest.title}
                                    onChange={e => setNewTest({ ...newTest, title: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                    placeholder="e.g. Perceiving Emotions 101"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                <textarea
                                    value={newTest.description}
                                    onChange={e => setNewTest({ ...newTest, description: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white h-24 resize-none"
                                    placeholder="Brief description of the test..."
                                />
                            </div>

                            {newTest.type === 'worksheet' && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Branch</label>
                                    <select
                                        value={newTest.branch}
                                        onChange={e => setNewTest({ ...newTest, branch: e.target.value as Branch })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none"
                                    >
                                        {Object.values(Branch).map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Time Limit (Minutes)</label>
                                <input
                                    type="number"
                                    value={newTest.time_limit_minutes || ''}
                                    onChange={e => setNewTest({ ...newTest, time_limit_minutes: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                    placeholder="0 for unlimited"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-widest border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest shadow-lg hover:opacity-90"
                                >
                                    Create Test
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            {/* Test Editor Overlay */}
            {editingTestId && createPortal(
                <TestEditor
                    testId={editingTestId}
                    onClose={() => {
                        setEditingTestId(null);
                        setSearchParams({});
                    }}
                />,
                document.body
            )}
        </div>
    );
};
