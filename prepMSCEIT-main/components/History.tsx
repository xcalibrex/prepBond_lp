import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserStats, HistoryItem } from '../types';

interface HistoryProps {
    stats: UserStats;
}

export const History: React.FC<HistoryProps> = ({ stats }) => {
    // Reverse history to show latest first
    const reversedHistory = [...stats.history].reverse();
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    // Mock data generator for the detailed view
    const getDetailedBreakdown = (score: number) => {
        const accuracy = Math.min(100, score + 5);
        const speed = score > 80 ? "Fast" : score > 60 ? "Moderate" : "Slow";
        const consistency = score > 75 ? "High" : "Variable";
        
        return [
            { label: "Consensus Accuracy", value: `${accuracy}%`, color: "text-green-500" },
            { label: "Response Speed", value: speed, color: "text-blue-500" },
            { label: "Consistency", value: consistency, color: "text-amber-500" }
        ];
    };

    return (
        <div className="space-y-8 animate-fade-in-up relative">
            <header className="hidden md:flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 pb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Assessment History</h1>
                <p className="text-gray-500 dark:text-gray-400 text-base">
                    Track your performance trajectory over time.
                </p>
            </header>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {reversedHistory.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-white dark:bg-[#0A0A0A] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.date}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                item.score >= 75 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : item.score >= 60
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {item.score >= 75 ? 'Excellent' : item.score >= 60 ? 'Passing' : 'Review'}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.branch}</h3>
                        <div className="flex items-center gap-2 mt-3">
                            <span className={`text-2xl font-extrabold ${item.score >= 70 ? 'text-black dark:text-white' : 'text-gray-500'}`}>
                                {item.score}%
                            </span>
                            <div className="h-px flex-1 bg-gray-100 dark:bg-white/5 mx-2"></div>
                            <span className="text-xs font-bold text-secondary flex items-center gap-1">
                                View Report 
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </div>
                    </div>
                ))}
                {reversedHistory.length === 0 && (
                     <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-base">
                        No assessments completed yet.
                    </div>
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800">
                                <th className="py-4 px-6 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                                <th className="py-4 px-6 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Module / Branch</th>
                                <th className="py-4 px-6 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Score</th>
                                <th className="py-4 px-6 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {reversedHistory.map((item) => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => setSelectedItem(item)}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                >
                                    <td className="py-5 px-6 text-base font-medium text-gray-900 dark:text-white">
                                        {item.date}
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2.5 h-2.5 rounded-full ${
                                                item.branch.includes('Perceiving') ? 'bg-blue-500' :
                                                item.branch.includes('Using') ? 'bg-purple-500' :
                                                item.branch.includes('Understanding') ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                            }`}></span>
                                            <span className="text-base text-gray-700 dark:text-gray-300">{item.branch}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className={`text-base font-bold ${item.score >= 70 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                            {item.score}%
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            item.score >= 75 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : item.score >= 60
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {item.score >= 75 ? 'Excellent' : item.score >= 60 ? 'Passing' : 'Review'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {reversedHistory.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500 dark:text-gray-400 text-base">
                                        No assessments completed yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side View Drawer - Portaled to Body */}
            {selectedItem && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedItem(null)}
                    ></div>
                    
                    <div className="relative w-full max-w-md bg-white dark:bg-[#0A0A0A] h-full shadow-2xl p-8 overflow-y-auto animate-slide-in-right border-l border-gray-100 dark:border-gray-800 flex flex-col">
                         <button 
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                         >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>

                         <div className="mt-8 mb-8">
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{selectedItem.date}</span>
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedItem.branch}</h2>
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
                                 <span>Score: {selectedItem.score}%</span>
                             </div>
                         </div>

                         <div className="space-y-8 flex-1">
                             <div>
                                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Performance Breakdown</h3>
                                 <div className="grid grid-cols-1 gap-4">
                                     {getDetailedBreakdown(selectedItem.score).map((metric) => (
                                         <div key={metric.label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                             <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.label}</span>
                                             <span className={`text-base font-bold ${metric.color}`}>{metric.value}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <div>
                                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">AI Analysis</h3>
                                 <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                     <p className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed">
                                         {selectedItem.score >= 80 
                                            ? "Your performance in this session indicates a high level of mastery. You identified key emotional cues quickly and accurately aligned with consensus models."
                                            : selectedItem.score >= 60
                                            ? "Good work. You are grasping the core concepts, but there is room to refine your distinction between subtle emotional blends."
                                            : "This session suggests a need for review. Focus on the foundational definitions of this branch before attempting advanced scenarios."}
                                     </p>
                                 </div>
                             </div>
                         </div>

                         <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                             <button className="w-full py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                 Download Report
                             </button>
                         </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};