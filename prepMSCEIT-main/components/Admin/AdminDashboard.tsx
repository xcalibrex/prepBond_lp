import React from 'react';
import { DS } from '../../design-system';

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
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-sm`}>
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
    return (
        <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Scholars"
                    value="1,284"
                    subtitle="+12% from last month"
                    color="bg-blue-500"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <MetricCard
                    title="Classes Today"
                    value="24"
                    subtitle="4 pending review"
                    color="bg-purple-500"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
                <MetricCard
                    title="Active Sims"
                    value="156"
                    subtitle="Currently in progress"
                    color="bg-emerald-500"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
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
