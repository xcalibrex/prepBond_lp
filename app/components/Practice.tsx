import React, { useState, useMemo, useEffect } from 'react';
import { TRAINING_MODULES as HARDCODED_MODULES } from '../constants';
import { Branch, TrainingModule, UserStats } from '../types';
import { supabase } from '../services/supabase';
import { createPortal } from 'react-dom';
import { ModuleCardSkeleton } from './Skeletons';

interface PracticeProps {
    stats: UserStats;
    onRunModule: (branch: Branch) => void;
}

const BRANCH_META = {
    [Branch.Perceiving]: { color: 'bg-blue-400', textColor: 'text-blue-500', label: 'Perceiving' },
    [Branch.Using]: { color: 'bg-purple-400', textColor: 'text-purple-500', label: 'Using' },
    [Branch.Understanding]: { color: 'bg-amber-400', textColor: 'text-amber-500', label: 'Understanding' },
    [Branch.Managing]: { color: 'bg-emerald-400', textColor: 'text-emerald-500', label: 'Managing' },
};

export const Practice: React.FC<PracticeProps> = ({ stats, onRunModule }) => {
    const [activeTab, setActiveTab] = useState<'worksheets' | 'exams'>('worksheets');
    const [dbModules, setDbModules] = useState<TrainingModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);

    useEffect(() => {
        const fetchModules = async () => {
            setIsLoading(true);
            const { data } = await supabase.from('training_modules').select('*');
            if (data) {
                const formatted: TrainingModule[] = data.map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    branch: m.branch as Branch,
                    duration: m.duration,
                    requiredLevel: m.required_level
                }));
                setDbModules(formatted);
            }
            setIsLoading(false);
        };
        fetchModules();
    }, []);

    const allModules = useMemo(() => [...HARDCODED_MODULES, ...dbModules], [dbModules]);

    const getModulesByBranch = (branch: Branch) => {
        return allModules.filter(m => m.branch === branch);
    };

    const renderModuleCard = (module: TrainingModule) => {
        const meta = BRANCH_META[module.branch];
        const mastery = stats.masteryLevels[module.branch] || 1;
        // Logic: specific level locking can be relaxed or strict. Users wanted "Practice", implying more open access?
        // Let's keep level locking for now but maybe make it visual only if desired.
        // For now, standard locking.
        const isLocked = (module.requiredLevel || 0) > mastery;

        return (
            <div
                key={module.id}
                onClick={() => !isLocked && setSelectedModule(module)}
                className={`group relative bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg
                  ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}
                `}
            >
                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${meta.color}`}></div>
                <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Lvl {module.requiredLevel}</span>
                        {!isLocked && <div className={`w-2 h-2 rounded-full ${meta.color}`}></div>}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">{module.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{module.description}</p>
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400">{module.duration}</span>
                        {!isLocked && <span className={`text-[10px] font-bold ${meta.textColor}`}>Start →</span>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
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
                            const branchModules = getModulesByBranch(branch);
                            const meta = BRANCH_META[branch];
                            return (
                                <div key={branch} className="w-80 flex flex-col h-full">
                                    <div className={`p-4 rounded-t-2xl bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 flex items-center gap-3`}>
                                        <div className={`w-3 h-3 rounded-full ${meta.color}`}></div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">{meta.label}</h3>
                                        <span className="ml-auto text-[10px] font-bold text-gray-400 bg-white dark:bg-black/20 px-2 py-0.5 rounded-full">{branchModules.length}</span>
                                    </div>
                                    <div className="flex-1 bg-gray-50/50 dark:bg-white/[0.02] border-x border-b border-gray-100 dark:border-white/5 rounded-b-2xl p-4 overflow-y-auto custom-scrollbar space-y-3">
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => <ModuleCardSkeleton key={i} />)
                                        ) : (
                                            <>
                                                {branchModules.map(m => renderModuleCard(m))}
                                                {branchModules.length === 0 && (
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
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-gray-50 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/5">
                    <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Full Exams</h2>
                    <p className="text-gray-500 max-w-md mb-8">Take a full length MSCEIT style assessment to test your emotional intelligence across all branches.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                        <button
                            onClick={() => onRunModule(Branch.Perceiving)} // Just triggering the main assessment flow for now
                            className="group p-6 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl text-left hover:border-black dark:hover:border-white transition-all shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Standard</span>
                                <span className="text-xs font-bold text-gray-400">141 Questions</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Full Diagnostic Exam</h3>
                            <p className="text-xs text-gray-500 mb-4">Complete comprehensive assessment covering all 4 branches.</p>
                            <div className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white group-hover:underline">Start Exam →</div>
                        </button>

                        <div className="p-6 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
                            <p className="font-bold text-sm mb-1">Timed Mode</p>
                            <p className="text-xs text-gray-400">Coming Soon</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Module Detail Modal Reuse */}
            {selectedModule && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModule(null)}></div>
                    <div className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up p-8">
                        <div className="flex justify-between items-start mb-6">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${BRANCH_META[selectedModule.branch].textColor} bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full`}>
                                {selectedModule.branch}
                            </span>
                            <button onClick={() => setSelectedModule(null)} className="text-gray-400 hover:text-black dark:hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{selectedModule.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm">{selectedModule.description}</p>
                        <button
                            onClick={() => {
                                onRunModule(selectedModule.branch);
                                setSelectedModule(null);
                            }}
                            className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            Start Worksheet
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
