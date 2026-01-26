import React from 'react';
import { Task } from '../types';

interface KeyDatesProps {
    keyDates?: Task[];
}

export const KeyDates: React.FC<KeyDatesProps> = ({ keyDates = [] }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPast = (dateStr: string) => {
        const d = new Date(dateStr);
        // Compare full date; if date < today, it's past.
        // If it's today, it's not "past" for cross-off purposes usually, unless time passed.
        // Requirement: "prior to current date".
        return d < today;
    };

    const getStylesAndIcon = (task: Task) => {
        // Map based on ID or Title keywords
        const title = task.title.toLowerCase();

        if (title.includes('info session')) {
            return {
                container: "hover:bg-black/5 dark:hover:bg-white/5",
                iconBg: "bg-blue-50 dark:bg-blue-900/20 text-blue-500",
                text: "text-gray-900 dark:text-white",
                subtext: "text-gray-500 dark:text-gray-400",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                )
            };
        }
        if (title.includes('qtac')) {
            return {
                container: "border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10",
                iconBg: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                text: "text-red-700 dark:text-red-400",
                subtext: "text-red-600/70 dark:text-red-400/70",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                )
            };
        }
        if (title.includes('documents')) {
            return {
                container: "border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10",
                iconBg: "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
                text: "text-amber-700 dark:text-amber-400",
                subtext: "text-amber-600/70 dark:text-amber-400/70",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                )
            };
        }
        if (title.includes('test invites')) {
            return {
                container: "hover:bg-black/5 dark:hover:bg-white/5",
                iconBg: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400",
                text: "text-gray-900 dark:text-white",
                subtext: "text-gray-500 dark:text-gray-400",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                )
            };
        }
        if (title.includes('interviews')) {
            return {
                container: "border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10",
                iconBg: "bg-blue-100 dark:bg-blue-900/20 text-blue-500",
                text: "text-gray-900 dark:text-white",
                subtext: "text-gray-500 dark:text-gray-400",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3" />
                    </svg>
                )
            };
        }
        if (title.includes('offers')) {
            return {
                container: "border border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10",
                iconBg: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
                text: "text-green-700 dark:text-green-400",
                subtext: "text-green-600/70 dark:text-green-400/70",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            };
        }

        // Default
        return {
            container: "hover:bg-black/5 dark:hover:bg-white/5",
            iconBg: "bg-gray-100 dark:bg-white/10 text-gray-500",
            text: "text-gray-900 dark:text-white",
            subtext: "text-gray-500 dark:text-gray-400",
            icon: <div className="w-1.5 h-1.5 rounded-full bg-current" />
        };
    };

    return (
        <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1 scrollbar-thin">
            {keyDates.map((task, i) => {
                const style = getStylesAndIcon(task);
                const passed = isPast(task.due_date);
                const dateObj = new Date(task.due_date);
                const dateDisplay = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                return (
                    <div key={task.id || i} className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${style.container} ${passed ? 'opacity-50' : ''}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                            {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${style.text} ${passed ? 'line-through decoration-current' : ''}`}>
                                {dateDisplay} · {task.title}
                            </p>
                            <p className={`text-[10px] truncate ${style.subtext} ${passed ? 'line-through decoration-current' : ''}`}>
                                {task.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
