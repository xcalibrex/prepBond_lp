import React, { useState } from 'react';
import { generateAssessment } from '../services/geminiService';
import { MOCK_QUESTIONS, GENERIC_TEST_IDS } from '../constants';
import { AssessmentState, Branch } from '../types';
import { supabase } from '../services/supabase';

interface AssessmentProps {
  onComplete: (score: number, branch: Branch) => void;
  onCancel?: () => void;
  initialBranch?: Branch | null;
}

export const Assessment: React.FC<AssessmentProps> = ({ onComplete, onCancel, initialBranch }) => {
  const [state, setState] = useState<AssessmentState>({
    isActive: false,
    currentBranch: initialBranch || null,
    questions: [],
    currentIndex: 0,
    answers: {},
    isComplete: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);

  const [completionStats, setCompletionStats] = useState<{ score: number, branch: Branch } | null>(null);

  const startAssessment = async (branch?: Branch) => {
    setIsLoading(true);
    const targetBranch = branch || state.currentBranch;

    // Create Supabase Session immediately
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Determine Test ID
        const testId = targetBranch && GENERIC_TEST_IDS[targetBranch]
          ? GENERIC_TEST_IDS[targetBranch]
          : GENERIC_TEST_IDS.GENERAL;

        const { data: session, error } = await supabase
          .from('user_test_sessions')
          .insert({
            user_id: user.id,
            test_id: testId,
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (session) {
          setSessionId(session.id);
        }
      }
    } catch (err) {
      console.error("Failed to init session", err);
    }

    const aiQuestions = await generateAssessment(targetBranch || undefined);
    const questions = aiQuestions.length > 0 ? aiQuestions : MOCK_QUESTIONS;

    setState({
      isActive: true,
      currentBranch: targetBranch || questions[0].branch,
      questions,
      currentIndex: 0,
      answers: {},
      isComplete: false,
      isReviewing: false,
    });
    setCompletionStats(null);
    setIsLoading(false);
  };

  const handleAnswer = async () => {
    if (!selectedOption) return;

    const currentQ = state.questions[state.currentIndex];
    const option = currentQ.options.find(o => o.id === selectedOption);
    const score = option ? option.score : 0;

    const nextAnswers = { ...state.answers, [currentQ.id]: score };

    if (state.currentIndex < state.questions.length - 1) {
      setState((prev: AssessmentState) => ({
        ...prev,
        answers: nextAnswers,
        currentIndex: prev.currentIndex + 1
      }));
      setSelectedOption(null);
    } else {
      const scores = Object.values(nextAnswers) as number[];
      const totalScore = scores.reduce((a, b) => a + b, 0);
      const maxScore = state.questions.length;
      const finalPercentage = Math.round((totalScore / maxScore) * 100);

      // Save Completion to Supabase
      if (sessionId) {
        await supabase
          .from('user_test_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            total_score: finalPercentage,
            score: finalPercentage
          })
          .eq('id', sessionId);
      }

      setCompletionStats({ score: finalPercentage, branch: state.questions[0].branch });
      setState(prev => ({ ...prev, isActive: false, isComplete: true }));
      // Do NOT call onComplete yet. User sees Summary first.
    }
  };

  const startReview = () => {
    setState(prev => ({ ...prev, isReviewing: true, currentIndex: 0 }));
    setSelectedOption(null); // Clear selection for UI interaction if needed (though read-only)
  };

  const handleFinish = () => {
    if (completionStats) {
      onComplete(completionStats.score, completionStats.branch);
    } else {
      onCancel?.();
    }
  };

  const confirmExit = () => {
    if (onCancel) {
      onCancel();
    } else {
      setState(prev => ({ ...prev, isActive: false, isComplete: false, questions: [] }));
    }
    setShowExitConfirm(false);
  }

  // Pre-Assessment Screen
  if (!state.isActive && !state.isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[80vh] text-center animate-fade-in px-6">

        <div className="mb-8 cursor-pointer group" onClick={() => startAssessment()}>
          <div className="w-24 h-24 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px] flex items-center justify-center text-black dark:text-white transition-all duration-500 shadow-md group-hover:scale-110 group-hover:shadow-xl group-hover:border-black dark:group-hover:border-white">
            <svg className="w-10 h-10 transition-transform duration-500 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Mock Test Ready
        </h2>

        <p className="text-gray-500 dark:text-gray-400 text-base mb-8 leading-relaxed max-w-sm mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Enter the mock test. Your responses will adapt in real-time.
        </p>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-900 px-6 py-3 rounded-full border border-gray-100 dark:border-gray-800 flex items-center gap-3 shadow-sm animate-pulse">
            <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Initializing...</span>
          </div>
        ) : (
          <div className="flex flex-col w-full max-w-xs gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => startAssessment()}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-[200px] font-bold text-sm hover:opacity-90 transition-all shadow-md hover:scale-105 hover:-translate-y-1 active:scale-95"
            >
              Start Session
            </button>
            <button
              onClick={() => onCancel?.()}
              className="w-full bg-white dark:bg-black text-gray-700 dark:text-gray-300 py-3.5 rounded-[200px] font-medium text-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all shadow-sm hover:scale-105 hover:-translate-y-1 active:scale-95"
            >
              Go back to dashboard
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Summary View (Completion) ---
  if (state.isComplete && !state.isReviewing && completionStats) {
    const score = completionStats.score;
    const branch = completionStats.branch;

    return (
      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center animate-fade-in-up">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">{branch}</span>

        <div className="relative w-48 h-48 mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-200 dark:text-gray-800" />
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * score) / 100} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-black dark:text-white' : 'text-blue-500'}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none">{score}%</span>
          </div>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-sm mb-12">
          {score >= 90 ? "Exceptional. You demonstrated superior consensus accuracy." : score >= 75 ? "Strong performance. Your calibration is well-aligned." : "Competent. Continue to refine your micro-expression analysis."}
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={startReview} className="w-full bg-white dark:bg-black text-black dark:text-white border border-gray-200 dark:border-gray-800 py-3.5 rounded-[200px] font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm">
            Review Answers
          </button>
          <button onClick={handleFinish} className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-[200px] font-bold text-sm hover:opacity-90 transition-all shadow-md">
            Finish
          </button>
        </div>
      </div>
    );
  }

  // --- Review Mode ---
  if (state.isReviewing) {
    const currentQ = state.questions[state.currentIndex];
    // Note: We need to properly track which answer was SELECTED by the user.
    // Ideally we stored this in state.answers or a separate selection map. 
    // state.answers maps questionId -> score. It doesn't store the OPTION ID.
    // Limit: In the current simpler implementation, we only stored the score. 
    // To show "Your Choice", we need the option ID.
    // Currently `state.answers` is `Record<string, number>`.
    // We might not be able to highlight "Your Choice" exactly unless we stored it.
    // BUT, we can show the scores for all options, so the user can infer or we just show the optimal.
    // IMPROVEMENT: Let's assume for now we just show the optimal and explanations.
    // IF we need "Your Answer", we would need to refactor `state.answers` to store `{ score: number, optionId: string }`.
    // Let's proceed with showing scores for all options + explanation.

    return (
      <div className="w-full max-w-3xl mx-auto px-6 py-8 h-full flex flex-col relative animate-fade-in">
        {/* Review Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review Mode</h3>
          <div className="text-sm font-medium text-gray-500">{state.currentIndex + 1} / {state.questions.length}</div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md mb-4">
              {currentQ.branch}
            </span>
            {currentQ.imageUrl && (
              <div className="mb-6 rounded-[24px] overflow-hidden shadow-sm max-h-60 w-full object-cover">
                <img src={currentQ.imageUrl} alt="Stimulus" className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              {currentQ.scenario}
            </h3>
          </div>

          <div className="space-y-3 mb-8">
            {currentQ.options.map((opt) => (
              <div key={opt.id} className="flex justify-between items-center p-4 rounded-[16px] bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.text}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${opt.score === 1 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {/* Show score as percentage or decimal */}
                  {Math.round(opt.score * 100)}% Match
                </span>
              </div>
            ))}
          </div>

          {/* Explanation Block */}
          {currentQ.explanation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[24px] border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">Expert Analysis</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center gap-4 max-w-3xl mx-auto z-10">
          <button
            onClick={() => setState(prev => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }))}
            disabled={state.currentIndex === 0}
            className="px-6 py-3 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 font-bold text-sm disabled:opacity-50 shadow-sm"
          >
            Previous
          </button>
          {state.currentIndex < state.questions.length - 1 ? (
            <button
              onClick={() => setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }))}
              className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm shadow-lg"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm shadow-lg hover:scale-105 transition-transform"
            >
              Finish Review
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Active Assessment ---
  const currentQ = state.questions[state.currentIndex];
  const progress = ((state.currentIndex) / state.questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 h-full flex flex-col relative">

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white dark:bg-dark-nav p-6 rounded-[24px] shadow-2xl max-w-sm w-full animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">You will lose all progress for this mock test.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 px-4 py-2.5 rounded-[200px] bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Cancel</button>
              <button onClick={confirmExit} className="flex-1 px-4 py-2.5 rounded-[200px] bg-black dark:bg-white text-white dark:text-black font-medium text-sm hover:bg-red-600 dark:hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors shadow-sm">End Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Precision Progress Header */}
      <div className="flex items-center gap-6 mb-8 bg-[#F8F9FD] dark:bg-dark-nav p-5 rounded-[24px] shadow-sm border border-transparent dark:border-white/5 animate-fade-in-down">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-2 rounded-[24px] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
          title="End Session"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-black dark:bg-white transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 font-mono bg-white dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-100 dark:border-white/5">
          {state.currentIndex + 1}/{state.questions.length}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[#F8F9FD] dark:bg-dark-nav rounded-[24px] p-8 md:p-10 mb-6 flex-1 overflow-y-auto relative shadow-sm border border-transparent dark:border-white/5 animate-fade-in-up" key={currentQ.id}>

        <div className="mb-8 border-b border-gray-200 dark:border-white/5 pb-8">
          <span className="inline-block px-3 py-1 bg-white dark:bg-white/10 text-black dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-md mb-6 border border-gray-100 dark:border-transparent">
            {currentQ.branch}
          </span>
          {currentQ.imageUrl && (
            <div className="mb-8 rounded-[24px] overflow-hidden shadow-sm">
              <img src={currentQ.imageUrl} alt="Stimulus" className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
          )}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {currentQ.scenario}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt, i) => (
            <label
              key={opt.id}
              style={{ animationDelay: `${i * 100}ms` }}
              className={`flex items-center gap-4 p-5 rounded-[24px] cursor-pointer transition-all duration-200 border-none animate-fade-in-up hover:-translate-y-1 hover:shadow-lg ${selectedOption === opt.id
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/20'
                : 'bg-white dark:bg-dark-nav text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${selectedOption === opt.id ? 'border-white dark:border-black scale-110' : 'border-gray-400 dark:border-gray-500'}`}>
                {selectedOption === opt.id && <div className="w-2.5 h-2.5 bg-white dark:bg-black rounded-full"></div>}
              </div>
              <div className="text-base font-medium">
                {opt.text}
              </div>
              <input
                type="radio"
                name="question-option"
                value={opt.id}
                checked={selectedOption === opt.id}
                onChange={() => setSelectedOption(opt.id)}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <button
          disabled={!selectedOption}
          onClick={handleAnswer}
          className={`px-8 py-3.5 rounded-[200px] font-bold text-sm transition-all shadow-md ${selectedOption
            ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 hover:shadow-lg hover:scale-105 active:scale-95'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
        >
          {state.currentIndex === state.questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};