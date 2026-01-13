import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { DS } from '../../design-system';
import { Branch } from '../../types';
import { supabase } from '../../services/supabase';
import { ModuleCardSkeleton } from '../Skeletons';

interface Module {
    id: string;
    title: string;
    description: string;
    branch: Branch;
    duration: string;
    required_level: number;
}

export const AdminClasses: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<'All' | Branch>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [newModule, setNewModule] = useState({
        id: '',
        title: '',
        description: '',
        branch: Branch.Perceiving,
        duration: '10 min',
        required_level: 1
    });

    const branches = ['All', ...Object.values(Branch)];

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('training_modules')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setModules(data);
        setIsLoading(false);
    };

    const filteredModules = useMemo(() => {
        return modules.filter(m => {
            const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBranch = selectedBranch === 'All' || m.branch === selectedBranch;
            return matchesSearch && matchesBranch;
        });
    }, [modules, searchTerm, selectedBranch]);

    const selectedModule = useMemo(() => modules.find(m => m.id === id), [id, modules]);

    const handleCardClick = (moduleId: string) => {
        navigate(`/admin/classes/${moduleId}`);
    };

    const closePanel = () => {
        navigate('/admin/classes');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase
            .from('training_modules')
            .insert([{
                ...newModule,
                id: newModule.id || `t-${Date.now()}`
            }]);

        if (!error) {
            setShowCreateModal(false);
            fetchModules();
            setNewModule({
                id: '',
                title: '',
                description: '',
                branch: Branch.Perceiving,
                duration: '10 min',
                required_level: 1
            });
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 items-center">
                {/* Pill Filters - Now before search */}
                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full lg:w-auto">
                    {branches.map((branch) => (
                        <button
                            key={branch}
                            onClick={() => setSelectedBranch(branch as any)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedBranch === branch
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent shadow-md'
                                : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-100 dark:border-transparent hover:border-gray-300 dark:hover:bg-white/10'
                                }`}
                        >
                            {branch.replace(' Emotions', '')}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Search curriculums..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-dark-nav border border-gray-100 dark:border-white/5 rounded-2xl px-12 py-[14px] text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none leading-none"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full lg:w-auto px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all outline-none"
                >
                    + Create Module
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <ModuleCardSkeleton key={i} />
                    ))
                ) : filteredModules.length > 0 ? (
                    filteredModules.map(module => (
                        <div
                            key={module.id}
                            onClick={() => handleCardClick(module.id)}
                            className="bg-white dark:bg-dark-nav rounded-[24px] p-6 border border-gray-100 dark:border-white/5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">
                                        {module.branch.replace(' Emotions', '')}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">Lvl {module.required_level}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{module.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{module.description}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{module.duration}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[24px] flex flex-col items-center justify-center">
                        <p className="text-gray-500 font-medium mb-4">No modules found for this criteria.</p>
                        <button onClick={() => { setSelectedBranch('All'); setSearchTerm('') }} className="text-sm font-bold text-blue-500 hover:underline">Clear all filters</button>
                    </div>
                )}
            </div>

            {/* Side Panel */}
            {selectedModule && createPortal(
                <>
                    <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-dark-nav shadow-2xl z-[200] transform transition-transform duration-500 ease-out border-l border-gray-100 dark:border-white/10 ${selectedModule ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="h-full flex flex-col p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-md">
                                    {selectedModule.branch}
                                </span>
                                <button onClick={closePanel} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white rounded-full bg-gray-50 dark:bg-white/5 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif leading-tight">{selectedModule.title}</h2>
                            <div className="flex gap-6 mb-8">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedModule.duration}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Complexity</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">Level {selectedModule.required_level}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Module Description</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        {selectedModule.description}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">AI Generation Metadata</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                            <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">Ready for Prod</span>
                                        </div>
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                            <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Version</span>
                                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">v1.2.0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-8 flex gap-3">
                                <button className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">Edit Module</button>
                                <button className="px-6 py-4 border border-red-200 dark:border-red-900/30 text-red-500 rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">Archive</button>
                            </div>
                        </div>
                    </div>

                    {/* Background Backdrop for Side Panel */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[190] animate-fade-in"
                        onClick={closePanel}
                    />
                </>,
                document.body
            )}

            {/* Create Module Modal */}
            {showCreateModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md" onClick={() => setShowCreateModal(false)}></div>
                    <form onSubmit={handleCreate} className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up p-10">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">Create Module</h2>
                                <p className="text-xs text-gray-500 mt-1">Add a new training module to the platform.</p>
                            </div>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition-all rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Module Title</label>
                                <input
                                    required
                                    type="text"
                                    value={newModule.title}
                                    onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                                    placeholder="e.g., Recognizing Facial Expressions"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                <textarea
                                    required
                                    value={newModule.description}
                                    onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                                    placeholder="Describe what this module covers..."
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Branch</label>
                                    <select
                                        value={newModule.branch}
                                        onChange={e => setNewModule({ ...newModule, branch: e.target.value as Branch })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                    >
                                        {Object.values(Branch).map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Required Level</label>
                                    <select
                                        value={newModule.required_level}
                                        onChange={e => setNewModule({ ...newModule, required_level: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                    >
                                        {[1, 2, 3, 4, 5].map(lvl => (
                                            <option key={lvl} value={lvl}>Level {lvl}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Duration</label>
                                <input
                                    type="text"
                                    value={newModule.duration}
                                    onChange={e => setNewModule({ ...newModule, duration: e.target.value })}
                                    placeholder="e.g., 15 min"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 rounded-[200px] border border-gray-200 dark:border-gray-700 font-black text-[10px] uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-4 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Create Module</button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
};

