import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ITestSection, IQuestion, IQuestionOption } from '../types';
import { QuestionRenderer } from './QuestionTypes/QuestionRenderer';

interface TestRunnerProps {
    testId: string;
    reviewSessionId?: string | null;
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

export const TestRunner: React.FC<TestRunnerProps> = ({ testId, reviewSessionId, onComplete, onCancel }) => {
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
    const [resultsPhase, setResultsPhase] = useState<'score' | 'insights' | 'review' | 'reflection' | 'feedback'>('score');
    const [selectedReflection, setSelectedReflection] = useState<number | null>(null);
    const [finalScore, setFinalScore] = useState<number>(0);
    const [earnedPoints, setEarnedPoints] = useState<number>(0);
    const [maxPointsPossible, setMaxPointsPossible] = useState<number>(0);
    const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);

    const [answerKeys, setAnswerKeys] = useState<Record<string, any>>({}); // qId -> { optId -> points or { val -> points } }

    // Initial Load: Fetch Test Data & Create Session
    useEffect(() => {
        const initSession = async () => {
            setLoading(true);
            try {
                // ... (Auth & Session creation - same as before) ...
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No user");

                // --- SESSION LOGIC ---
                let currentSessionId = sessionId;

                // A. Review Mode: Load existing session
                if (reviewSessionId) {
                    currentSessionId = reviewSessionId;
                    setSessionId(reviewSessionId);

                    // Fetch session metadata (score, status, etc.)
                    const { data: sessionData, error: sessionFetchError } = await supabase
                        .from('user_test_sessions')
                        .select('*')
                        .eq('id', reviewSessionId)
                        .single();

                    if (sessionFetchError) throw sessionFetchError;

                    // Hydrate State from Session Data
                    if (sessionData) {
                        setFinalScore(sessionData.score || 0);
                        // setTestTitle... (loaded below)
                    }

                }
                // B. New Session: Create if not exists
                else if (!currentSessionId) {
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
                            video_url,
                            correct_order,
                            scale_min,
                            scale_max,
                            question_text,
                            explanation,
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
                let formattedSections: any[] = [];

                if (sectionData && sectionData.length > 0) {
                    formattedSections = sectionData.map((s: any) => ({
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
                                            } else if (k.correct_answer) {
                                                // Handle Sliding Scale / Other types without option_id
                                                keys[q.id]['correct_value'] = k.correct_answer;
                                                keys[q.id]['points'] = k.points;
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
                } else if (sessionId) {
                    // Check if we have session_data from the earlier fetch (we need to access it)
                    // But we didn't store the full sessionData object in a scope accessible here?
                    // We did: `const { data: sessionData ... }` inside `if(reviewSessionId)` block above.
                    // But that var is scoped to that block!
                    // We need to re-fetch or hoist the variable.

                    // Quick fix: Fetch session_data here if sections are empty.
                    // Or better: rely on the fact that if reviewSessionId is set, we can fetch it.

                    if (reviewSessionId) {
                        const { data: legacySession } = await supabase
                            .from('user_test_sessions')
                            .select('session_data')
                            .eq('id', reviewSessionId)
                            .single();

                        const legacyQuestions = legacySession?.session_data?.questions;

                        if (legacyQuestions && Array.isArray(legacyQuestions)) {
                            // Map Legacy Questions to TestRunner Format
                            const mappedQuestions = legacyQuestions.map((q: any, idx: number) => {
                                const qId = q.id || `legacy-${idx}`;

                                // Map Keys
                                keys[qId] = {};
                                q.options.forEach((opt: any) => {
                                    if (opt.score > 0) {
                                        keys[qId][opt.id] = opt.score; // Assume max 1 point usually, or fractional
                                    }
                                });

                                return {
                                    id: qId,
                                    section_id: 'legacy-section',
                                    type: 'MCQ', // Treat all as MCQ for rendering simplicity
                                    scenario_context: q.branch, // Use branch as context tag
                                    scenario_image_url: q.imageUrl,
                                    question_text: q.scenario,
                                    explanation: q.explanation,
                                    order_index: idx,
                                    options: q.options.map((opt: any, optIdx: number) => ({
                                        id: opt.id,
                                        label: opt.text,
                                        value: opt.id,
                                        order_index: optIdx
                                    }))
                                };
                            });

                            formattedSections = [{
                                id: 'legacy-section',
                                title: 'Review Session',
                                instructions: 'Review your past answers.',
                                order_index: 0,
                                questions: mappedQuestions
                            }];
                        }
                    }
                }

                setSections(formattedSections);
                setAnswerKeys(keys);

                // --- HYDRATE RESPONSES FOR REVIEW ---
                if (reviewSessionId) {
                    const { data: userResponses, error: responsesError } = await supabase
                        .from('user_responses')
                        .select('*')
                        .eq('session_id', reviewSessionId);

                    if (!responsesError && userResponses) {
                        const hydratedResponses: Record<string, any> = {};

                        // Need to group Likert responses by QuestionID
                        // And map MCQ to OptionID (if available) or Value

                        userResponses.forEach((r: any) => {
                            // Find the question type from loaded sections
                            let qType = 'MCQ'; // Default
                            let relevantQ: any = null;

                            // Inefficient search but safe
                            for (const s of formattedSections) {
                                const found = s.questions.find((q: any) => q.id === r.question_id);
                                if (found) {
                                    qType = found.type;
                                    relevantQ = found;
                                    break;
                                }
                            }

                            if (relevantQ) {
                                if (qType === 'LIKERT_GRID') {
                                    // Structure: { [optId]: val }
                                    if (!hydratedResponses[r.question_id]) hydratedResponses[r.question_id] = {};
                                    if (r.question_option_id) {
                                        hydratedResponses[r.question_id][r.question_option_id] = r.response_value;
                                    }
                                } else if (qType === 'EMOTION_ORDER') {
                                    try {
                                        hydratedResponses[r.question_id] = JSON.parse(r.response_value);
                                    } catch (e) {
                                        hydratedResponses[r.question_id] = [];
                                    }
                                } else if (qType === 'SLIDING_SCALE') {
                                    hydratedResponses[r.question_id] = parseFloat(r.response_value);
                                } else {
                                    // Standard MCQ / VIDEO
                                    if (r.question_option_id) {
                                        hydratedResponses[r.question_id] = r.question_option_id;
                                    }
                                }
                            }
                        });

                        setResponses(hydratedResponses);

                        // Jump to Review Mode
                        setShowResults(true);
                        setResultsPhase('review');
                        setReviewQuestionIndex(0); // Start at first question
                    }
                }
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
        } else if (question.type === 'EMOTION_ORDER') {
            await supabase.from('user_responses').insert({
                session_id: sessionId,
                question_id: question.id,
                response_value: JSON.stringify(responseVal) // Store array as JSON string
            });
        } else if (question.type === 'SLIDING_SCALE') {
            await supabase.from('user_responses').insert({
                session_id: sessionId,
                question_id: question.id,
                response_value: String(responseVal)
            });
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

            // Debug logging
            console.log('=== SCORING DEBUG ===');
            console.log('Answer Keys:', answerKeys);
            console.log('User Responses:', responses);

            sections.forEach(section => {
                section.questions.forEach(q => {
                    const response = responses[q.id];
                    const questionKeys = answerKeys[q.id];

                    console.log(`Question ${q.id} (${q.type}):`, { response, questionKeys });

                    // Each question is worth 1 point max
                    maxPoints += 1;

                    if (response && questionKeys) {
                        if (q.type === 'LIKERT_GRID' && typeof response === 'object') {
                            // Loop through Rows (OptionIDs)
                            Object.entries(response).forEach(([optId, val]) => {
                                const rowKeys = questionKeys[optId]; // Should be { val: points }
                                if (rowKeys && typeof rowKeys === 'object') {
                                    const points = (rowKeys as any)[val as string];
                                    if (points) {
                                        console.log(`  Likert Row ${optId}: val=${val}, points=${points}`);
                                        totalPoints += points;
                                    }
                                }
                            });
                        } else if (typeof response === 'string') {
                            // MCQ / SCENARIO / VIDEO - check if response matches any answer key
                            const points = questionKeys[response];
                            console.log(`  MCQ/Scenario: response=${response}, points=${points}`);
                            if (typeof points === 'number') {
                                totalPoints += points;
                            }
                        } else if (q.type === 'SLIDING_SCALE' && typeof response === 'number') {
                            // Compare with correct_value
                            // We stored it in answerKeys[q.id]['correct_value'] (string)
                            // and points in answerKeys[q.id]['points']
                            const correctVal = parseFloat(questionKeys['correct_value'] as string);
                            const maxPts = questionKeys['points'] as number || 1;

                            if (response === correctVal) {
                                totalPoints += maxPts;
                            }
                        } else if (q.type === 'EMOTION_ORDER' && Array.isArray(response)) {
                            // Compare order with correct_order (on question object)
                            // q.correct_order is array of IDs (string[])
                            const correctOrder = q.correct_order;
                            if (correctOrder && Array.isArray(correctOrder)) {
                                const isCorrect = JSON.stringify(response) === JSON.stringify(correctOrder);
                                if (isCorrect) totalPoints += 1; // Default 1 pt for correct sequence
                            }
                        }
                    } else {
                        console.log(`  No response or no answer keys for this question`);
                    }
                });
            });

            console.log(`Total Points: ${totalPoints}, Max Points: ${maxPoints}`);

            const calculatedScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
            console.log(`Final Score: ${calculatedScore}%`);
            console.log('=== END SCORING DEBUG ===');

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

                        <div className="flex flex-col gap-4 items-center">
                            <button
                                onClick={() => { setReviewQuestionIndex(0); setResultsPhase('review'); }}
                                className="px-12 py-5 bg-white dark:bg-black text-black dark:text-white border border-gray-200 dark:border-white/20 rounded-full font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.95] transition-all"
                            >
                                Review Answers
                            </button>
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

        // Review Phase - Show all questions with answers and explanations
        if (resultsPhase === 'review') {
            // Flatten all questions for review navigation
            const allQuestions = sections.flatMap((s: any) =>
                s.questions.map((q: any) => ({ ...q, sectionTitle: s.title }))
            );
            const currentReviewQuestion = allQuestions[reviewQuestionIndex];
            const userResponse = currentReviewQuestion ? responses[currentReviewQuestion.id] : null;
            const questionKeys = currentReviewQuestion ? answerKeys[currentReviewQuestion.id] : null;

            // Find which option is the correct one (highest points)
            let correctOptionId: string | null = null;
            let maxPoints = 0;
            if (questionKeys && currentReviewQuestion?.type !== 'LIKERT_GRID') {
                Object.entries(questionKeys).forEach(([optId, pts]) => {
                    if (typeof pts === 'number' && pts > maxPoints) {
                        maxPoints = pts;
                        correctOptionId = optId;
                    }
                });
            }

            return (
                <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col p-6">
                    <div className="w-full max-w-3xl mx-auto flex-1 animate-fade-in-up">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onCancel()}
                                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                                    title="Back to Dashboard"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/50 mb-1 block">Review Mode</span>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentReviewQuestion?.sectionTitle}</h2>
                                </div>
                            </div>
                            <div className="text-sm font-bold text-gray-500 bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-full">
                                {reviewQuestionIndex + 1} / {allQuestions.length}
                            </div>
                        </div>

                        {currentReviewQuestion && (
                            <div className="space-y-6">
                                {/* Question Context */}
                                {currentReviewQuestion.scenario_context && (
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{currentReviewQuestion.scenario_context}</p>
                                    </div>
                                )}

                                {/* Question Image */}
                                {currentReviewQuestion.scenario_image_url && (
                                    <div className="rounded-2xl overflow-hidden max-w-[240px] mx-auto">
                                        <img src={currentReviewQuestion.scenario_image_url} alt="Question stimulus" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Video Question Support */}
                                {currentReviewQuestion.type === 'VIDEO' && currentReviewQuestion.video_url && (
                                    <div className="rounded-2xl overflow-hidden shadow-lg bg-black aspect-video max-w-lg mx-auto">
                                        {/* Simple render - ideally reuse VideoPlayer but we didn't export it. 
                                            We'll just duplicate simple iframe logic or show link if lazy. 
                                            Let's do simple iframe for now. */}
                                        <iframe
                                            src={currentReviewQuestion.video_url.includes('embed') ? currentReviewQuestion.video_url : currentReviewQuestion.video_url.replace('watch?v=', 'embed/')}
                                            className="w-full h-full" allowFullScreen
                                        />
                                    </div>
                                )}

                                {currentReviewQuestion.type === 'SLIDING_SCALE' && (
                                    <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                                        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Your Answer</div>
                                        <div className="text-4xl font-black mb-4">{userResponse}</div>

                                        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-500">Correct Answer</div>
                                        <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                                            {questionKeys ? questionKeys['correct_value'] : 'N/A'}
                                        </div>
                                    </div>
                                )}

                                {currentReviewQuestion.type === 'EMOTION_ORDER' && (
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Sequence Comparison</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-center font-bold mb-2 text-sm">Your Order</h4>
                                                <div className="space-y-2">
                                                    {(userResponse || []).map((id: string, idx: number) => {
                                                        const opt = currentReviewQuestion.options.find((o: any) => o.id === id);
                                                        return (
                                                            <div key={idx} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-2 rounded-lg text-xs font-medium flex gap-2">
                                                                <span className="font-bold text-gray-400">{idx + 1}</span>
                                                                {opt?.label || 'Unknown'}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-center font-bold mb-2 text-sm text-emerald-500">Correct Order</h4>
                                                <div className="space-y-2">
                                                    {(currentReviewQuestion.correct_order || []).map((id: string, idx: number) => {
                                                        const opt = currentReviewQuestion.options.find((o: any) => o.id === id);
                                                        return (
                                                            <div key={idx} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-2 rounded-lg text-xs font-medium flex gap-2">
                                                                <span className="font-bold text-emerald-400">{idx + 1}</span>
                                                                {opt?.label || 'Unknown'}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Question Text */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {currentReviewQuestion.question_text}
                                </h3>

                                {/* Options with feedback */}
                                <div className="space-y-3">
                                    {currentReviewQuestion.options?.map((opt: any) => {
                                        const isUserChoice = currentReviewQuestion.type === 'LIKERT_GRID'
                                            ? false  // Likert handled differently
                                            : userResponse === opt.id;
                                        const isCorrect = opt.id === correctOptionId;
                                        const optPoints = questionKeys && typeof questionKeys[opt.id] === 'number'
                                            ? questionKeys[opt.id] as number
                                            : 0;

                                        return (
                                            <div
                                                key={opt.id}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isUserChoice && isCorrect
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                                    : isUserChoice && !isCorrect
                                                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                                                        : isCorrect
                                                            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                                                            : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Indicator */}
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isUserChoice && isCorrect
                                                        ? 'bg-emerald-500 text-white'
                                                        : isUserChoice && !isCorrect
                                                            ? 'bg-rose-500 text-white'
                                                            : isCorrect
                                                                ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200'
                                                                : 'bg-gray-200 dark:bg-white/10'
                                                        }`}>
                                                        {isCorrect && (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        {isUserChoice && !isCorrect && (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`text-sm font-medium capitalize ${isUserChoice || isCorrect ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {opt.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isUserChoice && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Your Answer</span>
                                                    )}
                                                    {isCorrect && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Correct Answer</span>
                                                    )}
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${optPoints > 0
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                        }`}>
                                                        {optPoints} pts
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Explanation */}
                                {currentReviewQuestion.explanation && (
                                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 mt-6">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Expert Explanation</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {currentReviewQuestion.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100 dark:border-white/10">
                            <button
                                onClick={() => setReviewQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={reviewQuestionIndex === 0}
                                className="px-6 py-3 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                            >
                                Previous
                            </button>

                            {reviewQuestionIndex < allQuestions.length - 1 ? (
                                <button
                                    onClick={() => setReviewQuestionIndex(prev => prev + 1)}
                                    className="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.95] transition-all"
                                >
                                    Next Question
                                </button>
                            ) : (
                                <button
                                    onClick={() => reviewSessionId ? setResultsPhase('insights') : setResultsPhase('reflection')}
                                    className="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.95] transition-all"
                                >
                                    Finish Review
                                </button>
                            )}
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
