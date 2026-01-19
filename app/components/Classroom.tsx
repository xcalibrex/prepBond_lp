import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface ClassSession {
    id: string;
    title: string;
    description: string;
    video_url: string;
    duration: string;
    thumbnail?: string;
    isCompleted?: boolean;
}

interface Module {
    title: string;
    lessons: ClassSession[];
}

export const Classroom: React.FC = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0 });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Classes (only live ones)
            const { data: classesData, error: classesError } = await supabase
                .from('classes')
                .select('*')
                .eq('is_live', true)
                .order('created_at', { ascending: true });

            if (classesError) throw classesError;

            // 2. Fetch User Completions
            const { data: completionsData, error: completionsError } = await supabase
                .from('class_completions')
                .select('class_id');

            if (completionsError) throw completionsError;

            const completedIds = new Set(completionsData?.map((c: any) => c.class_id));

            // 3. Group by Module
            const grouped: Record<string, ClassSession[]> = {};
            let firstClass: ClassSession | null = null;
            let totalCount = 0;

            classesData?.forEach((cls: any) => {
                const session: ClassSession = {
                    id: cls.id,
                    title: cls.title,
                    description: cls.description,
                    video_url: cls.video_url,
                    duration: cls.duration,
                    isCompleted: completedIds.has(cls.id)
                };

                if (!grouped[cls.branch]) {
                    grouped[cls.branch] = [];
                }
                grouped[cls.branch].push(session);

                if (!firstClass) firstClass = session;
                totalCount++;
            });

            const modulesList: Module[] = Object.keys(grouped).map(moduleTitle => ({
                title: moduleTitle,
                lessons: grouped[moduleTitle]
            }));

            setModules(modulesList);

            // Set initial state only if not already set or logic requires reset
            // If selectedClass is null, select the first one found
            if (!selectedClass && firstClass) {
                // If we're setting the first class, we also want to expand its module
                const firstModuleTitle = classesData?.[0]?.branch;
                if (firstModuleTitle) {
                    setExpandedModules([firstModuleTitle]);
                }
                setSelectedClass(firstClass);
            } else if (selectedClass) {
                // If we already have a selected class, we want to update its 'isCompleted' status
                // from the fresh data we just fetched.
                const isStillCompleted = completedIds.has(selectedClass.id);
                if (selectedClass.isCompleted !== isStillCompleted) {
                    setSelectedClass(prev => prev ? ({ ...prev, isCompleted: isStillCompleted }) : null);
                }
            }

            setStats({
                total: totalCount,
                completed: completedIds.size
            });

        } catch (error) {
            console.error('Error fetching classroom data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedClass]); // Depend on selectedClass so we can preserve selection logic if needed, but mainly we want to run this on mount.
    // Actually, depending on selectedClass might cause loops if not careful. 
    // Let's remove selectedClass from dep array and handle updates carefully inside.

    useEffect(() => {
        // Initial fetch
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleModule = (moduleTitle: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleTitle)
                ? prev.filter(t => t !== moduleTitle)
                : [...prev, moduleTitle]
        );
    };

    const handleMarkComplete = async () => {
        if (!selectedClass) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (selectedClass.isCompleted) {
                // Optional: Allow un-completing? For now, request didn't specify, so stick to completing.
                return;
            }

            const { error } = await supabase
                .from('class_completions')
                .insert({
                    user_id: user.id,
                    class_id: selectedClass.id
                });

            if (error) throw error;

            // Optimistic update
            const updatedClass = { ...selectedClass, isCompleted: true };
            setSelectedClass(updatedClass);

            setModules(prevModules => prevModules.map(m => ({
                ...m,
                lessons: m.lessons.map(l => l.id === selectedClass.id ? { ...l, isCompleted: true } : l)
            })));

            setStats(prev => ({ ...prev, completed: prev.completed + 1 }));

        } catch (error) {
            console.error('Error completing class:', error);
        }
    };

    if (isLoading && modules.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-140px)] animate-fade-in">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading Classroom...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-6 animate-fade-in-up">
            {/* Left Sidebar: Class List */}
            <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-dark-nav rounded-[24px] border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Classroom</h2>
                        <p className="text-xs text-gray-500 mt-1">Select a session to watch</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-black dark:text-white leading-none">{stats.completed}/{stats.total}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Completed</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {modules.map((module) => (
                        <div key={module.title} className="space-y-2">
                            {/* Module Header */}
                            <button
                                onClick={() => toggleModule(module.title)}
                                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                        <svg className={`w-4 h-4 transform transition-transform ${expandedModules.includes(module.title) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                    <div className="flex flex-col items-start text-left">
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{module.title}</h3>
                                        <p className="text-[10px] text-gray-400">{module.lessons.length} Lessons</p>
                                    </div>
                                </div>
                            </button>

                            {/* Module Lessons */}
                            {expandedModules.includes(module.title) && (
                                <div className="space-y-2 pl-4 border-l border-gray-100 dark:border-white/5 ml-3">
                                    {module.lessons.map((session) => (
                                        <button
                                            key={session.id}
                                            onClick={() => setSelectedClass(session)}
                                            className={`w-full text-left p-3 rounded-xl transition-all border group ${selectedClass?.id === session.id
                                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md'
                                                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedClass?.id === session.id ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400'}`}>
                                                    Lesson
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {session.isCompleted && (
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${selectedClass?.id === session.id ? 'bg-white/20 text-white dark:text-black dark:bg-black/10' : 'bg-emerald-100 text-emerald-600'}`}>
                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    )}
                                                    <span className={`text-[9px] font-bold ${selectedClass?.id === session.id ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`}>
                                                        {session.duration}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-xs leading-tight line-clamp-2">{session.title}</h3>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Content: Video Player */}
            <div className="w-full md:w-2/3 flex flex-col bg-white dark:bg-dark-nav rounded-[24px] border border-gray-100 dark:border-white/5 overflow-hidden">
                {selectedClass ? (
                    <>
                        <div className="relative aspect-video w-full bg-black">
                            <iframe
                                src={selectedClass.video_url}
                                title={selectedClass.title}
                                className="absolute inset-0 w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="p-8 flex-1 overflow-y-auto">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black dark:bg-white dark:text-black px-3 py-1 rounded-full">
                                        Now Playing
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">{selectedClass.duration}</span>
                                </div>

                                <button
                                    onClick={handleMarkComplete}
                                    disabled={selectedClass.isCompleted}
                                    className={`
                                        flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all
                                        ${selectedClass.isCompleted
                                            ? 'bg-emerald-100 text-emerald-700 cursor-default dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 active:scale-95 shadow-lg'
                                        }
                                    `}
                                >
                                    {selectedClass.isCompleted ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            Completed
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Mark Complete
                                        </>
                                    )}
                                </button>
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif mb-4">{selectedClass.title}</h1>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                                {selectedClass.description}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Class Selected</h3>
                        <p className="text-sm">Choose a lesson from the list to start watching.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
