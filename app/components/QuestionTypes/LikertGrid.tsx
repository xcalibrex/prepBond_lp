import React from 'react';
import { IQuestion } from '../../types';

interface Props {
    question: IQuestion;
    selectedAnswers: Record<string, string>; // map of optionId (row) -> value (1-5)
    onAnswer: (optionId: string, value: string) => void;
}

// Typical MSCEIT Likert scale is 1 (Not at all/Least) to 5 (Extremely/Most)
const SCALE = [
    { val: '1', label: '1 - Least' },
    { val: '2', label: '2' },
    { val: '3', label: '3' },
    { val: '4', label: '4' },
    { val: '5', label: '5 - Most' },
];

export const LikertGrid: React.FC<Props> = ({ question, selectedAnswers, onAnswer }) => {
    return (
        <div className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {question.question_text}
            </h3>

            <div className="bg-white dark:bg-white/5 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                {/* Header Row */}
                <div className="grid grid-cols-[2fr,repeat(5,1fr)] gap-2 mb-4 text-center border-b border-gray-100 dark:border-white/10 pb-4">
                    <div className="text-left text-xs font-black uppercase tracking-widest text-gray-400">Emotion</div>
                    {SCALE.map(s => (
                        <div key={s.val} className="text-[10px] font-bold text-gray-500 uppercase">{s.label}</div>
                    ))}
                </div>

                {/* Rows */}
                <div className="space-y-6">
                    {question.options.map((row) => (
                        <div key={row.id} className="grid grid-cols-[2fr,repeat(5,1fr)] gap-2 items-center group">
                            <div className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-500 transition-colors">
                                {row.label}
                            </div>
                            {SCALE.map(s => {
                                const isSelected = selectedAnswers[row.id] === s.val;
                                return (
                                    <button
                                        key={s.val}
                                        onClick={() => onAnswer(row.id, s.val)}
                                        className={`relative h-10 rounded-xl flex items-center justify-center transition-all duration-200
                                            ${isSelected
                                                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md scale-105 z-10'
                                                : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="font-bold text-sm">{s.val}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
