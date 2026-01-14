
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface OnboardingProps {
    onComplete: () => void;
}

const MSCEIT_BRANCHES = [
    {
        id: 'perceiving',
        title: "Perceiving Emotions",
        description: "The ability to identify emotions in yourself and others through facial expressions, body language, and tone of voice.",
        summary: "Notice the subtle cues.",
        icon: "👁️",
        color: "from-blue-500 to-cyan-400"
    },
    {
        id: 'using',
        title: "Using Emotions",
        description: "Harnessing emotions to facilitate various cognitive activities, such as thinking and problem-solving.",
        summary: "Feel to think better.",
        icon: "⚡",
        color: "from-amber-400 to-orange-500"
    },
    {
        id: 'understanding',
        title: "Understanding Emotions",
        description: "Comprehending emotional language and appreciating complicated relationships among emotions.",
        summary: "Decipher the 'Why'.",
        icon: "🧠",
        color: "from-purple-500 to-pink-500"
    },
    {
        id: 'managing',
        title: "Managing Emotions",
        description: "Regulating emotions in yourself and others to promote emotional and intellectual growth.",
        summary: "Control the pulse.",
        icon: "🛡️",
        color: "from-emerald-400 to-teal-600"
    }
];

const EMOTIONAL_SCALE = [
    { label: 'Nervous', icon: '😰', value: 1, validation: "It's completely normal to feel nervous. Most of our top students felt the same way before they started. We've got your back.", encouragement: "Take a deep breath. You're in precisely the right place to build your confidence step-by-step." },
    { label: 'Uncertain', icon: '🤨', value: 2, validation: "Uncertainty is just the gap between where you are and where you want to be. Let's fill that gap together.", encouragement: "We'll clarify exactly what Bond is looking for so you can stop guessing and start preparing." },
    { label: 'Neutral', icon: '😐', value: 3, validation: "A balanced starting point is perfect. We'll help you turn that neutrality into focused precision.", encouragement: "Let's begin calibrating your emotional intelligence for peak performance." },
    { label: 'Curious', icon: '🤔', value: 4, validation: "Curiosity is the best mindset for learning! You're going to love diving into the mechanics of the MSCEIT.", encouragement: "That inquisitiveness will help you master the subtle nuances that others miss." },
    { label: 'Confident', icon: '✨', value: 5, validation: "That's the spirit! Let's channel that confidence into mastering the specific strategies required for Bond.", encouragement: "Let's refine those natural instincts into a high-scoring methodology." }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    // Phases: 'password' -> 'welcome' -> 'walkthrough' -> 'confidence' -> 'validation' -> 'launch' -> 'complete'
    const [phase, setPhase] = useState<'password' | 'welcome' | 'walkthrough' | 'confidence' | 'validation' | 'launch' | 'complete'>('password');
    const [walkthroughStep, setWalkthroughStep] = useState(0);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confidence, setConfidence] = useState<number | null>(null);

    // Skip password phase if they already have one (e.g. they signed up normally but haven't onboarded)
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            // This is a simplified check - usually, if they are from an invite, we want them to set it.
            // If they are logged in with a session, they might already have one.
        };
        checkUser();
    }, []);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;
            setPhase('walkthrough');
        } catch (err: any) {
            setError(err.message || "Failed to set password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfidenceSelect = (value: number) => {
        setConfidence(value);
        setPhase('validation');
    };

    const handleFinalizeOnboarding = async (startTest: boolean) => {
        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    onboarding_complete: true,
                    initial_confidence: confidence,
                    onboarded_at: new Date().toISOString()
                }
            });
            if (updateError) throw updateError;

            // Sync with profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({
                    onboarding_complete: true,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);
            }

            setPhase('complete');

            // Wait for animation then complete
            setTimeout(() => {
                if (startTest) {
                    onComplete(); // App logic starts modules
                } else {
                    // Force navigation to dashboard if skipping
                    window.location.href = window.location.origin + '/app/home/dashboard';
                }
            }, 2000);
        } catch (err) {
            console.error("Finalizing onboarding failed", err);
            onComplete();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (phase === 'password') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_#111_0%,_#000_100%)]">
                <div className="w-full max-w-md animate-fade-in-up">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-2 font-serif italic text-white">Create Your Security Key</h1>
                        <p className="text-gray-400 text-sm">Welcome to PrepBond. Please set a password to secure your exclusive access.</p>
                    </div>

                    <form onSubmit={handleSetPassword} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-white transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-white transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl animate-fade-in">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-5 bg-white text-black rounded-[200px] font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Securing...' : 'Set Password & Continue'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                <div className="w-full max-w-2xl text-center animate-fade-in-up">
                    <div className="relative w-32 h-32 mx-auto mb-10">
                        <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse"></div>
                        <img src="/media/2.png" className="w-full h-full object-contain relative z-10" alt="Logo" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 font-serif italic text-white tracking-tight leading-tight">Welcome to the Nexus.</h1>
                    <p className="text-xl text-gray-400 font-light leading-relaxed mb-12">
                        You’ve officially unlocked the most advanced AI-driven preparation environment for Bond Medicine. Let’s get you calibrated.
                    </p>
                    <button
                        onClick={() => setPhase('walkthrough')}
                        className="px-12 py-5 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-gray-200 active:scale-[0.95] transition-all"
                    >
                        Initialize Onboarding
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'walkthrough') {
        const branch = MSCEIT_BRANCHES[walkthroughStep];
        const progress = ((walkthroughStep + 1) / MSCEIT_BRANCHES.length) * 100;

        return (
            <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                    <div
                        className="h-full bg-white transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto z-10">
                    <div key={branch.id} className="animate-fade-in-up">
                        <div className={`w-24 h-24 rounded-[32px] bg-gradient-to-br ${branch.color} flex items-center justify-center text-5xl mb-10 mx-auto shadow-2xl animate-float`}>
                            {branch.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4 block">BRANCH {walkthroughStep + 1} OF 4</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-serif italic text-white tracking-tight">{branch.title}</h2>
                        <p className="text-xl text-gray-400 font-light leading-relaxed mb-12">
                            {branch.description}
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-2xl py-4 px-8 inline-block mb-12">
                            <span className="text-sm font-medium italic text-white/80">"{branch.summary}"</span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (walkthroughStep < MSCEIT_BRANCHES.length - 1) {
                                setWalkthroughStep(prev => prev + 1);
                            } else {
                                setPhase('confidence');
                            }
                        }}
                        className="px-12 py-5 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-gray-200 active:scale-[0.95] transition-all"
                    >
                        {walkthroughStep < MSCEIT_BRANCHES.length - 1 ? 'Next Branch' : 'Got it, what\'s next?'}
                    </button>
                </div>

                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br ${branch.color} rounded-full blur-[160px] opacity-[0.05] pointer-events-none transition-all duration-1000`} />
            </div>
        );
    }

    if (phase === 'confidence') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                <div className="w-full max-w-3xl text-center animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 font-serif italic text-white tracking-tight">How are we feeling?</h2>
                    <p className="text-lg text-gray-500 font-light mb-16">Before we start your first preparation session, how do you feel about the MSCEIT test right now?</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {EMOTIONAL_SCALE.map((item) => (
                            <button
                                key={item.value}
                                onClick={() => handleConfidenceSelect(item.value)}
                                className="group flex flex-col items-center gap-4 p-8 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white hover:text-black transition-all duration-500 hover:scale-105"
                            >
                                <span className="text-4xl group-hover:scale-110 transition-transform duration-500">{item.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'validation') {
        const selected = EMOTIONAL_SCALE.find(s => s.value === confidence);
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                <div className="w-full max-w-2xl text-center animate-fade-in-up">
                    <span className="text-5xl block mb-8">{selected?.icon}</span>
                    <h2 className="text-4xl font-bold mb-8 font-serif italic leading-tight">{selected?.validation}</h2>
                    <p className="text-xl text-gray-400 font-light leading-relaxed mb-12">
                        {selected?.encouragement}
                    </p>
                    <button
                        onClick={() => setPhase('launch')}
                        className="px-12 py-5 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-gray-200 active:scale-[0.95] transition-all"
                    >
                        Continue to Simulation
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'launch') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#0a0a0a_0%,_#000_100%)]">
                <div className="w-full max-w-2xl text-center animate-fade-in-up">
                    <div className="mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-widest text-white/60">SIMULATION READY</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 font-serif italic text-white tracking-tight leading-tight">Ready to start?</h2>
                    <p className="text-xl text-gray-400 font-light leading-relaxed mb-12">
                        Let's start with a diagnostic test to gauge your current scores across the 4 branches. This will identify your weakest areas instantly.
                    </p>

                    <div className="flex flex-col items-center gap-6">
                        <button
                            onClick={() => handleFinalizeOnboarding(true)}
                            className="w-full md:w-auto px-16 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
                        >
                            Let's Go
                        </button>
                        <button
                            onClick={() => handleFinalizeOnboarding(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors py-2"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <div className="relative w-32 h-32 mb-10">
                <div className="absolute inset-0 bg-white blur-3xl opacity-20 animate-pulse"></div>
                <img src="/media/2.png" className="w-full h-full object-contain animate-float" alt="Logo" />
            </div>
            <h2 className="text-3xl font-bold mb-3 font-serif italic">Nexus Calibrated.</h2>
            <p className="text-gray-400 text-sm font-light tracking-widest uppercase">Launching your first preparation module...</p>
        </div>
    );
};
