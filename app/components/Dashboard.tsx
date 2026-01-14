import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { DS } from '../design-system';
import { Task, TaskType, UserStats, Branch } from '../types';
import { AddTaskModal } from './AddTaskModal';
import { KeyDates } from './KeyDates';

interface DashboardProps {
    stats: UserStats | null;
    user: User | null;
    isDark?: boolean;
    onStartExam?: () => void;
    onStartCurriculum?: () => void;
    onLogout?: () => void;
    toggleTheme?: () => void;
    onTabChange?: (tab: string) => void;
}

const StatCard = ({ title, subtitle, value, gradientClass }: { title: string, subtitle: string, value: string | number, gradientClass: string }) => (
    <div className={`p-6 rounded-[24px] ${gradientClass} flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-transparent dark:border-white/5`}>
        <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
        </div>
        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
        </div>
    </div>
);

const Calendar = ({ isDark, currentMonth, tasks, selectedDate, onSelectDate, onMonthChange }: { isDark: boolean, currentMonth: Date, tasks: Task[], selectedDate: Date, onSelectDate: (date: Date) => void, onMonthChange: (increment: number) => void }) => {
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    const currentDay = new Date().getDate();
    const isCurrentMonth = currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();

    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Group tasks by date string (YYYY-MM-DD) for dot rendering
    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {};
        tasks.forEach(t => {
            if (map[t.due_date]) {
                map[t.due_date].push(t);
            } else {
                map[t.due_date] = [t];
            }
        });
        return map;
    }, [tasks]);

    return (
        <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5`}>
            {/* Calendar Header inside Component (optional, or use external) */}
            {/* Actually we moved header out, but let's keep Month Name here if we want or just grid */}
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {days.map(d => (
                    <span key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                    <div key={`empty-${i}`}></div>
                ))}

                {dates.map(d => {
                    // Create date string YYYY-MM-DD locally to match task dates
                    // Note: tasks are stored as YYYY-MM-DD string or ISO.
                    // Let's assume input is YYYY-MM-DD string from modal.
                    const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const dateObj = new Date(currentYear, currentMonthIndex, d);

                    const dayTasks = tasksByDate[dateStr] || [];
                    const hasUserTask = dayTasks.some(t => t.type === 'user_created');
                    const hasKeyDate = dayTasks.some(t => t.type === 'key_date');
                    const hasOther = dayTasks.length > 0 && !hasUserTask && !hasKeyDate;

                    const isBeforeToday = isCurrentMonth && d < currentDay;
                    // Allow selecting past dates? Maybe yes for history. User request: "page load... user tasks for current month".
                    // Let's keep logic simple: clickable.

                    const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === currentMonthIndex && selectedDate.getFullYear() === currentYear;
                    const isToday = isCurrentMonth && d === currentDay;

                    return (
                        <div key={d} className={`flex justify-center flex-col items-center relative group cursor-pointer`}
                            onClick={() => onSelectDate(dateObj)}
                        >
                            {/* Dots - Now above the date */}
                            <div className="flex gap-0.5 mb-0.5 h-1">
                                {hasKeyDate && <div className="w-1 h-1 rounded-full bg-red-500"></div>}
                                {hasUserTask && <div className="w-1 h-1 rounded-full bg-blue-500"></div>}
                                {hasOther && <div className="w-1 h-1 rounded-full bg-amber-500"></div>}
                            </div>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all relative
                                ${isSelected
                                    ? 'bg-blue-500 text-white shadow-md scale-110'
                                    : isToday
                                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}
                            `}>
                                {d}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};

