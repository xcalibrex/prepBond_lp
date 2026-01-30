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
    is_live?: boolean;
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
    description?: string;
    duration?: string;
    created_at?: string;
    is_live?: boolean;
}

export const AdminClasses: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Module handling
    const [availableModules, setAvailableModules] = useState<TrainingModule[]>([]);
    const [moduleSearchTerm, setModuleSearchTerm] = useState('');
    const [isCreatingModule, setIsCreatingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [editingClassId, setEditingClassId] = useState<string | null>(null);

    // New: Module View State
    const [viewMode, setViewMode] = useState<'classes' | 'modules'>('classes');
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [selectedModuleFilter, setSelectedModuleFilter] = useState<string | null>(null);
    const [newModule, setNewModule] = useState({
        title: '',
        description: '',
        branch: Branch.Perceiving,
        duration: '10 min',
        is_live: false
    });

    // Form state
    const [newClass, setNewClass] = useState<{
        title: string;
        description: string;
        branch: string;
        duration: string;
        video_url: string;
        selectedModuleId: string | null;
        is_live: boolean;
    }>({
        title: '',
        description: '',
        branch: Branch.Perceiving, // Default
        duration: '10 min',
        video_url: '',
        selectedModuleId: null,
        is_live: false
    });



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
            .select('*')
            .order('created_at', { ascending: false });

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
            // Branch filter removed from UI, defaulting to All effectively
            // const matchesBranch = selectedBranchFilter === 'All' || c.branch === selectedBranchFilter;
            const matchesModule = !selectedModuleFilter || c.module_id === selectedModuleFilter || c.training_modules?.id === selectedModuleFilter;
            return matchesSearch && matchesModule;
        });
    }, [classes, searchTerm, selectedModuleFilter]);

    const selectedClass = useMemo(() => classes.find(c => c.id === id), [id, classes]);

    // Filter modules for the Class creation modal
    const filteredModules = useMemo(() => {
        return availableModules.filter(m =>
            m.title.toLowerCase().includes(moduleSearchTerm.toLowerCase())
        );
    }, [availableModules, moduleSearchTerm]);

    // Modules for the grid view (uses main search)
    const modulesForGrid = useMemo(() => {
        return availableModules.filter(m => {
            const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [availableModules, searchTerm]);

    // Class counts per module
    const moduleStats = useMemo(() => {
        const stats: Record<string, number> = {};
        classes.forEach(c => {
            const mid = c.module_id || c.training_modules?.id;
            if (mid) {
                stats[mid] = (stats[mid] || 0) + 1;
            }
        });
        return stats;
    }, [classes]);

    const selectedModule = useMemo(() => availableModules.find(m => m.id === selectedModuleId), [availableModules, selectedModuleId]);

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

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            if (url.includes('/embed/')) return url;
            const videoId = url.includes('v=')
                ? url.split('v=')[1]?.split('&')[0]
                : url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com')) {
            if (url.includes('player.vimeo.com')) return url;
            const videoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!newClass.title || !newClass.video_url || !newClass.branch || !newClass.selectedModuleId) {
            alert('Please fill in all required fields, including selecting a Module.');
            return;
        }

        // Auto-convert to embed URL
        const finalVideoUrl = getEmbedUrl(newClass.video_url);

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
                    video_url: finalVideoUrl,
                    module_id: newClass.selectedModuleId,
                    is_live: newClass.is_live
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
                    video_url: finalVideoUrl,
                    module_id: newClass.selectedModuleId,
                    is_live: newClass.is_live
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
            selectedModuleId: selectedClass.module_id || (selectedClass.training_modules?.id ?? null),
            is_live: selectedClass.is_live || false
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
            selectedModuleId: null,
            is_live: false
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

    // Module CRUD
    const openModulePanel = (moduleId: string) => {
        setSelectedModuleId(moduleId);
    };

    const closeModulePanel = () => {
        setSelectedModuleId(null);
    };

    const openModuleModal = (module?: TrainingModule) => {
        if (module) {
            setNewModule({
                title: module.title,
                description: module.description || '',
                branch: module.branch as Branch,
                duration: module.duration || '10 min',
                is_live: module.is_live || false
            });
            setEditingModuleId(module.id);
        } else {
            setNewModule({
                title: '',
                description: '',
                branch: Branch.Perceiving,
                duration: '10 min',
                is_live: false
            });
            setEditingModuleId(null);
        }
        setShowModuleModal(true);
    };

    const closeModuleModal = () => {
        setShowModuleModal(false);
        setEditingModuleId(null);
        setNewModule({
            title: '',
            description: '',
            branch: Branch.Perceiving,
            duration: '10 min',
            is_live: false
        });
    };

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();

        const moduleData = {
            title: newModule.title,
            description: newModule.description,
            branch: newModule.branch,
            duration: newModule.duration,
            is_live: newModule.is_live
        };

        let result;
        if (editingModuleId) {
            result = await supabase
                .from('training_modules')
                .update(moduleData)
                .eq('id', editingModuleId)
                .select()
                .single();
        } else {
            result = await supabase
                .from('training_modules')
                .insert([moduleData])
                .select()
                .single();
        }

        if (result.error) {
            console.error('Error saving module:', result.error);
            alert('Failed to save module');
        } else if (result.data) {
            if (editingModuleId) {
                setAvailableModules(prev => prev.map(m => m.id === editingModuleId ? result.data : m));
            } else {
                setAvailableModules(prev => [result.data, ...prev]);
            }
            closeModuleModal();
        }
    };

    const handleDeleteModule = async () => {
        if (!selectedModuleId) return;
        if (window.confirm('Are you sure? This will NOT delete associated classes, but unlink them.')) {
            const { error } = await supabase
                .from('training_modules')
                .delete()
                .eq('id', selectedModuleId);

            if (error) {
                console.error('Error deleting module:', error);
                alert('Failed to delete module');
            } else {
                setAvailableModules(prev => prev.filter(m => m.id !== selectedModuleId));
                setSelectedModuleId(null);
            }
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up">


            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 items-center">
                {/* View Mode Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-2xl p-1 w-full lg:w-auto">
                    <button
                        onClick={() => setViewMode('classes')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'classes'
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Classes
                    </button>
                    <button
                        onClick={() => setViewMode('modules')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'modules'
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Modules
                        <span className="ml-2 text-[10px] bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                            {availableModules.length}
                        </span>
                    </button>
                </div>

                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder={viewMode === 'classes' ? 'Search classes...' : 'Search modules...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-dark-nav border border-gray-100 dark:border-white/5 rounded-2xl px-12 py-[14px] text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none leading-none"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <button
                    onClick={() => viewMode === 'classes' ? setShowCreateModal(true) : openModuleModal()}
                    className="w-full lg:w-auto px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all outline-none"
                >
                    + Add {viewMode === 'classes' ? 'Class' : 'Module'}
                </button>
            </div>

            {/* Main Content Area */}
            <div className={`flex gap-6 ${viewMode === 'classes' ? '' : ''}`}>
                {/* Side Sub-Nav for Module Filtering (Classes View Only) */}
                {viewMode === 'classes' && (
                    <div className="hidden lg:block w-56 flex-shrink-0">
                        <div className="sticky top-4 space-y-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-3">Filter by Module</h4>
                            <button
                                onClick={() => setSelectedModuleFilter(null)}
                                className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${!selectedModuleFilter
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span>All Modules</span>
                                <span className="text-[10px] opacity-60">({availableModules.length})</span>
                            </button>
                            {availableModules.map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => setSelectedModuleFilter(mod.id)}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${selectedModuleFilter === mod.id
                                        ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className="line-clamp-1 text-left flex-1 mr-2">{mod.title}</span>
                                    <span className="text-[10px] opacity-60">({moduleStats[mod.id] || 0})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className={`grid grid-cols-1 ${viewMode === 'classes' ? 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6 flex-1`}>
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <ModuleCardSkeleton key={i} />
                        ))
                    ) : viewMode === 'classes' ? (
                        // Classes Grid
                        filteredClasses.length > 0 ? (
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
                                <button onClick={() => { setSearchTerm('') }} className="text-sm font-bold text-blue-500 hover:underline">Clear search</button>
                            </div>
                        )
                    ) : (
                        // Modules Grid
                        modulesForGrid.length > 0 ? (
                            modulesForGrid.map(mod => (
                                <div
                                    key={mod.id}
                                    onClick={() => openModulePanel(mod.id)}
                                    className="bg-white dark:bg-dark-nav rounded-[24px] p-6 border border-gray-100 dark:border-white/5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-md">
                                                {mod.branch.replace(' Emotions', '')}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md">
                                                {moduleStats[mod.id] || 0} Classes
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{mod.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{mod.description || 'No description'}</p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{mod.duration || 'N/A'}</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[24px] flex flex-col items-center justify-center">
                                <p className="text-gray-500 font-medium mb-4">No modules found for this criteria.</p>
                                <button onClick={() => { setSearchTerm('') }} className="text-sm font-bold text-blue-500 hover:underline">Clear search</button>
                            </div>
                        )
                    )}
                </div>
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

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                                <div>
                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Publish to Students</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Make this class visible on the student dashboard</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNewClass({ ...newClass, is_live: !newClass.is_live })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${newClass.is_live ? 'bg-green-500' : 'bg-gray-300 dark:bg-white/20'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${newClass.is_live ? 'translate-x-6' : ''}`} />
                                </button>
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

            {/* Module Side Panel */}
            {selectedModule && createPortal(
                <>
                    <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-dark-nav shadow-2xl z-[200] transform transition-transform duration-500 ease-out border-l border-gray-100 dark:border-white/10 translate-x-0`}>
                        <div className="h-full flex flex-col p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-md">
                                    {selectedModule.branch}
                                </span>
                                <button onClick={closeModulePanel} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white rounded-full bg-gray-50 dark:bg-white/5 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-serif leading-tight">{selectedModule.title}</h2>

                            <div className="flex gap-4 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-bold text-gray-900 dark:text-white">{moduleStats[selectedModule.id] || 0}</span> Classes
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedModule.duration || 'N/A'}</span> Duration
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        {selectedModule.description || 'No description provided.'}
                                    </p>
                                </div>

                                {/* Classes in this module */}
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Classes in this Module</h4>
                                    <div className="space-y-2">
                                        {classes.filter(c => c.module_id === selectedModule.id || c.training_modules?.id === selectedModule.id).map(cls => (
                                            <div
                                                key={cls.id}
                                                onClick={() => { closeModulePanel(); handleCardClick(cls.id); setViewMode('classes'); }}
                                                className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                                            >
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{cls.title}</p>
                                                <p className="text-xs text-gray-500">{cls.duration}</p>
                                            </div>
                                        ))}
                                        {(moduleStats[selectedModule.id] || 0) === 0 && (
                                            <p className="text-xs text-gray-400 italic">No classes in this module yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-8 flex gap-3">
                                <button onClick={() => openModuleModal(selectedModule)} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">Edit Module</button>
                                <button onClick={handleDeleteModule} className="px-6 py-4 border border-red-200 dark:border-red-900/30 text-red-500 rounded-[200px] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">Delete</button>
                            </div>
                        </div>
                    </div>

                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[190] animate-fade-in"
                        onClick={closeModulePanel}
                    />
                </>,
                document.body
            )}

            {/* Create/Edit Module Modal */}
            {showModuleModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md" onClick={closeModuleModal}></div>
                    <form onSubmit={handleSaveModule} className="relative bg-white dark:bg-dark-nav border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up p-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">{editingModuleId ? 'Edit Module' : 'Add New Module'}</h2>
                                <p className="text-xs text-gray-500 mt-1">{editingModuleId ? 'Update existing module details.' : 'Create a new training module.'}</p>
                            </div>
                            <button type="button" onClick={closeModuleModal} className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition-all rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
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
                                    placeholder="e.g., Advanced Facial Symmetry"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                            </div>

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
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Duration</label>
                                <input
                                    type="text"
                                    value={newModule.duration}
                                    onChange={e => setNewModule({ ...newModule, duration: e.target.value })}
                                    placeholder="e.g., 15 min"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                <textarea
                                    value={newModule.description}
                                    onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                                    placeholder="Describe what this module covers..."
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                                <div>
                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Publish to Students</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Make this module visible on the student dashboard</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNewModule({ ...newModule, is_live: !newModule.is_live })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${newModule.is_live ? 'bg-green-500' : 'bg-gray-300 dark:bg-white/20'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${newModule.is_live ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={closeModuleModal} className="flex-1 py-4 rounded-[200px] border border-gray-200 dark:border-gray-700 font-black text-[10px] uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-4 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">{editingModuleId ? 'Save Changes' : 'Create Module'}</button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
};
