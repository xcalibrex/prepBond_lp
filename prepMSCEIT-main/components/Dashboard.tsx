import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, Branch } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DS } from '../design-system';

interface DashboardProps {
  stats: UserStats;
  isDark?: boolean;
  onStartExam: () => void;
  onStartTraining: () => void;
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
          className={`relative ${DS.radius.card} p-6 flex flex-col justify-between h-[220px] cursor-pointer ${DS.animation.hover} border border-white/60 dark:border-white/5 overflow-hidden group ${gradientClass}`}
      >
          <div className="relative z-10 flex flex-col h-full">
              <div className="mb-4">
                   <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 opacity-90">{title}</h3>
                   <span className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none">{value}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-2">
                      {subtitle}
                  </p>
                   <div className="w-full bg-white/50 dark:bg-black/20 rounded-xl py-3 px-4 backdrop-blur-md transition-all hover:bg-white/80 dark:hover:bg-black/40 flex items-center justify-between group-hover:pl-5 border border-white/20 dark:border-white/5 shadow-sm">
                       <span className="text-xs font-bold text-gray-900 dark:text-white">Review Profile</span>
                       <svg className="w-3.5 h-3.5 text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                   </div>
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
    const dates = Array.from({length: daysInMonth}, (_, i) => i + 1);

