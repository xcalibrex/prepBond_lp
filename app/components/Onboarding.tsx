
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface OnboardingProps {
    onComplete: () => void;
}

const QUESTIONS = [
    {
        id: 'role',
        title: "What best describes you?",
        options: [
            { id: 'student', label: 'Medical Student', icon: '🎓' },
            { id: 'professional', label: 'Healthcare Professional', icon: '🩺' },
            { id: 'leader', label: 'Team Leader', icon: '💼' },
            { id: 'enthusiast', label: 'EI Enthusiast', icon: '🧠' }
        ]
    },
    {
        id: 'goal',
        title: "What is your primary goal?",
        options: [
            { id: 'exam', label: 'Ace the MSCEIT Exam', icon: '📝' },
            { id: 'leadership', label: 'Improve Leadership', icon: '🚀' },
            { id: 'relationships', label: 'Better Relationships', icon: '🤝' },
            { id: 'awareness', label: 'Self Awareness', icon: '🧘' }
        ]
    },
    {
        id: 'experience',
        title: "Current experience with EI?",
        options: [
            { id: 'novice', label: 'Beginner', icon: '🌱' },
            { id: 'intermediate', label: 'Intermediate', icon: '🌿' },
            { id: 'advanced', label: 'Advanced', icon: '🌳' }
        ]
    }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = async (optionId: string) => {
        const currentQuestion = QUESTIONS[step];
        const newAnswers = { ...answers, [currentQuestion.id]: optionId };
        setAnswers(newAnswers);

        if (step < QUESTIONS.length - 1) {
            setStep(prev => prev + 1);
        } else {
            await handleSubmit(newAnswers);
        }
    };

    const handleSubmit = async (finalAnswers: Record<string, string>) => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    onboarding_complete: true,
                    profile: finalAnswers
                }
            });
            if (error) throw error;
            setTimeout(() => {
                onComplete();
            }, 1500);
        } catch (err) {
            console.error("Onboarding save failed", err);
            onComplete();
        }
    };

    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <div className="relative w-24 h-24 mb-8">
                     <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                     <svg className="animate-spin w-full h-full text-white" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="80" strokeDashoffset="20"></circle>
                     </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Personalizing prepMSCEIT...</h2>
                <p className="text-gray-400">Configuring your neural simulation based on your profile.</p>
            </div>
        );
    }

    const currentQ = QUESTIONS[step];
    const progress = ((step + 1) / QUESTIONS.length) * 100;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gray-800">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="w-full max-w-2xl z-10 animate-fade-in-up">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 block">Step {step + 1} of {QUESTIONS.length}</span>
                <h1 className="text-4xl md:text-5xl font-bold mb-12 leading-tight">
                    {currentQ.title}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((option, idx) => (
                        <button
                            key={option.id}
                            onClick={() => handleSelect(option.id)}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className="group flex items-center gap-6 p-6 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] text-left animate-fade-in-up"
                        >
                            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{option.icon}</span>
                            <span className="text-lg font-bold">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="absolute bottom-8 text-gray-500 text-xs font-mono">
                PRESS OPTION TO SELECT
            </div>
        </div>
    );
};
