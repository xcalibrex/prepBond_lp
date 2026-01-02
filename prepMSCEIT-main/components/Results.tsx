import React from 'react';
import { Branch, UserStats } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ResultsProps {
    score: number;
    branch: Branch;
    stats: UserStats;
    onBack: () => void;
    isDark: boolean;
}

export const Results: React.FC<ResultsProps> = ({ score, branch, stats, onBack, isDark }) => {
    // Format data for Radar Chart comparing Average vs Session
    const radarData = Object.entries(stats.scores).map(([key, value]) => {
        const isCurrentBranch = key === branch;
        return {
            subject: key.replace(' Emotions', ''),
            Average: value,
            Session: isCurrentBranch ? score : 0, // Plot 0 for non-tested branches to create a "spike" or shape for the specific test
            fullMark: 100,
        };
    });

    const getFeedback = (score: number) => {
        if (score >= 90) return "Exceptional. You demonstrated superior consensus accuracy.";
        if (score >= 75) return "Strong performance. Your calibration is well-aligned.";
        if (score >= 60) return "Competent. Continue to refine your micro-expression analysis.";
        return "Needs calibration. Review the consensus scoring methodology.";
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            <header className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Session Results</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Analysis of your recent simulation.</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-[200px] text-sm font-bold transition-colors"
                >
                    Return to Dashboard
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Score Card */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-[#F8F9FD] dark:bg-[#0A0A0A] border border-transparent dark:border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-[350px]">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">{branch}</span>

                        <div className="relative w-48 h-48">
                            {/* SVG Ring */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                {/* Background Track */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    className="text-gray-200 dark:text-gray-800"
                                />
                                {/* Progress Arc */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * score) / 100}
                                    strokeLinecap="round"
                                    className={`transition-all duration-1000 ease-out ${score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-black dark:text-white' : 'text-blue-500'}`}
                                />
                            </svg>
                            {/* Centered Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none">
                                    {score}%
                                </span>
                            </div>
                        </div>

                        <p className="mt-8 text-sm text-gray-600 dark:text-gray-300 font-medium px-4 leading-relaxed max-w-xs mx-auto">
                            {getFeedback(score)}
                        </p>
                    </div>
                </div>

                {/* Comparative Radar */}
                <div className="md:col-span-8">
                    <div className="bg-[#F8F9FD] dark:bg-[#0A0A0A] border border-transparent dark:border-white/5 rounded-2xl p-6 h-[350px] flex flex-col">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Competency Overlay</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke={isDark ? '#404040' : '#E4E4E7'} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#FFFFFF' : '#3F3F46', fontSize: 11, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: isDark ? '#262626' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Radar name="Overall Profile" dataKey="Average" stroke={isDark ? '#555' : '#ccc'} fill={isDark ? '#888' : '#ddd'} fillOpacity={0.3} />
                                    <Radar name="This Session" dataKey="Session" stroke={isDark ? '#fff' : '#000'} strokeWidth={3} fill="transparent" />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-black dark:bg-white text-white dark:text-black rounded-2xl p-8 shadow-lg">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2">Next Steps</h3>
                        <p className="text-gray-300 dark:text-gray-600 text-sm leading-relaxed">
                            Based on your result in {branch}, we recommend focusing on real-world application scenarios. Your theoretical understanding is solid, but applying it to dynamic social blends will improve your MSCEIT score.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={onBack} className="px-6 py-3 bg-white dark:bg-black text-black dark:text-white rounded-[200px] text-sm font-bold hover:scale-105 transition-transform shadow-md">
                            Continue Training
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};