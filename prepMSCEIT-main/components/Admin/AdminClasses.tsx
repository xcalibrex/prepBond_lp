import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { DS } from '../../design-system';
import { Branch } from '../../types';
import { supabase } from '../../services/supabase';

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
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-dark-nav rounded-[24px] h-[200px] border border-gray-100 dark:border-white/5 animate-pulse"></div>
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
        </div>
    );
};

