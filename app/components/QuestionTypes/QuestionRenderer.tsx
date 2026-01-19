import React from 'react';
import { IQuestion } from '../../types';
import { MultipleChoice } from './MultipleChoice';
import { LikertGrid } from './LikertGrid';

interface Props {
    question: IQuestion;
    // We use a generic answers object to handle both single value (MCQ) and map (Likert)
    currentAnswer: any;
    onAnswer: (val: any) => void;
}

export const QuestionRenderer: React.FC<Props> = ({ question, currentAnswer, onAnswer }) => {

    // Scenario Wrapper (Section Context)
    // If context present, show it above question
    // Note: In TestRunner, we might want to show Scenario once for a block of questions. 
    // For now, adhering to schema where each question has context or referencing a parent section.
    // The DB schema question.scenario_context allows unique context per question OR shared.

    const wrapperClass = "my-4";

    const content = () => {
        switch (question.type) {
            case 'MCQ': // Fallthrough for simple scenario MCQs
            case 'SCENARIO':
                return (
                    <MultipleChoice
                        question={question}
                        selectedAnswer={currentAnswer as string}
                        onAnswer={onAnswer}
                    />
                );
            case 'LIKERT_GRID':
                return (
                    <LikertGrid
                        question={question}
                        selectedAnswers={currentAnswer || {}}
                        onAnswer={(rowId, val) => {
                            const prev = currentAnswer || {};
                            onAnswer({ ...prev, [rowId]: val });
                        }}
                    />
                );
            default:
                return <div>Unknown Question Type: {question.type}</div>;
        }
    };

    return (
        <div className={wrapperClass}>
            {/* Image Stimulus */}
            {question.scenario_image_url && (
                <div className="mb-4 rounded-3xl overflow-hidden shadow-sm bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10">
                    <img
                        src={question.scenario_image_url}
                        alt="Stimulus"
                        className="w-full h-auto max-h-[400px] object-contain mx-auto"
                    />
                </div>
            )}

            {/* Text Scenario */}
            {question.scenario_context && (
                <div className="mb-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                    <h4 className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">Scenario</h4>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-serif text-lg">
                        {question.scenario_context}
                    </p>
                </div>
            )}

            {content()}
        </div>
    );
};