const TaskItem = ({ title, type, date, duration, color }: { title: string, type: string, date: string, duration?: string, color: string }) => (
    <div className="flex gap-4 relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
        <div className="flex flex-col items-center pt-2">
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-[#F8F9FD] dark:border-dark-nav shadow-sm z-10 ${color}`}></div>
            <div className="w-0.5 h-full bg-gray-200 dark:bg-white/10 absolute top-4 group-last:hidden"></div>
        </div>
        <div className="pb-2 flex-1">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{type.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                    <span className="text-[11px] font-bold text-black dark:text-white block">{date}</span>
                    {duration && <span className="text-[10px] text-gray-400">{duration}</span>}
                </div>
            </div>
        </div>
    </div>
);

const BRANCH_COLORS = {
    [Branch.Perceiving]: '#60A5FA',
    [Branch.Using]: '#C084FC',
    [Branch.Understanding]: '#FBBF24',
    [Branch.Managing]: '#34D399',
};

const TASK_TYPE_COLORS: Record<string, string> = {
    'user_created': 'bg-blue-500',
    'key_date': 'bg-red-500',
    'group_class': 'bg-amber-400',
    'curriculum': 'bg-emerald-400'
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, user, isDark = false, onStartExam, onStartCurriculum, onLogout, toggleTheme, onTabChange }) => {
    const [activeChartTab, setActiveChartTab] = useState<string>('All');
    const [mobileTab, setMobileTab] = useState<'stats' | 'trajectory' | 'roadmap'>('stats');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Roadmap State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [rightPanelTab, setRightPanelTab] = useState<'schedule' | 'key-dates'>('schedule');

    // Tasks State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isSavingTask, setIsSavingTask] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Static Key Dates (should match KeyDates.tsx)
    const keyDates: Task[] = useMemo(() => [
        { id: 'kd-1', title: 'Info Session', description: 'Zoom · 5:00pm QLD', due_date: '2025-01-08', type: 'key_date', user_id: '', is_public: true, created_at: '', updated_at: '' },
        { id: 'kd-2', title: 'QTAC Closes', description: '11:45pm QLD · CRITICAL', due_date: '2025-01-22', type: 'key_date', user_id: '', is_public: true, created_at: '', updated_at: '' },
        { id: 'kd-3', title: 'Documents Due', description: '4:30pm QLD', due_date: '2025-01-29', type: 'key_date', user_id: '', is_public: true, created_at: '', updated_at: '' },
        { id: 'kd-4', title: 'Test Invites', description: 'Email to selected applicants', due_date: '2025-02-10', type: 'key_date', user_id: '', is_public: true, created_at: '', updated_at: '' },
        { id: 'kd-5', title: 'Interviews', description: '~2 hours online', due_date: '2025-03-10', type: 'key_date', user_id: '', is_public: true, created_at: '', updated_at: '' },
        { id: 'kd-6', title: 'Offers Released', description: '8:30am QLD', due_date: '2025-03-26', type: 'key_date', user_id: '', is_public: true, created_at: '', updated_at: '' },
    ], []);

    // Fetch Tasks for Current Month
    useEffect(() => {
        const fetchTasks = async () => {
            if (!user?.id) {
                // If no user, just use key dates
                setTasks(keyDates);
                return;
            }

            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

            try {
                const { data, error } = await supabase
                    .from('roadmap_tasks')
                    .select('*')
                    .gte('due_date', startOfMonth)
                    .lte('due_date', endOfMonth)
                // We might want to clear previous tasks or just replace

                if (error) {
                    console.error('Error fetching tasks:', error);
                    setTasks(keyDates); // Fallback to key dates
                    return;
                }

                if (data) {
                    // Merge user tasks with key dates
                    const userTasks = data as Task[];
                    setTasks([...userTasks, ...keyDates]);
                } else {
                    setTasks(keyDates);
                }
            } catch (err) {
                console.error('Error in fetchTasks:', err);
                setTasks(keyDates);
            }
        };

        fetchTasks();
    }, [currentMonth, user?.id, isAddTaskModalOpen, keyDates]); // Re-fetch when modal closes/saved or month changes

    const handleMonthChange = (increment: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentMonth(newDate);
    };

    const handleSaveTask = async (taskData: { title: string, description: string, due_date: string, type: TaskType }) => {
        if (!user?.id) return;
        setIsSavingTask(true);
        try {
            const { error } = await supabase.from('roadmap_tasks').insert({
                ...taskData,
                user_id: user.id
            });

            if (error) throw error;
            setIsAddTaskModalOpen(false);
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task');
        } finally {
            setIsSavingTask(false);
        }
    };

    const chartData = useMemo(() => {
        if (!stats?.history || !Array.isArray(stats.history)) {
            // console.log('Dashboard: stats.history is missing or not an array', stats);
            return [];
        }

        try {
            const sortedHistory = [...stats.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (activeChartTab === 'All') {
                return sortedHistory.slice(-20).map(h => ({
                    name: h.date?.split('-').slice(1).join('/') || 'N/A',
                    [h.branch]: h.score,
                }));
            } else {
                return sortedHistory
                    .filter(h => h.branch === activeChartTab)
                    .slice(-10)
                    .map(h => ({
                        name: h.date?.split('-').slice(1).join('/') || 'N/A',
                        score: h.score,
                        branch: h.branch
                    }));
            }
        } catch (err) {
            console.error('Dashboard: Error processing chartData', err);
            return [];
        }
    }, [stats?.history, activeChartTab]);

    // Filter tasks based on selected date
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const taskDate = new Date(task.due_date);
            return taskDate.getDate() === selectedDate.getDate() &&
                taskDate.getMonth() === selectedDate.getMonth() &&
                taskDate.getFullYear() === selectedDate.getFullYear();
        });
    }, [tasks, selectedDate]);

    return (
        <div className={`flex flex-col gap-5 ${DS.animation.enter} h-full`}>
            {isAddTaskModalOpen && (
                <AddTaskModal
                    isOpen={isAddTaskModalOpen}
                    onClose={() => setIsAddTaskModalOpen(false)}
                    onSave={handleSaveTask}
                    isSaving={isSavingTask}
                />
            )}

            {/* Mobile Sub-tabs Navigation */}
            <div className="md:hidden flex p-1 bg-gray-100 dark:bg-white/5 rounded-[24px] w-full sticky top-0 z-20 backdrop-blur-md">
                <button
                    onClick={() => setMobileTab('stats')}
                    className={`flex-1 py-3 text-xs font-bold rounded-[24px] transition-all ${mobileTab === 'stats' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    Stats
                </button>
                <button
                    onClick={() => setMobileTab('trajectory')}
                    className={`flex-1 py-3 text-xs font-bold rounded-[24px] transition-all ${mobileTab === 'trajectory' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    Trajectory
                </button>
                <button
                    onClick={() => setMobileTab('roadmap')}
                    className={`flex-1 py-3 text-xs font-bold rounded-[24px] transition-all ${mobileTab === 'roadmap' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    Roadmap
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* Left Column (Main Content Area) - Fixed layout, charts expand to fill */}
                <div className="lg:col-span-8 flex flex-col gap-5 h-full pb-40 lg:pb-0">

                    {/* 1. Hero Banner - Moved inside left column */}

                    {/* 1.5. Hero Banner - Updated Content */}
                    <div id="tour-banner" className={`rounded-[24px] bg-[#001833] dark:bg-dark-nav py-7 px-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-sm shrink-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                        <div className="relative z-10 max-w-md">
                            <div className="flex items-center gap-3 mb-2 md:mb-4">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shadow-sm text-blue-400 backdrop-blur-sm border border-blue-400/20">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Next Module</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                                Understanding Emotions
                            </h2>
                            <button onClick={onStartCurriculum} className="mt-6 px-6 py-2.5 bg-white text-[#001833] text-sm font-bold rounded-full hover:bg-blue-50 transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                                Start Session
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-full md:w-[60%] pointer-events-none overflow-hidden z-0">
                            <img
                                src="/media/Cover.png"
                                alt="Emotions Gradient"
                                className="w-full h-full object-cover object-right opacity-80 md:opacity-90 absolute inset-0 z-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#001833] dark:from-dark-nav via-[#001833]/60 dark:via-dark-nav/60 to-transparent z-10 md:via-[#001833]/40 md:dark:via-dark-nav/40"></div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div id="tour-stats" className={`${mobileTab === 'stats' ? 'block' : 'hidden md:block'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <StatCard
                                title="Consensus Alignment"
                                subtitle="MSCEIT Expert Mean"
                                value={`${stats.consensusAlignment}%`}
                                gradientClass="bg-emerald-50 dark:bg-emerald-900/20"
                            />
                            <StatCard
                                title="Percentile Rank"
                                subtitle="Top Med Applicants"
                                value={`${stats.percentile}%`}
                                gradientClass="bg-amber-100 dark:bg-amber-900/20"
                            />
                            <StatCard
                                title="Mastery Status"
                                subtitle="Tiered Curriculum"
                                value={`Lvl ${stats?.masteryLevels ? Math.max(...(Object.values(stats.masteryLevels) as number[])) : 0}`}
                                gradientClass="bg-violet-50 dark:bg-violet-900/20"
                            />
                        </div>
                    </div>

                    {/* Trajectory Chart */}
                    <div id="tour-trajectory" className={`${mobileTab === 'trajectory' ? 'block' : 'hidden md:block'} bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5 flex-1 min-h-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white shrink-0">Alignment Trajectory</h3>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto md:pb-0">
                                {['All', ...Object.values(Branch)].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveChartTab(tab)}
                                        className={`text-xs font-bold whitespace-nowrap transition-all px-3 py-1.5 rounded-full ${activeChartTab === tab
                                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {tab === 'All' ? 'All' : tab.replace(' Emotions', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        {Object.values(Branch).map(branch => (
                                            <linearGradient key={branch} id={`color${branch.split(' ')[0]}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={BRANCH_COLORS[branch]} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={BRANCH_COLORS[branch]} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#E5E5E5'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#666' : '#AAA', fontSize: 11 }} dy={10} />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                            backgroundColor: isDark ? '#171717' : '#fff',
                                            color: isDark ? '#fff' : '#000'
                                        }}
                                    />
                                    {activeChartTab === 'All' ? (
                                        Object.values(Branch).map((branch) => (
                                            <Area
                                                key={branch}
                                                type="monotone"
                                                dataKey={branch}
                                                stroke={BRANCH_COLORS[branch]}
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill={`url(#color${branch.split(' ')[0]})`}
                                                connectNulls
                                                name={branch.replace(' Emotions', '')}
                                            />
                                        ))
                                    ) : (
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke={BRANCH_COLORS[activeChartTab as Branch]}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill={`url(#color${activeChartTab.split(' ')[0]})`}
                                            name={activeChartTab.replace(' Emotions', '')}
                                        />
                                    )}
                                    {activeChartTab === 'All' && <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column - Desktop (lg and up) - Fixed full height with visible overflow for shadows */}
                <div id="tour-roadmap" className={`${mobileTab === 'roadmap' ? 'block' : 'hidden lg:flex'} lg:col-span-4 flex flex-col gap-0 pt-0 h-full`}>


                    {/* Calendar Header Moved Here */}
                    <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                        <h3 className="text-[24px] font-bold font-serif text-gray-900 dark:text-white leading-tight capitalize">{currentMonth.toLocaleString('default', { month: 'long' })} <span className="text-gray-400">{currentMonth.getFullYear()}</span></h3>
                        <div className="flex gap-1">
                            <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-black dark:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                    {/* Fixed Calendar Container: removed outer wrapper styling to match inner radius */}
                    <div className="shrink-0 mb-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-[24px]">
                        <Calendar isDark={isDark} currentMonth={currentMonth} tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} onMonthChange={handleMonthChange} />
                    </div>

                    <div className="flex flex-col flex-1 gap-3 min-h-0">
                        <div className="flex items-center justify-between shrink-0 px-1">
                            <h3 className="text-[20px] font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                                Roadmap
                            </h3>
                            {/* Tabs */}
                            <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-full">
                                <button
                                    onClick={() => setRightPanelTab('schedule')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${rightPanelTab === 'schedule' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                                >
                                    Schedule
                                </button>
                                <button
                                    onClick={() => setRightPanelTab('key-dates')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${rightPanelTab === 'key-dates' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                                >
                                    Key Dates
                                </button>
                            </div>
                        </div>

                        <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-5 border border-gray-100 dark:border-white/5 flex-1 min-h-0 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                            {rightPanelTab === 'schedule' ? (
                                <div className="mt-1 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4 shrink-0">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{selectedDate.toLocaleString('default', { day: 'numeric', month: 'short' })}</p>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500">{filteredTasks.length} Tasks</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto scrollbar-hide -mr-2 pr-2">
                                        {filteredTasks.length > 0 ? (
                                            filteredTasks.map((task, i) => (
                                                <TaskItem
                                                    key={task.id || i}
                                                    title={task.title}
                                                    type={task.type}
                                                    date={new Date(task.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                    duration="-" // Duration not in DB yet
                                                    color={TASK_TYPE_COLORS[task.type] || 'bg-gray-400'}
                                                />
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 h-full">
                                                <p className="text-sm">No tasks scheduled</p>
                                                <button
                                                    onClick={() => setIsAddTaskModalOpen(true)}
                                                    className="mt-2 text-xs text-blue-500 font-medium hover:underline"
                                                >
                                                    + Add Task
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 text-center shrink-0">
                                        <button
                                            onClick={() => setIsAddTaskModalOpen(true)}
                                            className="text-black dark:text-white font-bold text-xs hover:underline flex items-center justify-center gap-2 mx-auto"
                                        >
                                            + Add New Task
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto scrollbar-hide -mr-2 pr-2">
                                    <KeyDates />
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};