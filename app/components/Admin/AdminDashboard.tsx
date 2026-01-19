import React, { useState, useEffect } from 'react';
import { DS } from '../../design-system';
import { MetricCardSkeleton, ActivityFeedSkeleton, SystemHealthSkeleton } from '../Skeletons';

interface MetricCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5 flex flex-col justify-between h-[180px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
        <div className="flex justify-between items-start">
            <div className={`w-10 h-10 flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none pt-1">{title}</span>
        </div>
        <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">{value}</h3>
            <p className="text-[11px] text-gray-500 font-medium">{subtitle}</p>
        </div>
    </div>
);

export const AdminDashboard: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <MetricCardSkeleton key={i} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActivityFeedSkeleton count={4} />
                    <SystemHealthSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Scholars"
                    value="1,284"
                    subtitle="+12% from last month"
                    color="text-gray-400 dark:text-gray-500"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>}
                />
                <MetricCard
                    title="Classes Today"
                    value="24"
                    subtitle="4 pending review"
                    color="text-gray-400 dark:text-gray-500"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>}
                />
                <MetricCard
                    title="Active Sims"
                    value="156"
                    subtitle="Currently in progress"
                    color="text-gray-400 dark:text-gray-500"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>}
                />
                <MetricCard
                    title="Practice Tests"
                    value="8"
                    subtitle="Worksheets & Exams"
                    color="text-gray-400 dark:text-gray-500"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-8 border border-gray-100 dark:border-white/5`}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-xs">
                                    {String.fromCharCode(64 + i)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">User {i} completed Perceiving Emotions</p>
                                    <p className="text-[11px] text-gray-500">2 minutes ago</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-500">84% Score</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-8 border border-gray-100 dark:border-white/5`}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Response Time</span>
                            <span className="text-sm font-bold text-emerald-500">124ms</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Database Load</span>
                            <span className="text-sm font-bold text-amber-500">42%</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auth Services</span>
                            <span className="text-sm font-bold text-emerald-500">Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
