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
        targetId: 'tour-banner',
        title: 'Your Next Step',
        description: 'This shows you your next module. Start here at any time to continue your journey.',
        position: 'bottom'
    },
    {
        targetId: 'tour-stats',
        title: 'Performance Stats',
        description: "See where you rank and track your progress across key metrics.",
        position: 'bottom'
    },
    {
        targetId: 'tour-trajectory',
        title: 'Alignment Trajectory',
        description: 'Track your growth and trajectory against all 4 branches of the MSCEIT in real-time.',
        position: 'top'
    },
    {
        targetId: 'tour-roadmap',
        title: 'Calendar & Roadmap',
        description: 'Stay on track by adding tasks and following critical PrepBond key dates.',
        position: 'left'
    },
    {
        targetId: 'nav-curriculum',
        title: 'Curriculum',
        description: 'Progress your way to success by completing the modules successfully.',
        position: 'right'
    },
    {
        targetId: 'nav-analytics',
        title: 'Insight',
        description: 'Detailed breakdown of your emotional intelligence metrics and trends.',
        position: 'right'
    },
    {
        targetId: 'nav-history',
        title: 'History',
        description: 'Review your previous mock test results and track your improvement over time.',
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
                setIsVisible(false);
            }
        };

        // Small delay to ensure dashboard/nav is rendered
        const timer = setTimeout(updateRect, 100);
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
        };
    }, [currentStep, step.targetId]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

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
        if (step.position === 'left') {
            return {
                top: targetRect.top + targetRect.height / 2,
                right: (window.innerWidth - targetRect.left) + padding,
                transform: 'translateY(-50%)'
            };
        }
        if (step.position === 'bottom') {
            return {
                top: targetRect.bottom + padding,
                left: targetRect.left + targetRect.width / 2,
                transform: 'translateX(-50%)'
            };
        }
        if (step.position === 'top') {
            return {
                bottom: (window.innerHeight - targetRect.top) + padding,
                left: targetRect.left + targetRect.width / 2,
                transform: 'translateX(-50%)'
            };
        }
        return {};
    }, [targetRect, step.position]);

    const arrowStyle = useMemo(() => {
        if (step.position === 'left') return "top-1/2 -right-2 rotate-45 -translate-y-1/2 border-r border-t";
        if (step.position === 'right') return "top-1/2 -left-2 rotate-45 -translate-y-1/2 border-l border-b";
        if (step.position === 'top') return "top-[calc(100%-8px)] left-1/2 rotate-45 -translate-x-1/2 border-r border-b";
        if (step.position === 'bottom') return "-top-2 left-1/2 rotate-45 -translate-x-1/2 border-l border-t";
        return "";
    }, [step.position]);

    // Generate clip-path with cut-out (must be before early return for hooks rules)
    const clipPath = useMemo(() => {
        if (!targetRect) return 'none';

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const r = 12; // Radius
        const pad = 8; // Padding

        const x = targetRect.left - pad;
        const y = targetRect.top - pad;
        const w = targetRect.width + (pad * 2);
        const h = targetRect.height + (pad * 2);

        // Path: 
        // 1. Outer rectangle (Clockwise): 0,0 -> W,0 -> W,H -> 0,H -> Z
        // 2. Inner rounded rectangle (Counter-Clockwise) to create hole:
        //    Start Left Edge (after corner): x, y+r
        //    Line Down: x, y+h-r
        //    Arc Bottom-Left (CCW): x+r, y+h
        //    Line Right: x+w-r, y+h
        //    Arc Bottom-Right (CCW): x+w, y+h-r
        //    Line Up: x+w, y+r
        //    Arc Top-Right (CCW): x+w-r, y
        //    Line Left: x+r, y
        //    Arc Top-Left (CCW): x, y+r

        return `path('M 0 0 L ${windowWidth} 0 L ${windowWidth} ${windowHeight} L 0 ${windowHeight} Z M ${x} ${y + r} L ${x} ${y + h - r} A ${r} ${r} 0 0 0 ${x + r} ${y + h} L ${x + w - r} ${y + h} A ${r} ${r} 0 0 0 ${x + w} ${y + h - r} L ${x + w} ${y + r} A ${r} ${r} 0 0 0 ${x + w - r} ${y} L ${x + r} ${y} A ${r} ${r} 0 0 0 ${x} ${y + r} Z')`;
    }, [targetRect]);

    if (!isVisible || !targetRect) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop with holes */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-500 pointer-events-auto"
                style={{ clipPath }}
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
                    className={`absolute w-3 h-3 bg-white dark:bg-dark-nav border-gray-100 dark:border-white/10 ${arrowStyle}`}
                />
            </div>
        </div>
    );
};
