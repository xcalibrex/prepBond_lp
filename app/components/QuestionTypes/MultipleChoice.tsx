import React from 'react';
import { IQuestion } from '../../types';

interface Props {
    question: IQuestion;
    selectedAnswer?: string;
    onAnswer: (value: string) => void;
}

export const MultipleChoice: React.FC<Props> = ({ question, selectedAnswer, onAnswer }) => {
    return (
        <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {question.question_text}
            </h3>

            <div className="space-y-3">
                {question.options.map((opt, i) => (
                    <button
                        key={opt.id}
                        onClick={() => onAnswer(opt.id)}
                        className={`w-full text-left flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 border-2
                            ${selectedAnswer === opt.id
                                ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg scale-[1.01]'
                                : 'border-transparent bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10'
                            }`}
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all 
                                ${selectedAnswer === opt.id ? 'border-white dark:border-black' : 'border-gray-300 dark:border-gray-600'}`}>
                            {selectedAnswer === opt.id && <div className="w-2.5 h-2.5 bg-white dark:bg-black rounded-full" />}
                        </div>
                        <span className="font-medium">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
