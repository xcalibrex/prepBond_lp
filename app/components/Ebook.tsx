import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Helper for countdown
function useCountdown() {
    const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

    useEffect(() => {
        const updateCountdown = () => {
            const deadline = new Date('2026-01-22T23:45:00+10:00');
            const now = new Date();
            const diff = deadline.getTime() - now.getTime();

            if (diff > 0) {
                setTimeLeft({
                    days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0'),
                    hours: String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
                    minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
                    seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0'),
                });
            } else {
                setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    return timeLeft;
}

export const Ebook = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [mobileDatesOpen, setMobileDatesOpen] = useState(false);
    const [openApply, setOpenApply] = useState(false);
    const [selectedModule, setSelectedModule] = useState('perceiving');
    const [formLoading, setFormLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const timeLeft = useCountdown();

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const payload = {
                name,
                email,
                source: 'Ebook Dashboard Apply',
                timestamp: new Date().toISOString()
            };

            // Using the n8n webhook provided by the user
            const response = await fetch('https://omthentic.app.n8n.cloud/webhook/2d1120b1-6725-4264-ab87-8ffc324b0414', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Application submitted successfully!');
                setOpenApply(false);
            } else {
                throw new Error('Failed to submit');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Submission failed. This might be due to a CORS policy on the webhook. Please ensure the webhook allows requests from this domain.');
        } finally {
            setFormLoading(false);
        }
    };

    // Redirect if not authenticated (double check, though App.tsx handles protection)
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
            }
        };
        checkAuth();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-blue-100 selection:text-blue-900">
            <style>{`
        .text-label {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
        .sidebar-btn { transition: all 0.15s ease; }
        .sidebar-btn:hover { background: #F3F4F6; }
        .sidebar-btn.active { background: rgba(96, 165, 250, 0.1); color: #60A5FA; }
        .sidebar-btn.active .nav-label { color: #60A5FA; }
        .timeline-line {
            position: absolute; left: 15px; top: 36px; bottom: 16px; width: 1px;
            background: linear-gradient(to bottom, #60A5FA 0%, #E5E7EB 100%);
        }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }
        .date-item { transition: all 0.15s ease; }
        .date-item:hover { background: rgba(0, 0, 0, 0.02); }
      `}</style>

            {/* Deadline Banner */}
            <div className="fixed top-0 left-0 right-0 z-[60] bg-black text-white py-2.5 px-4">
                <div className="flex items-center justify-center gap-4 text-base md:text-lg">
                    <span className="hidden md:inline font-semibold">⏰ QTAC Applications close</span>
                    <span className="md:hidden font-semibold">⏰ QTAC closes</span>
                    <div className="flex items-center gap-2 font-bold tabular-nums">
                        <span className="bg-white/20 px-2.5 py-1 rounded text-lg">{timeLeft.days}d</span>
                        <span className="bg-white/20 px-2.5 py-1 rounded text-lg">{timeLeft.hours}h</span>
                        <span className="bg-white/20 px-2.5 py-1 rounded text-lg">{timeLeft.minutes}m</span>
                        <span className="bg-white/20 px-2.5 py-1 rounded text-lg hidden sm:inline">{timeLeft.seconds}s</span>
                    </div>
                    <button onClick={() => setOpenApply(true)} className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors">
                        Apply Now
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-12 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm h-16 pt-2 pb-2.5 flex items-center border-b border-gray-100">
                <div className="w-full px-4 md:px-6 flex justify-between items-center">
                    <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden p-2 -ml-2 text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2.5 md:flex-none absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
                        <img src="/media/3.png" className="w-7 h-7 object-contain" alt="PrepBond Logo" />
                        <span className="text-xl font-bold font-serif">PrepBond</span>
                    </div>

                    <button onClick={() => setOpenApply(true)} className="hidden md:block bg-black text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors">
                        Apply Here
                    </button>

                    <button onClick={() => setMobileDatesOpen(!mobileDatesOpen)} className="md:hidden p-2 -mr-2 text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Layout */}
            <main className="pt-28 min-h-screen flex pb-16 md:pb-0">

                {/* Sidebar Nav (Desktop) */}
                <aside className="hidden md:flex w-56 bg-white flex-col py-6 px-3 fixed left-0 top-28 bottom-0 overflow-y-auto">
                    <div className="px-3 mb-6">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Navigation</p>
                    </div>
                    <nav className="flex flex-col gap-1 flex-1">
                        {[
                            { id: 'home', label: 'Home', icon: <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
                            { id: 'info', label: 'The Blueprint', icon: <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /> },
                            { id: 'psychometric', label: 'Psychometric Test', icon: <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /> },
                            { id: 'personality', label: 'Personality Test', icon: <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
                            { id: 'interview', label: 'Interview Prep', icon: <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /> },
                            { id: 'coaching', label: 'Coaching', icon: <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /> }
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`sidebar-btn w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-left ${activeTab === item.id ? 'active' : 'text-gray-500 hover:text-black'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                    {item.icon}
                                </svg>
                                <span className="nav-label text-sm font-medium">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="mt-auto pt-6 px-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                            <span className="text-xs font-medium">Data Secured</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">© 2026 PrepBond</p>
                    </div>
                </aside>

                {/* Responsive Mobile Tab Bar */}
                <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
                    <div className="md:hidden bg-white border-b border-gray-100 overflow-x-auto flex-shrink-0">
                        <div className="flex px-4 py-2 gap-1 min-w-max">
                            {['home', 'info', 'psychometric', 'personality', 'interview', 'coaching'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6 md:p-10 bg-white custom-scroll overflow-y-auto md:mr-[340px]">
                        {activeTab === 'home' && (
                            <div className="animate-fade-in-up">
                                <div className="mb-10">
                                    <span className="text-label text-blue-400 mb-2 block">Success Roadmap</span>
                                    <h1 className="text-3xl md:text-4xl leading-tight mb-3 font-bold text-black">Your Strategic Path to <span className="text-blue-400 italic font-serif">Bond Medicine</span></h1>
                                    <p className="text-sm md:text-base text-gray-500 max-w-2xl">Getting into Bond isn't luck. It's calibration. Follow this roadmap to navigate the 2026 admissions cycle with precision.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="lg:col-span-2">
                                        <div className="relative pl-12 space-y-8">
                                            <div className="timeline-line"></div>
                                            {[
                                                { id: '1', tab: 'info', title: 'The Blueprint', desc: 'Understand the financial logic and selection metrics.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                                { id: '2', tab: 'psychometric', title: 'Psychometric Mastery', desc: 'Master MSCEIT and NEO PI-3 scoring.', color: 'text-gray-400', bg: 'bg-gray-100' },
                                                { id: '3', tab: 'interview', title: 'Interview Performance', desc: 'Build professional rapport under pressure.', color: 'text-gray-400', bg: 'bg-gray-100' },
                                                { id: '4', tab: 'coaching', title: 'Direct Strategy', desc: 'Refine delivery with expert clinicians.', color: 'text-gray-400', bg: 'bg-gray-100' }
                                            ].map((step, idx) => (
                                                <button key={step.id} onClick={() => setActiveTab(step.tab)} className="relative text-left w-full group block">
                                                    <div className={`absolute -left-3 top-0.5 w-7 h-7 rounded-full ${step.bg} border ${step.color === 'text-blue-400' ? 'border-blue-400/30' : 'border-gray-200'} flex items-center justify-center group-hover:bg-blue-400/20 transition-colors`}>
                                                        <span className={`text-[10px] font-bold ${step.color} group-hover:text-blue-400`}>{step.id}</span>
                                                    </div>
                                                    <div className="ml-6">
                                                        <span className="text-label text-blue-400">{idx === 0 ? 'Strategy Phase' : idx === 1 ? 'Calibration Phase' : idx === 2 ? 'Execution Phase' : 'Mentorship Phase'}</span>
                                                        <h3 className="text-xl font-semibold mt-0.5 mb-2 group-hover:text-blue-400 transition-colors text-black">{step.title}</h3>
                                                        <p className="text-gray-500">{step.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="animate-fade-in-up">
                                <div className="mb-8">
                                    <span className="text-label text-blue-400 mb-2 block">The Blueprint</span>
                                    <h1 className="text-3xl md:text-4xl leading-tight mb-3 font-bold">7 Strategic Chapters</h1>
                                    <p className="text-gray-500 max-w-2xl">Your comprehensive guide to the Bond Medicine admissions process.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        "The Bond Advantage", "The Numbers Game", "The Psychometric Test", "Regional Advantage", "The Interview Stand", "Financial Investment", "Your Strategy Starts Now"
                                    ].map((title, i) => (
                                        <div key={i} className={`p-5 rounded-xl bg-white border border-gray-200 hover:border-blue-400/30 hover:shadow-sm transition-all cursor-pointer group ${i === 6 ? 'lg:col-span-3' : ''}`}>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-blue-400">Chapter {i + 1}</span>
                                            <h3 className="font-semibold mt-1 text-lg text-black">{title}</h3>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'psychometric' && (
                            <div className="animate-fade-in-up">
                                <div className="mb-8">
                                    <h1 className="text-3xl md:text-4xl leading-tight mb-3 font-bold">Psychometric Test (MSCEIT)</h1>
                                    <p className="text-gray-500 max-w-3xl">Bond uses the MSCEIT to measure emotional intelligence. It assesses how you perceive, interpret, and respond to emotional context.</p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[20px] border border-gray-200 p-6">
                                        <h3 className="font-semibold text-lg mb-4 text-black">MSCEIT Modules</h3>
                                        <div className="space-y-2">
                                            {['perceiving', 'using', 'understanding', 'managing'].map(mod => (
                                                <button key={mod} onClick={() => setSelectedModule(mod)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${selectedModule === mod ? 'border-blue-400 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                                                    <span className="font-medium capitalize text-black">{mod} Emotions</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-[20px] border border-gray-200 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Logic Hack</span>
                                        </div>
                                        <div className="text-gray-500 italic">
                                            {selectedModule === 'perceiving' && <p>Successful students don't answer based on intuition. Scoring is standardized on emotional utility.</p>}
                                            {selectedModule === 'using' && <p>Match emotions to cognitive tasks. The test rewards understanding which emotional states enhance specific types of thinking.</p>}
                                            {selectedModule === 'understanding' && <p>Predict how emotions evolve and combine. Master the 'blend' questions.</p>}
                                            {selectedModule === 'managing' && <p>Choose actions that regulate emotions effectively in professional contexts.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Placeholders for other tabs for brevity, can be expanded */}
                        {(['personality', 'interview', 'coaching'].includes(activeTab)) && (
                            <div className="animate-fade-in-up">
                                <div className="mb-8">
                                    <h1 className="text-3xl md:text-4xl leading-tight mb-3 font-bold capitalize">{activeTab} Prep</h1>
                                    <p className="text-gray-500">Comprehensive preparation materials for {activeTab}.</p>
                                </div>
                                <div className="p-10 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                    <p className="text-gray-400">Content for {activeTab} is available in the full course.</p>
                                    <button onClick={() => setOpenApply(true)} className="mt-4 bg-black text-white px-6 py-2 rounded-full text-sm font-bold">Unlock Full Access</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar (Dates) */}
                    <aside className="hidden md:block w-[320px] bg-white border border-gray-200 rounded-[20px] p-6 overflow-y-auto custom-scroll fixed right-4 top-28 bottom-20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">2026 Key Dates</p>
                        <div className="space-y-2">
                            <div className="flex gap-3 p-3 rounded-xl bg-gray-50">
                                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>
                                <div><p className="text-xs font-semibold text-black">8 Jan · Info Session</p><p className="text-[10px] text-gray-500">Zoom · 5:00pm QLD</p></div>
                            </div>
                            <div className="flex gap-3 p-3 rounded-xl border border-red-100 bg-red-50">
                                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg></div>
                                <div><p className="text-xs font-semibold text-red-700">22 Jan · QTAC Closes</p><p className="text-[10px] text-red-600">11:45pm · CRITICAL</p></div>
                            </div>
                            {/* More dates... */}
                            <div className="flex gap-3 p-3 rounded-xl border border-green-100 bg-green-50">
                                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                <div><p className="text-xs font-semibold text-green-700">26 Mar · Offers Released</p><p className="text-[10px] text-green-600">8:30am QLD</p></div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <button onClick={() => setOpenApply(true)} className="w-full bg-black text-white py-3 rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors">Start Preparation Now</button>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Footer Banner */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-black py-3 px-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                    <span className="text-sm md:text-base font-medium text-white text-center">🎁 Claim <span className="font-bold">$500 off</span> your Bond Prep AI Platform</span>
                    <button onClick={() => setOpenApply(true)} className="bg-white text-black px-5 py-2 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors">Claim Now</button>
                </div>
            </div>

            {/* Apply Modal */}
            {openApply && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpenApply(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-xl animate-fade-in-up">
                        <button onClick={() => setOpenApply(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold mb-1 text-black">Apply for Intake</h3>
                            <p className="text-gray-500 text-sm">Start your path to the 99th percentile.</p>
                        </div>
                        <form className="space-y-4" onSubmit={handleApply}>
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full bg-black text-white py-3 rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50"
                            >
                                {formLoading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
