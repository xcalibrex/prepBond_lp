import React, { useState } from 'react';
import { generateAssessment } from '../services/geminiService';
import { MOCK_QUESTIONS } from '../constants';
import { AssessmentState, Branch } from '../types';

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

  const startAssessment = async (branch?: Branch) => {
    setIsLoading(true);
    const targetBranch = branch || state.currentBranch;
    const aiQuestions = await generateAssessment(targetBranch || undefined);
    const questions = aiQuestions.length > 0 ? aiQuestions : MOCK_QUESTIONS;
    
    setState({
      isActive: true,
      currentBranch: targetBranch || questions[0].branch,
      questions,
      currentIndex: 0,
      answers: {},
      isComplete: false,
    });
    setIsLoading(false);
  };

  const handleAnswer = () => {
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
      
      onComplete(finalPercentage, state.questions[0].branch);
      setState(prev => ({ ...prev, isActive: false, isComplete: true }));
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
                <div className="w-24 h-24 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center text-black dark:text-white transition-all duration-500 shadow-md group-hover:scale-110 group-hover:shadow-xl group-hover:border-black dark:group-hover:border-white">
                    <svg className="w-10 h-10 transition-transform duration-500 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight animate-fade-in-up" style={{animationDelay: '100ms'}}>
                Simulation Ready
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400 text-base mb-8 leading-relaxed max-w-sm mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
                Enter the simulation. Your responses will adapt in real-time.
            </p>
            
            {isLoading ? (
              <div className="bg-white dark:bg-gray-900 px-6 py-3 rounded-full border border-gray-100 dark:border-gray-800 flex items-center gap-3 shadow-sm animate-pulse">
                 <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-sm font-semibold text-gray-900 dark:text-white">Initializing...</span>
              </div>
            ) : (
              <div className="flex flex-col w-full max-w-xs gap-3 animate-fade-in-up" style={{animationDelay: '300ms'}}>
                <button 
                    onClick={() => startAssessment()}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md hover:scale-105 hover:-translate-y-1 active:scale-95"
                >
                  Start Session
                </button>
                <button 
                    onClick={() => startAssessment(Branch.Managing)}
                    className="w-full bg-white dark:bg-black text-gray-700 dark:text-gray-300 py-3.5 rounded-xl font-medium text-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all shadow-sm hover:scale-105 hover:-translate-y-1 active:scale-95"
                >
                  Quick Drill
                </button>
              </div>
            )}
       </div>
     );
  }

  const currentQ = state.questions[state.currentIndex];
  const progress = ((state.currentIndex) / state.questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 h-full flex flex-col relative">
       
       {/* Exit Confirmation Modal */}
       {showExitConfirm && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-fade-in px-4">
               <div className="bg-white dark:bg-[#0A0A0A] p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in-up">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">End Session?</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Progress for this module will not be saved.</p>
                   <div className="flex gap-3">
                       <button onClick={() => setShowExitConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Cancel</button>
                       <button onClick={confirmExit} className="flex-1 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium text-sm hover:bg-red-600 dark:hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors shadow-sm">End Session</button>
                   </div>
               </div>
           </div>
       )}

       {/* Precision Progress Header */}
       <div className="flex items-center gap-6 mb-8 bg-[#F8F9FD] dark:bg-[#0A0A0A] p-5 rounded-2xl shadow-sm border border-transparent dark:border-white/5 animate-fade-in-down">
           <button 
                onClick={() => setShowExitConfirm(true)}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
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
       <div className="bg-[#F8F9FD] dark:bg-[#0A0A0A] rounded-2xl p-8 md:p-10 mb-6 flex-1 overflow-y-auto relative shadow-sm border border-transparent dark:border-white/5 animate-fade-in-up" key={currentQ.id}>
          
          <div className="mb-8 border-b border-gray-200 dark:border-white/5 pb-8">
            <span className="inline-block px-3 py-1 bg-white dark:bg-white/10 text-black dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-md mb-6 border border-gray-100 dark:border-transparent">
                {currentQ.branch}
            </span>
            {currentQ.imageUrl && (
                <div className="mb-8 rounded-2xl overflow-hidden shadow-sm">
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
                className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-200 border-none animate-fade-in-up hover:-translate-y-1 hover:shadow-lg ${
                    selectedOption === opt.id 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/20' 
                    : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10'
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
              className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                selectedOption
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