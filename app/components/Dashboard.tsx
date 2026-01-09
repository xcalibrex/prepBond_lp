import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserStats, Branch } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DS } from '../design-system';

interface DashboardProps {
    stats: UserStats;
    user: any;
    isDark?: boolean;
    onStartExam: () => void;
    onStartCurriculum: () => void;
    onLogout: () => void | Promise<void>;
    toggleTheme: () => void;
    onTabChange: (tab: string) => void;
}

const StatCard = ({
    title,
    subtitle,
    value,
    gradientClass
}: {
    title: string,
    subtitle: string,
    value: string,
    gradientClass: string
}) => {
    return (
        <div
            className={`relative ${DS.radius.card} p-6 flex flex-col justify-between h-[220px] cursor-pointer ${DS.animation.hover} border border-white/60 dark:border-transparent overflow-hidden group ${gradientClass}`}
        >
            <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 opacity-90">{title}</h3>
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none">{value}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        {subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
};

const Calendar = ({ isDark }: { isDark: boolean }) => {
    const [today, setToday] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setToday(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const monthName = today.toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5`}>
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
                    const isBeforeToday = d < currentDay;
                    return (
                        <div key={d} className={`flex justify-center relative group ${isBeforeToday ? 'cursor-default' : 'cursor-pointer'}`}>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all
                                ${d === currentDay
                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                                    : isBeforeToday
                                        ? 'text-gray-300 dark:text-gray-800'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm'}
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

const TaskItem = ({ title, type, date, duration, color }: { title: string, type: string, date: string, duration: string, color: string }) => (
    <div className="flex gap-4 relative group cursor-pointer">
        <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-[#F8F9FD] dark:border-dark-nav shadow-sm z-10 ${color}`}></div>
            <div className="w-0.5 h-full bg-gray-200 dark:bg-white/10 absolute top-2.5 group-last:hidden"></div>
        </div>
        <div className="pb-6 flex-1">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{type}</p>
                </div>
                <div className="text-right">
                    <span className="text-[11px] font-bold text-black dark:text-white block">{date}</span>
                    <span className="text-[10px] text-gray-400">{duration}</span>
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

export const Dashboard: React.FC<DashboardProps> = ({ stats, user, isDark = false, onStartExam, onStartCurriculum, onLogout, toggleTheme, onTabChange }) => {
    const [activeChartTab, setActiveChartTab] = useState<string>('All');
    const [mobileTab, setMobileTab] = useState<'stats' | 'trajectory' | 'roadmap'>('stats');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const chartData = useMemo(() => {
        if (!stats?.history || !Array.isArray(stats.history)) {
            console.log('Dashboard: stats.history is missing or not an array', stats);
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

    return (
        <div className={`flex flex-col gap-5 ${DS.animation.enter} h-full`}>

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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column (Main Content Area) */}
                <div className="lg:col-span-8 flex flex-col gap-5">

                    {/* 1. Hero Banner - Moved inside left column */}

                    {/* 1.5. Hero Banner - Updated Content */}
                    <div className={`rounded-[24px] bg-[#001833] dark:bg-dark-nav py-7 px-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-sm shrink-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
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
                        <div className="absolute right-0 top-0 h-full w-full md:w-[60%] pointer-events-none overflow-hidden hidden md:block z-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#001833] dark:from-dark-nav via-[#001833]/40 dark:via-dark-nav/40 to-transparent z-10"></div>
                            <img
                                src="/banner-emotions.png"
                                alt="Emotions Gradient"
                                className="w-full h-full object-cover object-right opacity-90"
                            />
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className={`${mobileTab === 'stats' ? 'block' : 'hidden md:block'}`}>
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
                    <div className={`${mobileTab === 'trajectory' ? 'block' : 'hidden md:block'} bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5 flex-1 min-h-[400px]`}>
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

                {/* Right Column - Desktop (lg and up) */}
                <div className={`${mobileTab === 'roadmap' ? 'block' : 'hidden lg:flex'} lg:col-span-4 flex flex-col gap-5 pt-0`}>


                    {/* Calendar Header Moved Here */}
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[24px] font-bold font-serif text-gray-900 dark:text-white leading-tight">{new Date().toLocaleString('default', { month: 'long' })} <span className="text-gray-400">{new Date().getFullYear()}</span></h3>
                        <div className="flex gap-1">
                            <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-black dark:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                    <Calendar isDark={isDark} />
                    <div>
                        <h3 className="text-[24px] font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                            Roadmap
                        </h3>
                        <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5`}>
                            <div className="mt-1">
                                <TaskItem title="Bond Selection Mock" type="Full 140-item simulation" date="19 Jan" duration="45 Mins" color="bg-black dark:bg-white" />
                                <TaskItem title="Perception Drill" type="Micro-expression tuning" date="20-21 Jan" duration="3 Hours" color="bg-amber-400" />
                                <TaskItem title="Managing Scenario" type="Clinical empathy de-brief" date="22 Jan" duration="50 Mins" color="bg-blue-500" />
                                <TaskItem title="Peer Comparison" type="Percentile sync" date="24 Jan" duration="1 Hour" color="bg-emerald-400" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
                                <button className="text-black dark:text-white font-bold text-xs hover:underline flex items-center justify-center gap-2 mx-auto">
                                    Full Schedule
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};