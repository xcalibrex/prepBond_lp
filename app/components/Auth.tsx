import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthProps {
    isDark?: boolean;
    toggleTheme?: () => void;
}

const AppLogo = ({ isDark }: { isDark: boolean }) => (
    <div className="relative w-14 h-14 flex items-center justify-center rounded-[24px] shadow-lg border border-gray-100 dark:border-white/10 p-4 bg-white dark:bg-zinc-950">
        <img
            src="/media/2.png"
            alt="PrepBond Logo Dark"
            className={`absolute w-[calc(100%-1.75rem)] h-[calc(100%-1.75rem)] object-contain transition-opacity duration-300 ${isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
        <img
            src="/media/3.png"
            alt="PrepBond Logo Light"
            className={`absolute w-[calc(100%-1.75rem)] h-[calc(100%-1.75rem)] object-contain transition-opacity duration-300 ${!isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
    </div>
);

export const Auth: React.FC<AuthProps> = ({ isDark = false, toggleTheme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            onboarding_complete: false
                        }
                    }
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Registration successful! Check your email to confirm.' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'An error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-black text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-500">
            {toggleTheme && (
                <div className="absolute top-6 right-6 z-50">
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-full bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all backdrop-blur-md shadow-sm"
                        aria-label="Toggle Theme"
                    >
                        {isDark ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                    </button>
                </div>
            )}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#050505]">
                <img
                    src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2832&auto=format&fit=crop"
                    alt="Abstract Intelligence"
                    className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                <div className="relative z-10 mt-auto p-16 max-w-2xl">
                    <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-xs font-medium tracking-wide text-white font-serif">PrepBond Intelligence v2.0</span>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight text-white">
                        Master the science of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">emotional calibration.</span>
                    </h1>
                    <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                        Join 4,000+ medical professionals using AI-driven psychometrics to refine their leadership and empathy skills.
                    </p>
                    <div className="mt-10 flex gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] text-white overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=262626`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex gap-1 text-amber-400 text-xs">★★★★★</div>
                            <span className="text-xs text-gray-500 font-medium">Trusted by Bond University Students</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full lg:w-[45%] flex items-center justify-center p-8 lg:p-12 relative bg-white dark:bg-black transition-colors duration-500">
                <div className="w-full max-w-[400px] relative z-10 animate-fade-in-up">
                    <div className="lg:hidden flex justify-center mb-8">
                        <AppLogo isDark={isDark} />
                    </div>
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            {isSignUp ? 'Create your account' : <span>Welcome to <span className="font-serif">PrepBond</span></span>}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {isSignUp ? 'Start your neuro-plasticity training today.' : 'Enter your credentials to access the simulation.'}
                        </p>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[24px] px-4 py-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all outline-none hover:bg-gray-100 dark:hover:bg-white/10"
                                placeholder="name@email.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[24px] px-4 py-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all outline-none hover:bg-gray-100 dark:hover:bg-white/10"
                                placeholder="••••••••"
                            />
                        </div>
                        {message && (
                            <div className={`p-4 rounded-[24px] text-xs font-medium border animate-fade-in ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300' : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-300'}`}>
                                {message.text}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up Free' : 'Sign In')}
                        </button>
                    </form>
                    <div className="mt-8 text-center pt-8 border-t border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-500">
                            {isSignUp ? 'Already a member? ' : <span>New to <span className="font-serif">PrepBond</span>? </span>}
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                                className="text-gray-900 dark:text-white font-bold hover:underline"
                            >
                                {isSignUp ? 'Log in' : 'Create account'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};