    return (
        <div className={`bg-[#F8F9FD] dark:bg-[#0A0A0A] ${DS.radius.card} p-6 mb-6 border border-transparent dark:border-white/5`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{monthName} {currentYear}</h3>
                <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-black dark:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            
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
        </div>
    )
}

const TaskItem = ({ title, type, date, duration, color }: { title: string, type: string, date: string, duration: string, color: string }) => (
    <div className="flex gap-4 relative group cursor-pointer">
        <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-[#F8F9FD] dark:border-[#0A0A0A] shadow-sm z-10 ${color}`}></div>
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

export const Dashboard: React.FC<DashboardProps> = ({ stats, isDark = false, onStartExam, onStartTraining }) => {
  const [activeChartTab, setActiveChartTab] = useState<string>('All');
  const [mobileTab, setMobileTab] = useState<'stats' | 'trajectory' | 'roadmap'>('stats');

  const chartData = useMemo(() => {
      const sortedHistory = [...stats.history].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (activeChartTab === 'All') {
          return sortedHistory.slice(-20).map(h => ({
              name: h.date.split('-').slice(1).join('/'),
              [h.branch]: h.score,
          }));
      } else {
          return sortedHistory
              .filter(h => h.branch === activeChartTab)
              .slice(-10)
              .map(h => ({
                  name: h.date.split('-').slice(1).join('/'),
                  score: h.score,
                  branch: h.branch
              }));
      }
  }, [stats.history, activeChartTab]);

  return (
    <div className={`flex flex-col gap-6 ${DS.animation.enter} h-full`}>
      
      {/* 1. Hero Banner - Specific requested shapes: Circle, Triangle, Plus, Square */}
      <div className={`rounded-2xl bg-[#001833] dark:bg-white/5 p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-sm shrink-0`}>
          <div className="relative z-10 max-w-md">
               <div className="flex items-center gap-3 mb-2 md:mb-4">
                   <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shadow-sm text-white backdrop-blur-sm border border-white/10">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Bond Med Simulation</span>
               </div>
               <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">
                   Welcome back, Johnny
               </h1>
               <p className="text-gray-300 font-medium text-sm hidden md:block">Med Aspirant &bull; Precision Tier Training</p>
          </div>
          {/* SVG Overlay positioning adjusted for Circle, Triangle, Square, Plus visibility */}
          <div className="absolute right-0 top-0 h-full w-full md:w-1/2 pointer-events-none overflow-hidden hidden md:block">
             <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
                 {/* Decorative background glow */}
                 <circle cx="150" cy="100" r="70" fill="#3B82F6" className="opacity-10 blur-3xl" />
                 
                 {/* 1. Circle - Purple */}
                 <circle cx="140" cy="50" r="22" fill="none" stroke="#A855F7" strokeWidth="2" className="opacity-40 animate-float-slow" />
                 
                 {/* 2. Triangle - Orange */}
                 <path d="M210 50 L228 85 L192 85 Z" fill="none" stroke="#F97316" strokeWidth="2" className="opacity-40 animate-float-slow" style={{ animationDelay: '1s' }} />
                 
                 {/* 3. Square - Teal */}
                 <rect x="230" y="110" width="30" height="30" rx="4" fill="none" stroke="#14B8A6" strokeWidth="2" className="opacity-40 animate-float-slow transform rotate-12" style={{ animationDelay: '2s' }} />
                 
                 {/* 4. Plus - White/Blue */}
                 <g className="opacity-30 animate-float-slow" style={{ animationDelay: '1.5s' }}>
                    <path d="M165 130 V150 M155 140 H175" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                 </g>
             </svg>
          </div>
      </div>

      {/* Mobile Sub-tabs Navigation */}
      <div className="md:hidden flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-full sticky top-0 z-20 backdrop-blur-md">
          <button 
            onClick={() => setMobileTab('stats')} 
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${mobileTab === 'stats' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Stats
          </button>
          <button 
            onClick={() => setMobileTab('trajectory')} 
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${mobileTab === 'trajectory' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Trajectory
          </button>
          <button 
            onClick={() => setMobileTab('roadmap')} 
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${mobileTab === 'roadmap' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Roadmap
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Stat Cards */}
              <div className={`${mobileTab === 'stats' ? 'block' : 'hidden md:block'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <StatCard 
                          title="Consensus Alignment" 
                          subtitle="MSCEIT Expert Mean" 
                          value={`${stats.consensusAlignment}%`}
                          gradientClass="bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-900/30 dark:via-teal-900/10 dark:to-[#0A0A0A]"
                      />
                      <StatCard 
                          title="Percentile Rank" 
                          subtitle="Top Med Applicants" 
                          value={`${stats.percentile}%`}
                          gradientClass="bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-amber-900/30 dark:via-orange-900/10 dark:to-[#0A0A0A]"
                      />
                      <StatCard 
                          title="Mastery Status" 
                          subtitle="Tiered Curriculum" 
                          value={`Lvl ${Math.max(...(Object.values(stats.masteryLevels) as number[]))}`}
                          gradientClass="bg-gradient-to-br from-violet-50 via-purple-50 to-white dark:from-violet-900/30 dark:via-purple-900/10 dark:to-[#0A0A0A]"
                      />
                  </div>
              </div>

              {/* Trajectory Chart */}
              <div className={`${mobileTab === 'trajectory' ? 'block' : 'hidden md:block'} bg-[#F8F9FD] dark:bg-[#0A0A0A] ${DS.radius.card} p-6 border border-transparent dark:border-white/5 flex-1 min-h-[400px]`}>
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                       <h3 className="text-sm font-bold text-gray-900 dark:text-white shrink-0">Alignment Trajectory</h3>
                       <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto md:pb-0">
                          {['All', ...Object.values(Branch)].map(tab => (
                             <button
                               key={tab}
                               onClick={() => setActiveChartTab(tab)}
                               className={`text-xs font-bold whitespace-nowrap transition-all px-3 py-1.5 rounded-full ${
                                 activeChartTab === tab
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
                                           <stop offset="5%" stopColor={BRANCH_COLORS[branch]} stopOpacity={0.2}/>
                                           <stop offset="95%" stopColor={BRANCH_COLORS[branch]} stopOpacity={0}/>
                                       </linearGradient>
                                   ))}
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#E5E5E5'} />
                               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#666' : '#AAA', fontSize: 11}} dy={10} />
                               <YAxis hide domain={[0, 100]} />
                               <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
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
          <div className={`${mobileTab === 'roadmap' ? 'block' : 'hidden lg:flex'} lg:col-span-4 flex flex-col gap-8`}>
               <Calendar isDark={isDark} />
               <div className="flex-1">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                       Simulation Roadmap
                   </h3>
                   <div className={`bg-[#F8F9FD] dark:bg-[#0A0A0A] ${DS.radius.card} p-6 border border-transparent dark:border-white/5`}>
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