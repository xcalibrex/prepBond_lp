import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TRAINING_MODULES } from '../constants';
import { Branch, TrainingModule, UserStats } from '../types';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [activeBranchMobile, setActiveBranchMobile] = useState<Branch>(Branch.Perceiving);

  const branches = Object.values(Branch);

  const filteredModules = useMemo(() => {
      return TRAINING_MODULES.filter(module => {
          const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                module.description.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
      });
  }, [searchTerm]);

  const handleStart = () => {
      if (selectedModule && onRunModule) {
          onRunModule(selectedModule.branch);
          setSelectedModule(null);
      }
  };

  const renderModuleCard = (module: TrainingModule, mastery: number, meta: any) => {
    const isLocked = (module.requiredLevel || 0) > mastery;
    return (
        <div 
             key={module.id} 
             onClick={() => !isLocked && setSelectedModule(module)}
             className={`group relative overflow-hidden bg-white dark:bg-black border rounded-2xl p-5 transition-all duration-300 min-h-[160px] flex flex-col justify-between 
                 ${isLocked 
                     ? 'opacity-40 cursor-not-allowed border-transparent grayscale' 
                     : 'border-transparent dark:border-white/5 cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]'
                 }
             `}
        >
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${meta.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight pr-4">
                        {module.title}
                    </h4>
                    {isLocked ? (
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    ) : (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Unlocked</span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {module.description}
                </p>
            </div>
            <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100 dark:border-white/5 relative z-10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {isLocked ? `Required: Lvl ${module.requiredLevel}` : `ID: ${module.id}`}
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
    <div className="flex flex-col h-full animate-fade-in-up">
       
       {/* Filters Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shrink-0 px-0.5">
         <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Curriculum</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Progress through 10 Tiers of Consensus Mastery.</p>
         </div>
         <div className="relative group w-full md:w-80">
            <input 
                type="text" 
                placeholder="Search training tiers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
            />
            <svg className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </div>
       </div>

       {/* Branch Tabs for Mobile - Left aligned, No button padding, snug underline */}
       <div className="md:hidden mb-6 sticky top-0 z-20 backdrop-blur-xl bg-white/90 dark:bg-black/90 border-b border-gray-100 dark:border-white/5 overflow-x-auto scrollbar-hide">
           <div className="flex items-center gap-6 px-0.5">
               {branches.map(branch => {
                   const isActive = activeBranchMobile === branch;
                   const label = branch.split(' ')[0];
                   return (
                       <button 
                            key={branch}
                            onClick={() => setActiveBranchMobile(branch)}
                            className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                       >
                           {label}
                           {isActive && (
                               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-t-full animate-fade-in"></div>
                           )}
                       </button>
                   );
               })}
           </div>
       </div>

       {/* Desktop Kanban View */}
       <div className="hidden md:flex flex-1 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide h-full">
           <div className="flex gap-6 min-w-max h-full">
               {branches.map((branch) => {
                   const branchModules = filteredModules.filter(m => m.branch === branch);
                   const meta = BRANCH_META[branch];
                   const mastery = stats.masteryLevels[branch];
                   const alignment = stats.scores[branch];
                   return (
                       <div key={branch} className="w-80 flex flex-col h-full bg-[#F3F4F6]/30 dark:bg-white/5 rounded-3xl p-3">
                           <div className="pb-4 px-2">
                               <div className="flex items-center gap-2 mb-2">
                                   <span className="text-lg">{meta.icon}</span>
                                   <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">{meta.label.split(' ')[0]}</h3>
                                   <div className="ml-auto flex items-center gap-1 bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm">
                                       Lvl {mastery}
                                   </div>
                               </div>
                               <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                   <div className={`h-full ${meta.color}`} style={{ width: `${alignment}%` }}></div>
                               </div>
                           </div>
                           <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                               {branchModules.map(module => renderModuleCard(module, mastery, meta))}
                           </div>
                       </div>
                   );
               })}
           </div>
       </div>

       {/* Mobile Branch Detail View */}
       <div className="md:hidden flex-1 overflow-y-auto pb-32">
           {(() => {
               const branch = activeBranchMobile;
               const meta = BRANCH_META[branch];
               const branchModules = filteredModules.filter(m => m.branch === branch);
               const mastery = stats.masteryLevels[branch];
               const alignment = stats.scores[branch];
               return (
                   <div className="animate-fade-in-up">
                       <div className="bg-[#F3F4F6]/30 dark:bg-white/5 rounded-3xl p-6 mb-6">
                           <div className="flex items-center gap-3 mb-4">
                               <span className="text-3xl">{meta.icon}</span>
                               <div>
                                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">{meta.label}</h3>
                                   <p className="text-xs text-gray-500">Tier Training Overview</p>
                               </div>
                               <div className="ml-auto bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-xl text-xs font-black">
                                   Lvl {mastery}
                               </div>
                           </div>
                           <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-tight">
                               <span>Mastery Alignment</span>
                               <span>{alignment}%</span>
                           </div>
                           <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                               <div className={`h-full ${meta.color}`} style={{ width: `${alignment}%` }}></div>
                           </div>
                       </div>
                       <div className="space-y-4">
                           {branchModules.map(module => renderModuleCard(module, mastery, meta))}
                       </div>
                   </div>
               );
           })()}
       </div>

       {/* Module Detail Modal */}
       {selectedModule && createPortal(
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModule(null)}></div>
               <div className="relative bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up p-8">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                            {selectedModule.branch}
                        </span>
                        <button onClick={() => setSelectedModule(null)} className="text-gray-400 hover:text-black dark:hover:text-white p-1.5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{selectedModule.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm">{selectedModule.description}</p>
                    <div className="flex gap-4">
                        <button onClick={() => setSelectedModule(null)} className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-700 dark:text-gray-300">Defer</button>
                        <button onClick={handleStart} className="flex-1 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs shadow-lg">Launch</button>
                    </div>
               </div>
           </div>,
           document.body
       )}
    </div>
  );
};