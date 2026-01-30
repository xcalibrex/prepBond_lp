import React from 'react';
import { IQuestion } from '../../types';

interface Props {
    question: IQuestion;
    currentAnswer: number | null;
    onAnswer: (val: number) => void;
}

export const SlidingScale: React.FC<Props> = ({ question, currentAnswer, onAnswer }) => {
    const min = question.scale_min || 1;
    const max = question.scale_max || 5;
    const value = currentAnswer ?? Math.ceil((min + max) / 2); // Default to middle

    return (
        <div className="space-y-8 py-4">
            <h3 className="text-xl font-bold font-serif mb-4">{question.question_text}</h3>

            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                <div className="relative mb-6">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={1}
                        value={value}
                        onChange={(e) => onAnswer(parseInt(e.target.value))}
                        className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                    />
                    <div className="flex justify-between mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                        <span>{min}</span>
                        <span>{Math.ceil((min + max) / 2)}</span>
                        <span>{max}</span>
                    </div>
                </div>

                <div className="text-center">
                    <span className="text-5xl font-black text-black dark:text-white">
                        {value}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">Selected Value</p>
                </div>
            </div>
        </div>
    );
};
