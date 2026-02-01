import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { UserStats, HistoryItem, Branch } from '../types';
import { TableSkeleton, HistoryCardSkeleton } from './Skeletons';
import { supabase } from '../services/supabase';

interface HistoryProps {
    stats: UserStats;
}

interface TestSessionHistory {
    id: string;
    date: string;
    title: string;
    score: number;
    type: 'worksheet' | 'exam';
    branch?: string;
    testId: string;
}

const BRANCH_META: Record<string, { color: string; textColor: string }> = {
    [Branch.Perceiving]: { color: 'bg-blue-500', textColor: 'text-blue-500' },
    [Branch.Using]: { color: 'bg-purple-500', textColor: 'text-purple-500' },
    [Branch.Understanding]: { color: 'bg-amber-500', textColor: 'text-amber-500' },
    [Branch.Managing]: { color: 'bg-emerald-500', textColor: 'text-emerald-500' },
};

export const History: React.FC<HistoryProps> = ({ stats }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [allHistory, setAllHistory] = useState<TestSessionHistory[]>([]);
    const [selectedItem, setSelectedItem] = useState<TestSessionHistory | null>(null);

    // Filters
    const [activeTab, setActiveTab] = useState<'worksheets' | 'exams'>('exams');
    const [branchFilter, setBranchFilter] = useState<string>('');
    const navigate = useNavigate();

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Fetch practice test sessions with test type and branch
            const { data: sessions, error } = await supabase
                .from('user_test_sessions')
                .select(`
                    id,
                    test_id,
                    score,
                    completed_at,
                    status,
                    practice_tests (
                        title,
                        type,
                        branch
                    )
                `)
                .eq('user_id', user.id) // Strict filter for current user
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });

            if (error) throw error;

            // Helper to map DB branch to Enum (Same logic as App.tsx to be safe, or just trust the raw string if we didn't normalize in App.tsx - wait, History fetches its OWN data independently from App.tsx stats!)
            // CRITICAL: History.tsx fetches its own data on mount (lines 40-54).
            // It does NOT use `stats.history` passed in props?
            // Line 27: `export const History: React.FC<HistoryProps> = ({ stats }) => {`
            // Line 78: `fetchHistory();`
            // It ignores `stats` prop and refetches!
            // So `App.tsx` normalization doesn't affect `History.tsx`'s internal state unless I update `fetchHistory` mapping too.

            const mapDbBranchToEnum = (dbBranch: string): string => {
                if (dbBranch === 'PERCEIVING') return Branch.Perceiving;
                if (dbBranch === 'USING') return Branch.Using;
                if (dbBranch === 'UNDERSTANDING') return Branch.Understanding;
                if (dbBranch === 'MANAGING') return Branch.Managing;
                return dbBranch;
            };

            // Map practice test sessions
            const testSessions: TestSessionHistory[] = (sessions || []).map((s: any) => ({
                id: s.id,
                date: s.completed_at ? new Date(s.completed_at).toLocaleDateString() : 'Unknown',
                title: s.practice_tests?.title || 'Practice Test',
                score: s.score || 0,
                type: s.practice_tests?.type || 'exam', // Default to exam if type missing? Or match DB.
                branch: mapDbBranchToEnum(s.practice_tests?.branch),
                testId: s.test_id
            }));

            setAllHistory(testSessions);
        } catch (err) {
            console.error('Error fetching history:', err);
            setAllHistory([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Filter history based on active tab and branch
    const filteredHistory = allHistory.filter(item => {
        // Tab filter
        if (activeTab === 'worksheets' && item.type !== 'worksheet') return false;
        if (activeTab === 'exams' && item.type !== 'exam') return false;

        // Branch filter (only applicable for worksheets generally)
        if (branchFilter && item.branch !== branchFilter) return false;

        return true;
    });

    // Mock data generator for the detailed view
    const getDetailedBreakdown = (score: number) => {
        const accuracy = Math.min(100, score + 5);
        const speed = score > 80 ? "Fast" : score > 60 ? "Moderate" : "Slow";
        const consistency = score > 75 ? "High" : "Variable";

        return [
            { label: "Consensus Accuracy", value: `${accuracy}%`, color: "text-green-500" },
            { label: "Response Speed", value: speed, color: "text-blue-500" },
            { label: "Consistency", value: consistency, color: "text-amber-500" }
        ];
    };

    const getTypeLabel = (type: string) => {
        return type === 'worksheet' ? 'Worksheet' : 'Exam';
    };

    const getTypeColor = (type: string) => {
        return type === 'worksheet' ? 'bg-purple-500' : 'bg-blue-500';
    };

    const getBranchColor = (branch?: string) => {
        if (!branch || !BRANCH_META[branch]) return 'bg-gray-400';
        return BRANCH_META[branch].color;
    };



    return (
        <div className="space-y-6 animate-fade-in-up relative">
            {/* Header with Tabs and Branch Pills inline */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Main Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-full">
                    <button
                        onClick={() => setActiveTab('worksheets')}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'worksheets'
                            ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                    >
                        Worksheets
                    </button>
                    <button
                        onClick={() => setActiveTab('exams')}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'exams'
                            ? 'bg-white dark:bg-white text-black dark:text-black shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                    >
                        Exams
                    </button>
                </div>

                {/* Branch Pill Tabs */}
                <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 w-full md:w-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setBranchFilter('')}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${branchFilter === ''
                            ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                            : 'bg-transparent text-gray-500 border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'
                            }`}
                    >
                        All
                    </button>
                    {[Branch.Perceiving, Branch.Using, Branch.Understanding, Branch.Managing].map((branch) => {
                        const meta = BRANCH_META[branch];
                        const isActive = branchFilter === branch;
                        return (
                            <button
                                key={branch}
                                onClick={() => setBranchFilter(branch)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-2 ${isActive
                                    ? `${meta.color} text-white border-transparent`
                                    : 'bg-transparent text-gray-500 border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : meta.color}`}></span>
                                {branch.replace(' Emotions', '')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <HistoryCardSkeleton key={i} />)
                ) : filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="bg-white dark:bg-dark-nav p-5 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${item.branch ? getBranchColor(item.branch) : getTypeColor(item.type)}`}></span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.date}</span>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.score >= 75
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : item.score >= 60
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {item.score >= 75 ? 'Excellent' : item.score >= 60 ? 'Passing' : 'Review'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{getTypeLabel(item.type)}</span>
                                {item.branch && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.branch}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <span className={`text-2xl font-extrabold ${item.score >= 70 ? 'text-black dark:text-white' : 'text-gray-500'}`}>
                                    {item.score}%
                                </span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5 mx-2"></div>
                                <span className="text-xs font-bold text-secondary flex items-center gap-1">
                                    View Report
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-base">
                        No {activeTab} completed yet.
                    </div>
                )}
            </div>

            {/* Desktop View: Table */}
            {
                isLoading ? (
                    <div className="hidden md:block">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="hidden md:block bg-white dark:bg-dark-nav rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-50 dark:border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Branch</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {filteredHistory.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        >
                                            <td className="px-8 py-5 text-sm font-medium text-gray-900 dark:text-white">
                                                {item.date}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${getTypeColor(item.type)}`}></span>
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {item.branch ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${getBranchColor(item.branch)}`}></span>
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.branch}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`text-sm font-bold ${item.score >= 70 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                    {item.score}%
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${item.score >= 75
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : item.score >= 60
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {item.score >= 75 ? 'Excellent' : item.score >= 60 ? 'Passing' : 'Review'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                No {activeTab} completed yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Side View Drawer - Portaled to Body */}
            {
                selectedItem && createPortal(
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <div
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                            onClick={() => setSelectedItem(null)}
                        ></div>

                        <div className="relative w-full max-w-md bg-white dark:bg-dark-nav h-full shadow-2xl overflow-y-auto animate-slide-in-right border-l border-gray-100 dark:border-gray-800 flex flex-col">
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors z-10"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            {/* Hero Section with Score */}
                            <div className={`p-8 pb-12 ${selectedItem.score >= 80
                                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
                                : selectedItem.score >= 60
                                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
                                    : 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20'
                                }`}>
                                <div className="flex items-center gap-2 mb-4 mt-4">
                                    <span className={`w-2 h-2 rounded-full ${selectedItem.branch ? getBranchColor(selectedItem.branch) : getTypeColor(selectedItem.type)}`}></span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{selectedItem.date}</span>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedItem.title}</h2>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="text-xs font-medium text-gray-500">{getTypeLabel(selectedItem.type)}</span>
                                    {selectedItem.branch && (
                                        <>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="text-xs font-medium text-gray-500">{selectedItem.branch}</span>
                                        </>
                                    )}
                                </div>

                                {/* Score Circle */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-white/10" />
                                            <circle
                                                cx="50" cy="50" r="40"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeDasharray={`${selectedItem.score * 2.51} 251`}
                                                className={selectedItem.score >= 80 ? 'text-emerald-500' : selectedItem.score >= 60 ? 'text-amber-500' : 'text-rose-500'}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-black text-gray-900 dark:text-white">{selectedItem.score}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-xl font-bold ${selectedItem.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : selectedItem.score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {selectedItem.score >= 80 ? 'Well Done!' : selectedItem.score >= 60 ? 'Good Progress' : 'Keep Practicing'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {selectedItem.score >= 80
                                                ? 'You\'re showing strong EI skills'
                                                : selectedItem.score >= 60
                                                    ? 'You\'re on the right track'
                                                    : 'Every attempt builds your skills'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8 flex-1">
                                {/* Key Insights */}
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Key Insights</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-600 dark:text-blue-400 text-sm">🎯</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Accuracy</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {selectedItem.score >= 75
                                                        ? 'Your responses closely matched expert consensus'
                                                        : 'Some responses differed from expert consensus'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-purple-600 dark:text-purple-400 text-sm">⚡</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Response Pattern</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {selectedItem.score >= 70
                                                        ? 'Consistent reasoning across scenarios'
                                                        : 'Try to identify patterns in emotional scenarios'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-emerald-600 dark:text-emerald-400 text-sm">📈</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Growth Area</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {selectedItem.branch
                                                        ? `Continue developing your ${selectedItem.branch} skills`
                                                        : 'Focus on distinguishing subtle emotional nuances'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Personalized Feedback */}
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Your Feedback</h3>
                                    <div className={`p-5 rounded-2xl border ${selectedItem.score >= 80
                                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                                        : selectedItem.score >= 60
                                            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                                            : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'
                                        }`}>
                                        <p className={`text-sm leading-relaxed ${selectedItem.score >= 80
                                            ? 'text-emerald-800 dark:text-emerald-300'
                                            : selectedItem.score >= 60
                                                ? 'text-amber-800 dark:text-amber-300'
                                                : 'text-rose-800 dark:text-rose-300'
                                            }`}>
                                            {selectedItem.score >= 80
                                                ? "Excellent work! You demonstrated strong emotional intelligence in this assessment. Your ability to read and interpret emotional cues aligns well with expert models. Keep challenging yourself with more complex scenarios."
                                                : selectedItem.score >= 60
                                                    ? "You're making solid progress! Your foundational understanding is there. Focus on the nuanced differences between similar emotions - this is often where the MSCEIT tests deeper comprehension."
                                                    : "This is a great starting point. Emotional intelligence is a skill that develops with practice. Review the theory behind this section and try again - you'll likely see improvement with each attempt."}
                                        </p>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Recommended Next Steps</h3>
                                    <div className="space-y-2">
                                        {selectedItem.score < 80 && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">Retake this assessment</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">Review learning materials</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">Try a different {selectedItem.type === 'exam' ? 'exam' : 'worksheet'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                                <button
                                    onClick={() => navigate(`/test/${selectedItem.testId}?reviewSessionId=${selectedItem.id}`)}
                                    className="w-full py-4 rounded-full bg-white dark:bg-black text-black dark:text-white border border-gray-200 dark:border-gray-800 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
                                >
                                    Review Answers
                                </button>
                                <button className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-all">
                                    Share Results
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
};