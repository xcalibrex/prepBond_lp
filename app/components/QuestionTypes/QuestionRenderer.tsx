import React from 'react';
import { IQuestion } from '../../types';
import { MultipleChoice } from './MultipleChoice';
import { LikertGrid } from './LikertGrid';
import { EmotionOrder } from './EmotionOrder';
import { SlidingScale } from './SlidingScale';

interface Props {
    question: IQuestion;
    currentAnswer: any;
    onAnswer: (val: any) => void;
}

// Helper for video embedding
const VideoPlayer: React.FC<{ url: string }> = ({ url }) => {
    const getEmbedUrl = (inputUrl: string) => {
        if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
            const videoId = inputUrl.includes('v=')
                ? inputUrl.split('v=')[1]?.split('&')[0]
                : inputUrl.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (inputUrl.includes('vimeo.com')) {
            const videoId = inputUrl.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return inputUrl; // Fallback or direct MP4
    };

    const embedUrl = getEmbedUrl(url);
    const isDirectFile = url.endsWith('.mp4') || url.endsWith('.webm');

    return (
        <div className="mb-6 rounded-2xl overflow-hidden shadow-lg bg-black aspect-video">
            {isDirectFile ? (
                <video src={url} controls className="w-full h-full" />
            ) : (
                <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            )}
        </div>
    );
};

export const QuestionRenderer: React.FC<Props> = ({ question, currentAnswer, onAnswer }) => {

    const wrapperClass = "my-4";

    const content = () => {
        switch (question.type) {
            case 'MCQ':
            case 'SCENARIO':
                return (
                    <MultipleChoice
                        question={question}
                        selectedAnswer={currentAnswer as string}
                        onAnswer={onAnswer}
                    />
                );
            case 'VIDEO':
                return (
                    <div>
                        {question.video_url && <VideoPlayer url={question.video_url} />}
                        <MultipleChoice
                            question={question}
                            selectedAnswer={currentAnswer as string}
                            onAnswer={onAnswer}
                        />
                    </div>
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
            case 'EMOTION_ORDER':
                return (
                    <EmotionOrder
                        question={question}
                        currentAnswer={currentAnswer} // Expects string[] of IDs
                        onAnswer={onAnswer}
                    />
                );
            case 'SLIDING_SCALE':
                return (
                    <SlidingScale
                        question={question}
                        currentAnswer={currentAnswer}
                        onAnswer={onAnswer}
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
