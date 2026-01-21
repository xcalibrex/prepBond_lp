import React from 'react';
import { UserStats, Branch } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface AnalyticsProps {
  stats: UserStats;
  isDark?: boolean;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats, isDark = false }) => {
  // Format data for Radar Chart
  const radarData = [
    {
      subject: 'Perceiving',
      A: stats.scores[Branch.Perceiving] || 0,
      fullMark: 100,
    },
    {
      subject: 'Using',
      A: stats.scores[Branch.Using] || 0,
      fullMark: 100,
    },
    {
      subject: 'Understanding',
      A: stats.scores[Branch.Understanding] || 0,
      fullMark: 100,
    },
    {
      subject: 'Managing',
      A: stats.scores[Branch.Managing] || 0,
      fullMark: 100,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif italic mb-2">
          Analytics & Insights
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Visualize your emotional intelligence profile and track your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Radar Chart Section */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-xl shadow-black/5 dark:shadow-none flex flex-col items-center justify-center min-h-[400px] hover:translate-y-[-4px] transition-all duration-300">
          <div className="flex items-center justify-between mb-2 w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs opacity-50">
              Competency Radar
            </h3>
          </div>

          <div className="flex-1 w-full relative h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke={isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: isDark ? "rgba(255,255,255,0.7)" : "#6b7280", fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    background: isDark ? '#000' : '#fff',
                    borderColor: isDark ? '#333' : '#e5e7eb',
                    color: isDark ? '#fff' : '#000'
                  }}
                  itemStyle={{
                    color: isDark ? '#10b981' : '#059669',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke={isDark ? "#10b981" : "#059669"}
                  strokeWidth={3}
                  fill={isDark ? "#10b981" : "#059669"}
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight Section */}
        <div className="space-y-6">

          {/* Overall Alignment Card */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <h3 className="text-emerald-800 dark:text-emerald-400 font-bold mb-2">Overall Alignment</h3>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-emerald-900 dark:text-emerald-300">
                {stats.consensusAlignment}%
              </span>
              <span className="mb-2 text-sm font-bold text-emerald-700 dark:text-emerald-500/80">Average Score</span>
            </div>
            <p className="mt-4 text-sm text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
              {stats.consensusAlignment >= 80 ? 'You are performing at an expert level! Your ability to read and interpret emotional cues is excellent.' :
                stats.consensusAlignment >= 60 ? 'You have a solid foundation. Focus on the nuanced differences between similar emotions to improve further.' :
                  'Emotional intelligence develops with practice. Determine which branch is holding you back and focus your practice there.'}
            </p>
          </div>

          {/* Branch Breakdown */}
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Branch Detail</h3>
            <div className="space-y-4">
              {radarData.map((item) => (
                <div key={item.subject} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.subject}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.A}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black dark:bg-white rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${item.A}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions (Preserved) */}
          <div className="bg-black dark:bg-white text-white dark:text-black p-6 rounded-[24px] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-bold text-white dark:text-black mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
              Recommended Actions
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-4 items-center border border-white/10 dark:border-gray-200 bg-white/5 dark:bg-white p-4 rounded-[24px] hover:bg-white/10 dark:hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm dark:shadow-none">
                <div className="w-6 h-6 rounded-full bg-white dark:bg-black text-black dark:text-white font-bold flex items-center justify-center shrink-0 text-xs group-hover:scale-110 transition-transform">1</div>
                <span className="font-medium text-sm text-gray-200 dark:text-gray-800 group-hover:text-white dark:group-hover:text-black">Launch "Conflict De-escalation" scenario.</span>
              </li>
              <li className="flex gap-4 items-center border border-white/10 dark:border-gray-200 bg-white/5 dark:bg-white p-4 rounded-[24px] hover:bg-white/10 dark:hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm dark:shadow-none">
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