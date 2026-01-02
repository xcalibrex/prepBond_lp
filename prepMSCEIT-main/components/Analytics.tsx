import React from 'react';
import { UserStats } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface AnalyticsProps {
  stats: UserStats;
  isDark?: boolean;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats, isDark = false }) => {
  // Format data for Radar Chart
  const radarData = Object.entries(stats.scores).map(([key, value]) => ({
    subject: key.replace(' Emotions', ''),
    A: value,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-up">

      <header className="hidden md:flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-base">
          Holographic view of your profile.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Radar Chart Section */}
        <div className="bg-[#F8F9FD] dark:bg-dark-nav border border-transparent dark:border-white/5 rounded-xl p-4 md:p-8 flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Competency Radar</h3>
          </div>

          <div className="flex-1 min-h-[350px] md:min-h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke={isDark ? '#404040' : '#E4E4E7'} strokeOpacity={1} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: isDark ? '#FFFFFF' : '#3F3F46', fontSize: 13, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#262626' : '#18181B', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke={isDark ? '#FFFFFF' : '#000000'}
                  strokeWidth={2}
                  fill={isDark ? '#FFFFFF' : '#007bff'}
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight Section */}
        <div className="space-y-4">
          <div className="bg-[#F8F9FD] dark:bg-dark-nav border border-transparent dark:border-white/5 rounded-xl p-6 md:p-8 relative overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 text-black dark:text-white flex items-center justify-center border border-gray-100 dark:border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              Analysis
            </h3>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
              <p>
                Your <strong className="text-black dark:text-white">Perceiving Emotions</strong> is stellar (Top 10%), meaning you can read a room instantly.
              </p>
              <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>
              <p>
                However, the spider graph pulls inward on <strong className="text-black dark:text-white">Managing Emotions</strong>. Expanding this area will balance your profile.
              </p>
            </div>
          </div>

          <div className="bg-black dark:bg-white text-white dark:text-black p-6 md:p-8 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-bold text-white dark:text-black mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
              Recommended Actions
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-4 items-center border border-white/10 dark:border-gray-200 bg-white/5 dark:bg-white p-4 rounded-xl hover:bg-white/10 dark:hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm dark:shadow-none">
                <div className="w-6 h-6 rounded-full bg-white dark:bg-black text-black dark:text-white font-bold flex items-center justify-center shrink-0 text-xs group-hover:scale-110 transition-transform">1</div>
                <span className="font-medium text-sm text-gray-200 dark:text-gray-800 group-hover:text-white dark:group-hover:text-black">Launch "Conflict De-escalation" scenario.</span>
              </li>
              <li className="flex gap-4 items-center border border-white/10 dark:border-gray-200 bg-white/5 dark:bg-white p-4 rounded-xl hover:bg-white/10 dark:hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm dark:shadow-none">
                <div className="w-6 h-6 rounded-full bg-white dark:bg-black text-black dark:text-white font-bold flex items-center justify-center shrink-0 text-xs group-hover:scale-110 transition-transform">2</div>
                <span className="font-medium text-sm text-gray-200 dark:text-gray-700 group-hover:text-white dark:group-hover:text-black">Study "Emotional Blending" theory card.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};