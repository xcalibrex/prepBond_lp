import React, { useState, useEffect } from 'react';
import { DS } from '../../design-system';
import { MetricCardSkeleton, ActivityFeedSkeleton, SystemHealthSkeleton } from '../Skeletons';
import { supabase } from '../../services/supabase';

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
    const [stats, setStats] = useState({
        totalScholars: 0,
        completions24h: 0,
        activeTests: 0,
        totalTestsTaken: 0,
        totalModules: 0,
        totalClasses: 0,
        totalAvailableTests: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            // Parallel data fetching
            const [
                { count: scholarsCount },
                { count: completions24hCount },
                { count: activeTestsCount },
                { count: allTestsTakenCount },
                { count: modulesCount },
                { count: classesCount },
                { count: practiceTestsCount },
                { data: activityData }
            ] = await Promise.all([
                // 1. Total Scholars
                supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
                // 2. Class Completions (24h)
                supabase.from('class_completions').select('*', { count: 'exact', head: true }).gt('created_at', yesterday.toISOString()),
                // 3. Active Sessions
                supabase.from('user_test_sessions').select('*', { count: 'exact', head: true }).is('completed_at', null),
                // 4. Total Tests Taken
                supabase.from('user_test_sessions').select('*', { count: 'exact', head: true }),
                // 5. Total Modules
                supabase.from('training_modules').select('*', { count: 'exact', head: true }),
                // 6. Total Classes
                supabase.from('classes').select('*', { count: 'exact', head: true }),
                // 7. Total Available Tests
                supabase.from('practice_tests').select('*', { count: 'exact', head: true }),
                // 8. Recent Activity
                supabase
                    .from('class_completions')
                    .select('created_at, profiles(full_name, email), classes(title)')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            setStats({
                totalScholars: scholarsCount || 0,
                completions24h: completions24hCount || 0,
                activeTests: activeTestsCount || 0,
                totalTestsTaken: allTestsTakenCount || 0,
                totalModules: modulesCount || 0,
                totalClasses: classesCount || 0,
                totalAvailableTests: practiceTestsCount || 0
            });

            if (activityData) {
                setRecentActivity(activityData);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Scholars"
                    value={stats.totalScholars.toLocaleString()}
                    subtitle="Registered users"
                    color="text-blue-500 bg-blue-500/10"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>}
                />
                <MetricCard
                    title="24h Completions"
                    value={stats.completions24h.toLocaleString()}
                    subtitle="Classes finished today"
                    color="text-emerald-500 bg-emerald-500/10"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <MetricCard
                    title="Active Sessions"
                    value={stats.activeTests.toLocaleString()}
                    subtitle="Tests in progress"
                    color="text-amber-500 bg-amber-500/10"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <MetricCard
                    title="Total Sessions"
                    value={stats.totalTestsTaken.toLocaleString()}
                    subtitle="All time tests taken"
                    color="text-purple-500 bg-purple-500/10"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-8 border border-gray-100 dark:border-white/5`}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Completion Activity</h3>
                    <div className="space-y-6">
                        {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-xs uppercase text-gray-500">
                                    {(activity.profiles?.full_name || activity.profiles?.email || '?').charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {activity.profiles?.full_name || activity.profiles?.email || 'Unknown User'}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        completed {activity.classes?.title || 'a class'}
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">
                                    {new Date(activity.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-500 text-center py-4">No recent activity found.</p>
                        )}
                    </div>
                </div>
                <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-8 border border-gray-100 dark:border-white/5`}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Platform Content</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Training Modules</span>
                            <span className="text-sm font-bold text-black dark:text-white">{stats.totalModules}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Available Classes</span>
                            <span className="text-sm font-bold text-black dark:text-white">{stats.totalClasses}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Practice Tests Available</span>
                            <span className="text-sm font-bold text-black dark:text-white">{stats.totalAvailableTests}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
