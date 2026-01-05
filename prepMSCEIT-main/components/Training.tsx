import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TRAINING_MODULES as HARDCODED_MODULES } from '../constants';
import { Branch, TrainingModule, UserStats } from '../types';
import { supabase } from '../services/supabase';
import { KanbanColumnSkeleton, ModuleCardSkeleton } from './Skeletons';

interface TrainingProps {
    stats: UserStats;
    onRunModule?: (branch: Branch) => void;
}

const BRANCH_META = {
    [Branch.Perceiving]: { color: 'bg-blue-400', textColor: 'text-blue-500', icon: '👁️', label: 'Perceiving Emotions' },
    [Branch.Using]: { color: 'bg-purple-400', textColor: 'text-purple-500', icon: '⚡', label: 'Using Emotions' },
    [Branch.Understanding]: { color: 'bg-amber-400', textColor: 'text-amber-500', icon: '🧠', label: 'Understanding Emotions' },
    [Branch.Managing]: { color: 'bg-emerald-400', textColor: 'text-emerald-500', icon: '⚖️', label: 'Managing Emotions' },
};

export const Training: React.FC<TrainingProps> = ({ stats, onRunModule }) => {
    const [selectedBranch, setSelectedBranch] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
    const [activeBranchMobile, setActiveBranchMobile] = useState<number>(1);
    const [dbModules, setDbModules] = useState<TrainingModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchModules = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('training_modules')
                .select('*');
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

    const branches = ['All', ...Object.values(Branch)];

    const filteredModules = useMemo(() => {
        return allModules.filter(module => {
            const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                module.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBranch = selectedBranch === 'All' || module.branch === selectedBranch;
            return matchesSearch && matchesBranch;
        });
    }, [searchTerm, selectedBranch, allModules]);

    const handleStart = () => {
        if (selectedModule && onRunModule) {
            onRunModule(selectedModule.branch);
            setSelectedModule(null);
        }
    };

    const levels = [1, 2, 3, 4, 5];

    const getModulesByLevel = (level: number) => {
        return filteredModules.filter(m => {
            if (level === 1) return m.requiredLevel === 1;
            if (level === 2) return m.requiredLevel >= 4 && m.requiredLevel <= 5;
            if (level === 3) return m.requiredLevel === 6;
            if (level === 4) return m.requiredLevel === 7 || m.requiredLevel === 8;
            if (level === 5) return m.requiredLevel >= 9;
            return false;
        });
    };

    const renderModuleCard = (module: TrainingModule, meta: any) => {
        const mastery = stats.masteryLevels[module.branch];
        const isLocked = (module.requiredLevel || 0) > mastery;

        return (
            <div
                key={module.id}
                onClick={() => !isLocked && setSelectedModule(module)}
                className={`group relative overflow-hidden bg-white dark:bg-transparent border rounded-[24px] p-5 transition-all duration-300 min-h-[160px] flex flex-col justify-between 
                 ${isLocked
                        ? 'opacity-40 cursor-not-allowed border-transparent grayscale'
                        : 'border-transparent dark:border-white/20 cursor-pointer hover:shadow-xl active:scale-[0.98]'
                    }
             `}
            >
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${meta.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-0.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${meta.textColor}`}>
                                {module.branch.replace(' Emotions', '')}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight pr-4">
                                {module.title}
                            </h4>
                        </div>
                        {isLocked ? (
                            <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded-full">
                                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                        ) : (
                            <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">Ready</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mt-1">
                        {module.description}
                    </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100 dark:border-white/5 relative z-10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {isLocked ? `Lvl ${module.requiredLevel} req` : `Module ${module.id.toUpperCase()}`}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        <svg className={`w-3 h-3 ${meta.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {module.duration}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up overflow-hidden">

            {/* Filters Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shrink-0 px-0.5">
                {/* Branch Fillers */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                    {branches.map(branch => (
                        <button
                            key={branch}
                            onClick={() => setSelectedBranch(branch)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                ${selectedBranch === branch
                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/5'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }
                            `}
                        >
                            {branch === 'All' ? 'All Skills' : branch.replace(' Emotions', '')}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search training levels..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[24px] px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            {/* Mobile Level Tabs - Left aligned */}
            <div className="md:hidden mb-6 sticky top-0 z-20 backdrop-blur-xl bg-white/90 dark:bg-black/90 border-b border-gray-100 dark:border-white/5 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-10 px-0.5">
                    {levels.map(level => {
                        const isActive = activeBranchMobile === (level as any);
                        return (
                            <button
                                key={level}
                                onClick={() => setActiveBranchMobile(level as any)}
                                className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Level {level}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-t-full animate-fade-in"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop Kanban View - Grouped by Level */}
            <div className="hidden md:flex flex-1 overflow-x-auto pb-6 -mx-8 px-8 scrollbar-hide">
                <div className="flex gap-6 min-w-max h-full">
                    {isLoading ? (
                        [1, 2, 3, 4, 5].map(level => (
                            <KanbanColumnSkeleton key={level} cardCount={2} />
                        ))
                    ) : (
                        levels.map((level) => {
                            const levelModules = getModulesByLevel(level);
                            const isUnlocked = level === 1 || levelModules.some(m => stats.masteryLevels[m.branch] >= m.requiredLevel);

                            return (
                                <div key={level} className="w-[320px] flex flex-col h-full bg-[#F8F9FD] dark:bg-dark-nav rounded-[24px] p-4 border border-gray-100 dark:border-white/5">
                                    <div className="pb-5 px-1 shrink-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xs">
                                                    L{level}
                                                </div>
                                                <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Level {level}</h3>
                                            </div>
                                            {isUnlocked ? (
                                                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    Unlocked
                                                </span>
                                            ) : (
                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
                                            {levelModules.length} Modules in this Tier
                                        </p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                                        {levelModules.map(module => renderModuleCard(module, BRANCH_META[module.branch]))}
                                        {levelModules.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 mb-3 flex items-center justify-center">
                                                    <span className="text-sm">?</span>
                                                </div>
                                                <p className="text-[10px] uppercase font-bold tracking-widest">More Coming</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Mobile Detail View */}
            <div className="md:hidden flex-1 overflow-y-auto pb-32">
                {(() => {
                    const level = (activeBranchMobile as any) || 1;
                    const levelModules = getModulesByLevel(level);
                    return (
                        <div className="animate-fade-in-up">
                            <div className="bg-[#F8F9FD] dark:bg-dark-nav rounded-[24px] p-6 mb-6 border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xl">
                                        {level}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Level {level}</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{levelModules.length} Modules Available</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {levelModules.map(module => renderModuleCard(module, BRANCH_META[module.branch]))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Module Detail Modal */}
            {selectedModule && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModule(null)}></div>
                    <div className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-white/10 ${BRANCH_META[selectedModule.branch].textColor} px-3 py-1 rounded-full`}>
                                    {selectedModule.branch}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-gray-500 px-3 py-1 rounded-full">
                                    Level {selectedModule.requiredLevel}
                                </span>
                            </div>
                            <button onClick={() => setSelectedModule(null)} className="text-gray-400 hover:text-black dark:hover:text-white p-1.5 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{selectedModule.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm">{selectedModule.description}</p>
                        <div className="flex gap-4">
                            <button onClick={() => setSelectedModule(null)} className="flex-1 py-4 rounded-[200px] border border-gray-200 dark:border-gray-700 font-black text-[10px] uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Defer</button>
                            <button onClick={handleStart} className="flex-1 py-4 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Launch Session</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};