import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { DS } from '../../design-system';
import { Branch } from '../../types';
import { supabase } from '../../services/supabase';
import { ModuleCardSkeleton } from '../Skeletons';

// Matched to 'classes' table
interface ClassSession {
    id: string;
    title: string;
    description: string;
    video_url: string;
    duration: string;
    branch: string; // Renamed from module
    module_id?: string | null;
    created_at?: string;
    training_modules?: {
        id: string;
        title: string;
        branch: string;
    } | null;
}

interface TrainingModule {
    id: string;
    title: string;
    branch: string;
}

export const AdminClasses: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Module handling
    const [availableModules, setAvailableModules] = useState<TrainingModule[]>([]);
    const [moduleSearchTerm, setModuleSearchTerm] = useState('');
    const [isCreatingModule, setIsCreatingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [editingClassId, setEditingClassId] = useState<string | null>(null);

    // Form state
    const [newClass, setNewClass] = useState<{
        title: string;
        description: string;
        branch: string;
        duration: string;
        video_url: string;
        selectedModuleId: string | null;
    }>({
        title: '',
        description: '',
        branch: Branch.Perceiving, // Default
        duration: '10 min',
        video_url: '',
        selectedModuleId: null
    });

    const branchOptions = ['All', ...Object.values(Branch)];

    useEffect(() => {
        fetchClasses();
        fetchModules();
    }, []);

    const fetchClasses = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*, training_modules (id, title, branch)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching classes:', error);
        } else if (data) {
            setClasses(data);
        }
        setIsLoading(false);
    };

    const fetchModules = async () => {
        const { data, error } = await supabase
            .from('training_modules')
            .select('id, title, branch');

        if (error) {
            console.error('Error fetching modules:', error);
        } else if (data) {
            setAvailableModules(data);
        }
    };

    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBranch = selectedBranchFilter === 'All' || c.branch === selectedBranchFilter;
            return matchesSearch && matchesBranch;
        });
    }, [classes, searchTerm, selectedBranchFilter]);

    const selectedClass = useMemo(() => classes.find(c => c.id === id), [id, classes]);

    // Filter modules based on search and selected branch
    const filteredModules = useMemo(() => {
        return availableModules.filter(m =>
            m.title.toLowerCase().includes(moduleSearchTerm.toLowerCase()) &&
            (newClass.branch ? m.branch === newClass.branch : true)
        );
    }, [availableModules, moduleSearchTerm, newClass.branch]);

    const handleCardClick = (classId: string) => {
        navigate(`/admin/classes/${classId}`);
    };

    const closePanel = () => {
        navigate('/admin/classes');
    };

    const createNewModule = async () => {
        if (!newModuleTitle.trim()) return;

        const moduleId = crypto.randomUUID();

        const { data, error } = await supabase
            .from('training_modules')
            .insert([{
                id: moduleId,
                title: newModuleTitle,
                branch: newClass.branch,
                duration: '10m', // Default
                description: 'Created from Classes view'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating module:', error);
            alert('Failed to create module');
        } else if (data) {
            setAvailableModules([...availableModules, data]);
            setNewClass(prev => ({
                ...prev,
                selectedModuleId: data.id
            }));
            setNewModuleTitle('');
            setIsCreatingModule(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!newClass.title || !newClass.video_url || !newClass.branch || !newClass.selectedModuleId) {
            alert('Please fill in all required fields, including selecting a Module.');
            return;
        }

        let error;

        if (editingClassId) {
            // UPDATE existing class
            const { error: updateError } = await supabase
                .from('classes')
                .update({
                    title: newClass.title,
                    description: newClass.description,
                    branch: newClass.branch,
                    duration: newClass.duration,
                    video_url: newClass.video_url,
                    module_id: newClass.selectedModuleId
                })
                .eq('id', editingClassId);
            error = updateError;
        } else {
            // INSERT new class
            const { error: insertError } = await supabase
                .from('classes')
                .insert([{
                    title: newClass.title,
                    description: newClass.description,
                    branch: newClass.branch,
                    duration: newClass.duration,
                    video_url: newClass.video_url,
                    module_id: newClass.selectedModuleId
                }]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving class:', error);
            alert('Failed to save class');
            return;
        }

        closeModal();
        fetchClasses();
        if (editingClassId) {
            // If we were editing, we should probably close the side panel or refresh it?
            // For now, let's just close the modal. The user might want to still see the panel.
            // But the panel data needs to refresh. fetchClasses updates 'classes' state,
            // and 'selectedClass' is derived from it, so it should auto-update!
        }
    };

    const openEditModal = () => {
        if (!selectedClass) return;
        setNewClass({
            title: selectedClass.title,
            description: selectedClass.description,
            branch: selectedClass.branch,
            duration: selectedClass.duration,
            video_url: selectedClass.video_url,
            selectedModuleId: selectedClass.module_id || (selectedClass.training_modules?.id ?? null)
        });
        setEditingClassId(selectedClass.id);
        setShowCreateModal(true);
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingClassId(null);
        // Reset form
        setNewClass({
            title: '',
            description: '',
            branch: Branch.Perceiving,
            duration: '10 min',
            video_url: '',
            selectedModuleId: null
        });
    };

    const handleDelete = async () => {
        if (!selectedClass) return;
        if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', selectedClass.id);

            if (error) {
                console.error('Error deleting class:', error);
                alert('Failed to delete class');
            } else {
                navigate('/admin/classes');
                fetchClasses();
            }
        }
    };

    const selectModule = (moduleId: string) => {
        setNewClass(prev => ({ ...prev, selectedModuleId: moduleId }));
        setModuleSearchTerm(''); // Clear search on selection
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 items-center">
                {/* Pill Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full lg:w-auto">
                    {branchOptions.map((br) => (
                        <button
                            key={br}
                            onClick={() => setSelectedBranchFilter(br)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedBranchFilter === br
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent shadow-md'
                                : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-100 dark:border-transparent hover:border-gray-300 dark:hover:bg-white/10'
                                }`}
                        >
                            {br.replace(' Emotions', '')}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Search classes..."
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
                    + Add Class
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <ModuleCardSkeleton key={i} />
                    ))
                ) : filteredClasses.length > 0 ? (
                    filteredClasses.map(cls => (
                        <div
                            key={cls.id}
                            onClick={() => handleCardClick(cls.id)}
                            className="bg-white dark:bg-dark-nav rounded-[24px] p-6 border border-gray-100 dark:border-white/5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">
                                        {cls.branch.replace(' Emotions', '')}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{cls.title}</h3>
                                {cls.training_modules?.title && (
                                    <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                        {cls.training_modules.title}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{cls.description}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cls.duration}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[24px] flex flex-col items-center justify-center">
                        <p className="text-gray-500 font-medium mb-4">No classes found for this criteria.</p>
                        <button onClick={() => { setSelectedBranchFilter('All'); setSearchTerm('') }} className="text-sm font-bold text-blue-500 hover:underline">Clear all filters</button>
                    </div>
                )}
            </div>

            {/* Side Panel */}
            {selectedClass && createPortal(
                <>
                    <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-dark-nav shadow-2xl z-[200] transform transition-transform duration-500 ease-out border-l border-gray-100 dark:border-white/10 ${selectedClass ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="h-full flex flex-col p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-md">
                                    {selectedClass.branch}
                                </span>
                                <button onClick={closePanel} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white rounded-full bg-gray-50 dark:bg-white/5 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-serif leading-tight">{selectedClass.title}</h2>
                            {selectedClass.training_modules?.title && (
                                <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wide">
                                    Module: {selectedClass.training_modules.title}
                                </p>
                            )}

                            <div className="flex gap-6 mb-8">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedClass.duration}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        {selectedClass.description}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Video Source</h4>
                                    <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                        <a href={selectedClass.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all">
                                            {selectedClass.video_url}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-8 flex gap-3">
                                <button onClick={openEditModal} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">Edit Class</button>
                                <button onClick={handleDelete} className="px-6 py-4 border border-red-200 dark:border-red-900/30 text-red-500 rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">Delete</button>
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

            {/* Create Class Modal */}
            {showCreateModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md" onClick={closeModal}></div>
                    <form onSubmit={handleCreate} className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up p-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">{editingClassId ? 'Edit Class' : 'Add New Class'}</h2>
                                <p className="text-xs text-gray-500 mt-1">{editingClassId ? 'Update existing class details.' : 'Create a new learning session for students.'}</p>
                            </div>
                            <button type="button" onClick={closeModal} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition-all rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Class Title</label>
                                <input
                                    required
                                    type="text"
                                    value={newClass.title}
                                    onChange={e => setNewClass({ ...newClass, title: e.target.value })}
                                    placeholder="e.g., Understanding Micro-expressions"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                            </div>

                            {/* Branch Selector */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Branch</label>
                                <select
                                    value={newClass.branch}
                                    onChange={e => setNewClass({ ...newClass, branch: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                >
                                    {Object.values(Branch).map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Module Selector & Creator */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Module</label>
                                <div className="border border-gray-100 dark:border-white/10 rounded-2xl p-4 bg-gray-50 dark:bg-white/5">
                                    {/* Selected Module Tag */}
                                    {newClass.selectedModuleId && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(() => {
                                                const m = availableModules.find(am => am.id === newClass.selectedModuleId);
                                                return m ? (
                                                    <span key={m.id} className="text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-2">
                                                        {m.title}
                                                        <span
                                                            onClick={() => setNewClass(prev => ({ ...prev, selectedModuleId: null }))}
                                                            className="text-base leading-none cursor-pointer hover:text-red-500"
                                                        >&times;</span>
                                                    </span>
                                                ) : null;
                                            })()}
                                        </div>
                                    )}
                                    {!newClass.selectedModuleId && (
                                        <p className="text-gray-400 text-xs italic mb-4">No module selected.</p>
                                    )}

                                    {/* Search / Add New */}
                                    {!isCreatingModule ? (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search or add module..."
                                                value={moduleSearchTerm}
                                                onChange={e => setModuleSearchTerm(e.target.value)}
                                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500"
                                            />
                                            {/* Results Dropdown */}
                                            {moduleSearchTerm && (
                                                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl z-50 max-h-40 overflow-y-auto">
                                                    {filteredModules.map(m => (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => selectModule(m.id)}
                                                            className={`px-4 py-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center ${newClass.selectedModuleId === m.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}
                                                        >
                                                            <span>{m.title}</span>
                                                            {newClass.selectedModuleId === m.id && <span>✓</span>}
                                                        </div>
                                                    ))}
                                                    <div
                                                        onClick={() => setIsCreatingModule(true)}
                                                        className="px-4 py-2 text-xs font-bold text-blue-500 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-800"
                                                    >
                                                        + Create "{moduleSearchTerm}"
                                                    </div>
                                                </div>
                                            )}
                                            {!moduleSearchTerm && !newClass.selectedModuleId && (
                                                <button type="button" onClick={() => setIsCreatingModule(true)} className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-600">+ Create new module</button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 items-center animate-fade-in">
                                            <input
                                                type="text"
                                                placeholder="New Module Title"
                                                value={newModuleTitle}
                                                onChange={e => setNewModuleTitle(e.target.value)}
                                                className="flex-1 bg-white dark:bg-black/20 border border-blue-500 rounded-xl px-4 py-2.5 text-xs outline-none"
                                                autoFocus
                                            />
                                            <button type="button" onClick={createNewModule} className="bg-blue-500 text-white p-2 rounded-xl text-xs font-bold whitespace-nowrap">Save</button>
                                            <button type="button" onClick={() => { setIsCreatingModule(false); setNewModuleTitle(''); }} className="text-gray-400 p-2 hover:text-gray-600">✕</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Video URL (YouTube/Embed)</label>
                                <input
                                    required
                                    type="text"
                                    value={newClass.video_url}
                                    onChange={e => setNewClass({ ...newClass, video_url: e.target.value })}
                                    placeholder="https://www.youtube.com/embed/..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 px-1">Must be an embeddable URL.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Duration</label>
                                    <input
                                        type="text"
                                        value={newClass.duration}
                                        onChange={e => setNewClass({ ...newClass, duration: e.target.value })}
                                        placeholder="e.g., 15 min"
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                <textarea
                                    required
                                    value={newClass.description}
                                    onChange={e => setNewClass({ ...newClass, description: e.target.value })}
                                    placeholder="Describe what this class covers..."
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={closeModal} className="flex-1 py-4 rounded-[200px] border border-gray-200 dark:border-gray-700 font-black text-[10px] uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-4 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">{editingClassId ? 'Save Changes' : 'Create Class'}</button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
};
