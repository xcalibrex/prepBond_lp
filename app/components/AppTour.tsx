import React, { useState, useEffect, useMemo } from 'react';
import { DS } from '../design-system';

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'right' | 'left' | 'top' | 'bottom';
}

interface AppTourProps {
    onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'nav-dashboard',
        title: 'Dashboard',
        description: 'An overview of your current performance across the 4 branches of the MSCEIT.',
        position: 'right'
    },
    {
        targetId: 'nav-curriculum',
        title: 'Curriculum',
        description: 'Progress your way to your best chance of success by completing the modules successfully.',
        position: 'right'
    }
];

export const AppTour: React.FC<AppTourProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const step = TOUR_STEPS[currentStep];

    useEffect(() => {
        const updateRect = () => {
            const el = document.getElementById(step.targetId);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                setIsVisible(true);
            } else {
                // If element not found (e.g. mobile nav), try mobile ID
                const mobileEl = document.getElementById(`mobile-${step.targetId}`);
                if (mobileEl) {
                    setTargetRect(mobileEl.getBoundingClientRect());
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [currentStep, step.targetId]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const spotlightStyle = useMemo(() => {
        if (!targetRect) return {};
        const padding = 8;
        return {
            clipPath: `inset(${targetRect.top - padding}px calc(100% - ${targetRect.right + padding}px) calc(100% - ${targetRect.bottom + padding}px) ${targetRect.left - padding}px rounded 12px)`
        };
    }, [targetRect]);

    const tooltipStyle = useMemo(() => {
        if (!targetRect) return {};
        const padding = 20;

        if (step.position === 'right') {
            return {
                top: targetRect.top + targetRect.height / 2,
                left: targetRect.right + padding,
                transform: 'translateY(-50%)'
            };
        }
        return {};
    }, [targetRect, step.position]);

    if (!isVisible || !targetRect) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop with holes */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-500 pointer-events-auto"
                style={{
                    maskImage: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 10}px, black ${Math.max(targetRect.width, targetRect.height) / 2 + 11}px)`,
                    WebkitMaskImage: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 10}px, black ${Math.max(targetRect.width, targetRect.height) / 2 + 11}px)`
                }}
            />

            {/* Tooltip Card */}
            <div
                className="absolute w-[300px] bg-white dark:bg-dark-nav border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-6 pointer-events-auto animate-fade-in-up transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={tooltipStyle}
            >
                <div className="mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-1">
                        STEP {currentStep + 1} OF {TOUR_STEPS.length}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif italic">
                        {step.title}
                    </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                    {step.description}
                </p>
                <div className="flex items-center justify-between">
                    <button
                        onClick={onComplete}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        Skip Tour
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>

                {/* Arrow */}
                <div
                    className="absolute top-1/2 -left-2 w-4 h-4 bg-white dark:bg-dark-nav border-l border-b border-gray-100 dark:border-white/10 rotate-45 -translate-y-1/2"
                />
            </div>
        </div>
    );
};
