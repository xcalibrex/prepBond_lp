import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ITestSection, IQuestion, IQuestionOption } from '../types';
import { QuestionRenderer } from './QuestionTypes/QuestionRenderer';

interface TestRunnerProps {
    testId: string;
    onComplete: (score: number) => void;
    onCancel: () => void;
}

// Reflection scale (similar to onboarding)
const REFLECTION_SCALE = [
    { label: 'Overwhelmed', icon: '😰', value: 1, feedback: "That's completely okay. EI skills improve with practice. Review the sections you struggled with and try again when ready." },
    { label: 'Uncertain', icon: '🤨', value: 2, feedback: "Many questions in this test are intentionally nuanced. Focus on understanding WHY certain answers are preferred." },
    { label: 'Neutral', icon: '😐', value: 3, feedback: "A balanced response. Your analytical thinking is good - with more practice, you'll develop stronger emotional intuition." },
    { label: 'Confident', icon: '🤔', value: 4, feedback: "Great self-awareness! Your confidence suggests you're grasping the core concepts. Keep refining those instincts." },
    { label: 'Very Confident', icon: '✨', value: 5, feedback: "Excellent! You seem to have strong emotional intelligence intuition. Let's continue building on that foundation." }
];

export const TestRunner: React.FC<TestRunnerProps> = ({ testId, onComplete, onCancel }) => {
    const [sections, setSections] = useState<ITestSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [testTitle, setTestTitle] = useState<string>('');

    // State
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({}); // match question_id -> value (string | obj)
    const [submitting, setSubmitting] = useState(false);

    // Results State
    const [showResults, setShowResults] = useState(false);
    const [resultsPhase, setResultsPhase] = useState<'score' | 'insights' | 'reflection' | 'feedback'>('score');
    const [selectedReflection, setSelectedReflection] = useState<number | null>(null);
    const [finalScore, setFinalScore] = useState<number>(0);
    const [earnedPoints, setEarnedPoints] = useState<number>(0);
    const [maxPointsPossible, setMaxPointsPossible] = useState<number>(0);

    const [answerKeys, setAnswerKeys] = useState<Record<string, Record<string, number>>>({}); // qId -> { optId -> points }

    // Initial Load: Fetch Test Data & Create Session
    useEffect(() => {
        const initSession = async () => {
            setLoading(true);
            try {
                // ... (Auth & Session creation - same as before) ...
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No user");

                let currentSessionId = sessionId;
                if (!currentSessionId) {
                    const { data: sessionData, error: sessionError } = await supabase
                        .from('user_test_sessions')
                        .insert({ user_id: user.id, test_id: testId, status: 'in_progress' })
                        .select()
                        .single();

                    if (sessionError) throw sessionError;
                    currentSessionId = sessionData.id;
                    setSessionId(sessionData.id);
                }

                const { data: testData } = await supabase
                    .from('practice_tests')
                    .select('title')
                    .eq('id', testId)
                    .single();

                if (testData) setTestTitle(testData.title);

                // Fetch Sections & Questions (Nested) AND Answer Keys
                const { data: sectionData, error: fetchError } = await supabase
                    .from('test_sections')
                    .select(`
                        id, 
                        title, 
                        instructions,
                        questions (
                            id, 
                            section_id, 
                            type, 
                            scenario_context, 
                            scenario_image_url, 
                            question_text,
                            question_options (id, label, value, order_index),
                            answer_keys (question_id, question_option_id, correct_answer, points)
                        )
                    `)
                    .eq('test_id', testId)
                    .order('order_index');

                if (fetchError) throw fetchError;

                // Process Data
                // Map: QuestionID -> OptionID (Row) -> { [Value]: Points }
                // For MCQ: OptionID matches user selection. Value is ignored (or we use 'selected').
                // Ideally, we unify: Map QID -> ResponseValue -> Points.
                // But structure differs.
                // Let's use: Record<string, Record<string, number | Record<string, number>>>

                // Simplified for this Use Case:
                // MCQ: qId -> { [optId]: points }
                // Likert: qId -> { [optId]: { [val]: points } }

                const keys: any = {};

                const formattedSections = sectionData.map((s: any) => ({
                    ...s,
                    questions: s.questions
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((q: any) => {
                            // Extract Key
                            if (q.answer_keys && q.answer_keys.length > 0) {
                                keys[q.id] = keys[q.id] || {}; // Initialize

                                q.answer_keys.forEach((k: any) => {
                                    if (q.type === 'LIKERT_GRID') {
                                        // Nested Map for Likert: OptionID -> CorrectAnswer -> Points
                                        if (k.question_option_id && k.correct_answer) {
                                            if (!keys[q.id][k.question_option_id]) {
                                                keys[q.id][k.question_option_id] = {};
                                            }
                                            keys[q.id][k.question_option_id][k.correct_answer] = k.points;
                                        }
                                    } else {
                                        // Standard Map for MCQ: OptionID -> Points
                                        if (k.question_option_id) {
                                            keys[q.id][k.question_option_id] = k.points;
                                        }
                                    }
                                });
                            }

                            return {
                                ...q,
                                options: q.question_options.sort((a: any, b: any) => a.order_index - b.order_index)
                            };
                        })
                }));

                setSections(formattedSections);
                setAnswerKeys(keys);

            } catch (err) {
                console.error("Test init error", err);
                alert("Failed to load test. Please try again.");
                onCancel();
            } finally {
                setLoading(false);
            }
        };

        if (testId) initSession();
    }, [testId]);

    // Helpers
    const currentSection = sections[currentSectionIndex];
    const currentQuestion = currentSection?.questions[currentQuestionIndex];

    // Calculate total questions
    const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
    const answeredQuestions = Object.keys(responses).length;

    const handleAnswer = (val: any) => {
        setResponses(prev => ({
            ...prev,
            [currentQuestion.id]: val
        }));
    };

    const handleNext = async () => {
        await saveResponse(currentQuestion, responses[currentQuestion.id]);

        const isLastQuestionInSection = currentQuestionIndex === currentSection.questions.length - 1;
        const isLastSection = currentSectionIndex === sections.length - 1;

        if (isLastQuestionInSection) {
            if (isLastSection) {
                finishTest();
            } else {
                setCurrentSectionIndex(prev => prev + 1);
                setCurrentQuestionIndex(0);
            }
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const saveResponse = async (question: IQuestion, responseVal: any) => {
        if (!sessionId) return;

        if (question.type === 'LIKERT_GRID') {
            const entries = Object.entries(responseVal).map(([optId, val]) => ({
                session_id: sessionId,
                question_id: question.id,
                question_option_id: optId,
                response_value: val,
            }));
            await supabase.from('user_responses').insert(entries);
        } else {
            const selectedOpt = question.options.find(o => o.id === responseVal);
            await supabase.from('user_responses').insert({
                session_id: sessionId,
                question_id: question.id,
                question_option_id: selectedOpt?.id,
                response_value: selectedOpt?.value || responseVal as string
            });
        }
    };

    // ... (Helpers, handleAnswer, handleNext, etc. remain same) ...

    // MSCEIT Scoring: Points per section type
    const getSectionMaxPoints = (sectionTitle: string): number => {
        // ... (same as before) ...
        const title = sectionTitle.toLowerCase();
        if (title.includes('faces') || title.includes('pictures') || title.includes('section a') || title.includes('section e')) {
            return 10;
        } else if (title.includes('facilitation') || title.includes('sensations') || title.includes('section b') || title.includes('section f')) {
            return 6;
        } else if (title.includes('changes') || title.includes('blends') || title.includes('section c') || title.includes('section g')) {
            return 2;
        } else if (title.includes('management') || title.includes('section d') || title.includes('section h')) {
            return 8;
        }
        return 2;
    };

    const finishTest = async () => {
        setSubmitting(true);
        if (sessionId) {
            // Calculate score based on Answer Keys
            let totalPoints = 0;
            let maxPoints = 0;

            sections.forEach(section => {
                const pointsPerQuestion = getSectionMaxPoints(section.title);

                section.questions.forEach(q => {
                    const response = responses[q.id];
                    const questionKeys = answerKeys[q.id];

                    if (response && questionKeys) {
                        if (q.type === 'LIKERT_GRID' && typeof response === 'object') {
                            // Loop through Rows (OptionIDs)
                            Object.entries(response).forEach(([optId, val]) => {
                                const rowKeys = questionKeys[optId]; // Should be { val: points }
                                if (rowKeys && typeof rowKeys === 'object') {
                                    const points = (rowKeys as any)[val as string];
                                    if (points) {
                                        totalPoints += points;
                                    }
                                }
                            });
                        } else if (typeof response === 'string') {
                            // MCQ / SCENARIO
                            const points = questionKeys[response];
                            if (typeof points === 'number') {
                                totalPoints += points;
                            }
                        }
                    }
                    maxPoints += pointsPerQuestion;
                });
            });

            const calculatedScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
            setFinalScore(calculatedScore);
            setEarnedPoints(totalPoints);
            setMaxPointsPossible(maxPoints);

            await supabase
                .from('user_test_sessions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    score: calculatedScore
                })
                .eq('id', sessionId);

            setSubmitting(false);
            setShowResults(true);
            setResultsPhase('score');
        }
    };

    const handleReflectionSelect = async (value: number) => {
        setSelectedReflection(value);

        // Save reflection to session
        if (sessionId) {
            await supabase
                .from('user_test_sessions')
                .update({ reflection_score: value })
                .eq('id', sessionId);
        }

        setResultsPhase('feedback');
    };

    const handleCloseResults = () => {
        onComplete(finalScore);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading Assessment</p>
            </div>
        </div>
    );

    // ========== RESULTS VIEW ==========
    if (showResults) {
        // Score Phase
        if (resultsPhase === 'score') {
            return (
                <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#f5f5f5_0%,_#fff_100%)] dark:bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                    <div className="w-full max-w-2xl text-center animate-fade-in-up">
                        <div className="mb-8">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/50 mb-4 block">Assessment Complete</span>
                            <h1 className="text-5xl md:text-6xl font-bold font-serif italic text-black dark:text-white tracking-tight mb-4">
                                {testTitle || 'Assessment'}
                            </h1>
                        </div>

                        <div className="relative mb-12">
                            <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-2xl">
                                <div className="text-center">
                                    <span className="text-6xl font-black text-white">{finalScore}</span>
                                    <span className="text-2xl font-bold text-white/80">%</span>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full -z-10"></div>
                        </div>

                        <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 mb-8">
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-black dark:text-white">{earnedPoints}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Points</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">/ {maxPointsPossible}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Max</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-black dark:text-white">{sections.length}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sections</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                                        {finalScore >= 80 ? 'Excellent' : finalScore >= 70 ? 'Good' : 'Developing'}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Rating</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setResultsPhase('insights')}
                            className="px-12 py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.95] transition-all"
                        >
                            View Insights
                        </button>
                    </div>
                </div>
            );
        }

        // Insights Phase (NEW)
        if (resultsPhase === 'insights') {
            return (
                <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#f5f5f5_0%,_#fff_100%)] dark:bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                    <div className="w-full max-w-2xl animate-fade-in-up">
                        <div className="text-center mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/50 mb-4 block">Your Performance</span>
                            <h1 className="text-4xl md:text-5xl font-bold font-serif italic text-black dark:text-white tracking-tight">
                                Key Insights
                            </h1>
                        </div>

                        {/* Insights Cards */}
                        <div className="space-y-4 mb-10">
                            <div className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Accuracy</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {finalScore >= 75
                                            ? 'Your responses closely matched expert consensus. Great emotional perception!'
                                            : 'Some of your responses differed from expert consensus. Review the nuances between similar emotions.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Response Pattern</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {finalScore >= 70
                                            ? 'You demonstrated consistent reasoning across different scenarios and question types.'
                                            : 'Try to identify patterns in how emotions relate to situations. This will improve consistency.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">📈</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Growth Opportunity</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {finalScore >= 80
                                            ? 'Keep challenging yourself with more complex emotional scenarios to maintain your edge.'
                                            : 'Focus on understanding the subtle differences between related emotions like frustration vs. anger.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Personalized Feedback */}
                        <div className={`p-6 rounded-3xl border mb-10 ${finalScore >= 80
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                            : finalScore >= 60
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                                : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'
                            }`}>
                            <p className={`text-sm leading-relaxed ${finalScore >= 80
                                ? 'text-emerald-800 dark:text-emerald-300'
                                : finalScore >= 60
                                    ? 'text-amber-800 dark:text-amber-300'
                                    : 'text-rose-800 dark:text-rose-300'
                                }`}>
                                {finalScore >= 80
                                    ? "Excellent work! You demonstrated strong emotional intelligence in this assessment. Your ability to read and interpret emotional cues aligns well with expert models."
                                    : finalScore >= 60
                                        ? "You're making solid progress! Your foundational understanding is there. Focus on the nuanced differences between similar emotions to improve further."
                                        : "This is a great starting point. Emotional intelligence develops with practice. Review the theory and try again - you'll see improvement with each attempt."}
                            </p>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => setResultsPhase('reflection')}
                                className="px-12 py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.95] transition-all"
                            >
                                Continue to Reflection
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Reflection Phase
        if (resultsPhase === 'reflection') {
            return (
                <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#f5f5f5_0%,_#fff_100%)] dark:bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                    <div className="w-full max-w-3xl text-center animate-fade-in-up">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-serif italic text-black dark:text-white tracking-tight">
                            How do you feel about your performance?
                        </h2>
                        <p className="text-lg text-gray-500 font-light mb-16">
                            Self-reflection is a key part of emotional intelligence development. Be honest with yourself.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {REFLECTION_SCALE.map((item) => (
                                <button
                                    key={item.value}
                                    onClick={() => handleReflectionSelect(item.value)}
                                    className="group flex flex-col items-center gap-4 p-8 rounded-[32px] bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-500 hover:scale-105"
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

        // Feedback Phase
        if (resultsPhase === 'feedback') {
            const selected = REFLECTION_SCALE.find(s => s.value === selectedReflection);
            return (
                <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#f5f5f5_0%,_#fff_100%)] dark:bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                    <div className="w-full max-w-2xl text-center animate-fade-in-up">
                        <span className="text-6xl block mb-8">{selected?.icon}</span>
                        <h2 className="text-4xl font-bold mb-8 font-serif italic leading-tight text-black dark:text-white">{selected?.feedback}</h2>

                        <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 mb-12">
                            <div className="flex items-center justify-center gap-6 mb-4">
                                <div className="text-center">
                                    <span className="text-4xl font-black text-black dark:text-white">{finalScore}%</span>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Score</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200 dark:bg-white/10"></div>
                                <div className="text-center">
                                    <span className="text-4xl font-black text-black dark:text-white">{earnedPoints}<span className="text-xl text-gray-400">/{maxPointsPossible}</span></span>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Points</p>
                                </div>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Your results have been saved. You can view detailed breakdowns in your History.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={handleCloseResults}
                                className="px-12 py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.95] transition-all"
                            >
                                Close & Return
                            </button>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                                This tab will close
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // ========== QUESTION VIEW ==========
    if (!currentSection || !currentQuestion) return <div>Error: No questions found.</div>;

    const currentLocalAnswer = responses[currentQuestion.id];
    const isGridComplete = currentQuestion.type === 'LIKERT_GRID'
        ? Object.keys(currentLocalAnswer || {}).length === currentQuestion.options.length
        : !!currentLocalAnswer;

    return (
        <div className="h-screen w-full overflow-y-auto bg-white dark:bg-black/20 custom-scrollbar">
            <div className="max-w-4xl mx-auto p-6 flex flex-col min-h-full">
                {/* Header / Nav */}
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-white/10 pb-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-1">{currentSection.title}</h2>
                        <p className="text-xs text-gray-500">{currentSectionIndex + 1} of {sections.length} Sections</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Instruction if first Question in section */}
                {currentQuestionIndex === 0 && currentSection.instructions && (
                    <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 animate-fade-in-up">
                        <h4 className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Instructions</h4>
                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{currentSection.instructions}</p>
                    </div>
                )}

                {/* Renderer */}
                <div className="flex-1">
                    <QuestionRenderer
                        question={currentQuestion}
                        currentAnswer={currentLocalAnswer}
                        onAnswer={handleAnswer}
                    />
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent sticky bottom-0 z-10 p-4">
                    <div className="text-xs font-bold text-gray-400">
                        Question {currentQuestionIndex + 1} of {currentSection.questions.length}
                    </div>
                    <button
                        disabled={!isGridComplete || submitting}
                        onClick={handleNext}
                        className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg
                        ${isGridComplete
                                ? 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95'
                                : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'}`}
                    >
                        {submitting ? 'Submitting...' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};
