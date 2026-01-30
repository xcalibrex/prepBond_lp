import React, { useState, useEffect } from 'react';
import { IQuestion } from '../../types';

interface Props {
    question: IQuestion;
    currentAnswer: string[]; // Array of option IDs in user's order
    onAnswer: (val: string[]) => void;
}

export const EmotionOrder: React.FC<Props> = ({ question, currentAnswer, onAnswer }) => {
    const [orderedOptions, setOrderedOptions] = useState<any[]>([]);

    useEffect(() => {
        if (currentAnswer && currentAnswer.length > 0) {
            // Reconstruct order from saved answer
            const ordered = currentAnswer.map(id => question.options.find(o => o.id === id)).filter(Boolean);
            // If length mismatch (e.g. options changed), fallback or merge? simpler to fallback
            if (ordered.length === question.options.length) {
                setOrderedOptions(ordered);
                return;
            }
        }

        // Initial Shuffle
        const shuffled = [...(question.options || [])].sort(() => Math.random() - 0.5);
        setOrderedOptions(shuffled);
        // Important: Should we auto-save the initial shuffled order? 
        // Better NOT to, so we know if they haven't interacted? 
        // But for ordering, "no interaction" is ambiguous. 
        // Let's set the initial answer to the shuffled state so it's recorded.
        onAnswer(shuffled.map(o => o.id));
    }, [question.id]); // Only re-run if question changes

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...orderedOptions];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        if (swapIndex < 0 || swapIndex >= newOrder.length) return;

        [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];

        setOrderedOptions(newOrder);
        onAnswer(newOrder.map(o => o.id));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif mb-4">{question.question_text}</h3>

            <div className="space-y-3">
                {orderedOptions.map((opt, idx) => (
                    <div
                        key={opt.id}
                        className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-blue-300 transition-colors animate-fade-in"
                    >
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => moveItem(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded disabled:opacity-30 text-gray-500"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => moveItem(idx, 'down')}
                                disabled={idx === orderedOptions.length - 1}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded disabled:opacity-30 text-gray-500"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 font-bold text-sm">
                            {idx + 1}
                        </div>

                        <span className="font-medium text-gray-700 dark:text-gray-200">{opt.label}</span>
                    </div>
                ))}
            </div>

            <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest mt-6">
                Use arrows to arrange in the correct order
            </p>
        </div>
    );
};
