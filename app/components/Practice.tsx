import React, { useState, useEffect } from 'react';
import { Branch } from '../types';
import { supabase } from '../services/supabase';
import { createPortal } from 'react-dom';
import { ModuleCardSkeleton } from './Skeletons';

interface PracticeProps {
    onStartTest: (testId: string) => void;
}

interface PracticeTest {
    id: string;
    type: 'worksheet' | 'exam';
    title: string;
    description: string;
    branch?: Branch; // Optional, only for worksheets
    duration?: string;
    time_limit_minutes?: number;
    status?: 'not_started' | 'in_progress' | 'completed';
}

const BRANCH_META = {
    [Branch.Perceiving]: { color: 'bg-blue-400', textColor: 'text-blue-500', label: 'Perceiving' },
    [Branch.Using]: { color: 'bg-purple-400', textColor: 'text-purple-500', label: 'Using' },
    [Branch.Understanding]: { color: 'bg-amber-400', textColor: 'text-amber-500', label: 'Understanding' },
    [Branch.Managing]: { color: 'bg-emerald-400', textColor: 'text-emerald-500', label: 'Managing' },
};

export const Practice: React.FC<PracticeProps> = ({ onStartTest }) => {
    const [activeTab, setActiveTab] = useState<'worksheets' | 'exams'>('worksheets');
    const [tests, setTests] = useState<PracticeTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState<PracticeTest | null>(null);

    useEffect(() => {
        const fetchTests = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch Tests
            const { data: testData, error: testError } = await supabase
                .from('practice_tests')
                .select('*')
                .eq('is_live', true)
                .order('created_at', { ascending: true });

            // Fetch My Sessions to map status
            let sessionsMap: Record<string, string> = {};
            if (user) {
                const { data: sessionData } = await supabase
                    .from('user_test_sessions')
                    .select('test_id, status')
                    .eq('user_id', user.id); // Assuming simple unique or latest.

                // If multiple sessions, take the most relevant (e.g. in_progress or latest completed)
                // Actually if there's an in_progress, show that. Else check for completed.
                // Simple logic: if ANY in_progress -> in_progress over completed? Or separate. 
                // Let's assume 1 active session per test for now or show 'Resume' if existing.
                if (sessionData) {
                    sessionData.forEach((s: any) => {
                        // Prioritize in_progress
                        if (s.status === 'in_progress') sessionsMap[s.test_id] = 'in_progress';
                        else if (!sessionsMap[s.test_id]) sessionsMap[s.test_id] = s.status;
                    });
                }
            }

            if (testError) {
                console.error('Error fetching practice tests:', testError);
            } else if (testData) {
                const formatted: PracticeTest[] = testData.map((t: any) => {
                    // Map DB branch codes to Enum values
                    let mappedBranch = t.branch;
                    if (t.branch === 'PERCEIVING') mappedBranch = Branch.Perceiving;
                    if (t.branch === 'USING') mappedBranch = Branch.Using;
                    if (t.branch === 'UNDERSTANDING') mappedBranch = Branch.Understanding;
                    if (t.branch === 'MANAGING') mappedBranch = Branch.Managing;

                    return {
                        id: t.id,
                        type: t.type,
                        title: t.title,
                        description: t.description || '',
                        branch: mappedBranch as Branch,
                        duration: t.time_limit_minutes ? `${t.time_limit_minutes} min` : 'Untimed',
                        time_limit_minutes: t.time_limit_minutes,
                        status: sessionsMap[t.id] as any || 'not_started'
                    };
                });
                setTests(formatted);
            }
            setIsLoading(false);
        };
        fetchTests();
    }, []);

    const worksheets = tests.filter(t => t.type === 'worksheet');
    const exams = tests.filter(t => t.type === 'exam');

    const getWorksheetsByBranch = (branch: Branch) => {
        return worksheets.filter(t => t.branch === branch);
    };

    const renderWorksheetCard = (test: PracticeTest) => {
        // Fallback for branch meta if data is inconsistent
        const meta = test.branch ? BRANCH_META[test.branch] : { color: 'bg-gray-400', textColor: 'text-gray-500', label: 'Unknown' };

        return (
            <div
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className="group relative bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg cursor-pointer hover:-translate-y-1"
            >
                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${meta.color}`}></div>
                <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">PRACTICE</span>
                        <div className={`w-2 h-2 rounded-full ${meta.color}`}></div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">{test.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{test.description}</p>
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400">{test.duration}</span>
                        <span className={`text-[10px] font-bold ${test.status === 'in_progress' ? 'text-blue-500' : meta.textColor}`}>
                            {test.status === 'in_progress' ? 'Resume →' : 'Start →'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-center items-center mb-6 gap-4">
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
            </div>

            {/* Content Area */}
            {activeTab === 'worksheets' ? (
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex gap-6 h-full min-w-max">
                        {Object.values(Branch).map((branch) => {
                            const branchTests = getWorksheetsByBranch(branch);
                            const meta = BRANCH_META[branch];
                            return (
                                <div key={branch} className="w-80 flex flex-col h-full">
                                    <div className={`p-4 rounded-t-2xl bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 flex items-center gap-3`}>
                                        <div className={`w-3 h-3 rounded-full ${meta.color}`}></div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">{meta.label}</h3>
                                        <span className="ml-auto text-[10px] font-bold text-gray-400 bg-white dark:bg-black/20 px-2 py-0.5 rounded-full">{branchTests.length}</span>
                                    </div>
                                    <div className="flex-1 bg-gray-50/50 dark:bg-white/[0.02] border-x border-b border-gray-100 dark:border-white/5 rounded-b-2xl p-4 overflow-y-auto custom-scrollbar space-y-3">
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => <ModuleCardSkeleton key={i} />)
                                        ) : (
                                            <>
                                                {branchTests.map(test => renderWorksheetCard(test))}
                                                {branchTests.length === 0 && (
                                                    <div className="text-center py-10 opacity-40">
                                                        <p className="text-[10px] uppercase font-bold">No worksheets</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                            <ModuleCardSkeleton />
                            <ModuleCardSkeleton />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.length > 0 ? exams.map(exam => (
                                <div key={exam.id} className="group flex flex-col bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black dark:text-white border border-gray-200 dark:border-white/5">
                                            {exam.duration}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-serif">{exam.title}</h3>
                                        <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-3">{exam.description}</p>
                                        <button
                                            onClick={() => setSelectedTest(exam)}
                                            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
                                        >
                                            Start Exam
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full flex flex-col items-center justify-center p-20 text-center opacity-60">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold">No Exams Available</h3>
                                    <p className="text-sm text-gray-500">Check back later for full diagnostic exams.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Test Detail Modal */}
            {selectedTest && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTest(null)}></div>
                    <div className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up p-8">
                        <div className="flex justify-between items-start mb-6">
                            {selectedTest.branch && (
                                <span className={`text-[10px] font-black uppercase tracking-wider ${BRANCH_META[selectedTest.branch].textColor} bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full`}>
                                    {selectedTest.branch}
                                </span>
                            )}
                            <button onClick={() => setSelectedTest(null)} className="text-gray-400 hover:text-black dark:hover:text-white ml-auto">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-serif">{selectedTest.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-sm">{selectedTest.description}</p>

                        <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{selectedTest.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                <span>Practice Mode</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onStartTest(selectedTest.id);
                                setSelectedTest(null);
                            }}
                            className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            {selectedTest.status === 'in_progress' ? 'Resume Session' : 'Start Session'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
