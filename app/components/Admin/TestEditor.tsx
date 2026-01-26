import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ITestSection, Branch } from '../../types';
import toast from 'react-hot-toast';

interface TestEditorProps {
    testId: string;
    onClose: () => void;
}

// Helper for inputs to avoid re-rendering parent on every keystroke
const AutoSaveInput: React.FC<{
    value: string;
    onSave: (val: string) => void;
    className?: string;
    placeholder?: string;
    isTextArea?: boolean;
    autoFocus?: boolean;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({ value, onSave, className, placeholder, isTextArea, autoFocus, onKeyDown }) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync only when prop changes significantly (e.g. switching questions)
    // We avoid resetting on every render if the parent state is just updating from the same input
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onSave(localValue);
        }
    };

    if (isTextArea) {
        return (
            <textarea
                className={`${className} transition-all duration-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none`}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                placeholder={placeholder}
                autoFocus={autoFocus}
                onKeyDown={onKeyDown}
            />
        );
    }
    return (
        <input
            className={`${className} transition-all duration-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none`}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
        />
    );
};

export const TestEditor: React.FC<TestEditorProps> = ({ testId, onClose }) => {
    const [sections, setSections] = useState<ITestSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [testMeta, setTestMeta] = useState<{ title: string; branch: Branch | null }>({ title: '', branch: null });

    // Modal State
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [focusedOptionId, setFocusedOptionId] = useState<string | null>(null);

    // helper to sort
    const sortHierarchy = (data: any[]) => {
        return data.map((s: any) => ({
            ...s,
            questions: (s.questions || [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((q: any) => ({
                    ...q,
                    options: (q.question_options || q.options || [])
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                }))
        })).sort((a: any, b: any) => a.order_index - b.order_index);
    };

    // Fetch full test hierarchy
    const fetchTestDetails = async () => {
        if (sections.length === 0) setIsLoading(true);

        const { data: testData } = await supabase
            .from('practice_tests')
            .select('title, branch')
            .eq('id', testId)
            .single();

        if (testData) {
            const DB_TO_BRANCH: Record<string, Branch> = {
                'PERCEIVING': Branch.Perceiving,
                'USING': Branch.Using,
                'UNDERSTANDING': Branch.Understanding,
                'MANAGING': Branch.Managing
            };
            setTestMeta({
                title: testData.title,
                branch: testData.branch ? DB_TO_BRANCH[testData.branch] : null
            });
        }

        const { data: sectionData, error } = await supabase
            .from('test_sections')
            .select(`
                *,
                questions (
                    *,
                    question_options (*),
                    answer_keys (*)
                )
            `)
            .eq('test_id', testId)
            .order('order_index');

        if (error) {
            console.error('Error fetching sections:', error);
        } else if (sectionData) {
            // Map answer_keys to a simpler property on the question
            const processedSections = sectionData.map((s: any) => ({
                ...s,
                questions: (s.questions || [])
                    .map((q: any) => ({
                        ...q,
                        // Attach correct_option_id from answer_keys if it exists
                        correct_option_id: q.answer_keys?.[0]?.question_option_id || null,
                        options: (q.question_options || [])
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                    }))
                    .sort((a: any, b: any) => a.order_index - b.order_index)
            })).sort((a: any, b: any) => a.order_index - b.order_index);

            setSections(processedSections.map((s: any) => ({
                ...s,
                branch: s.branch ? DB_TO_BRANCH[s.branch] : null
            })));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTestDetails();
    }, [testId]);

    // --- Meta Handlers ---
    const updateTestMeta = async (updates: any) => {
        // Optimistic
        setTestMeta(prev => ({ ...prev, ...updates }));

        if (updates.branch) {
            const BRANCH_TO_DB: Record<string, string> = {
                [Branch.Perceiving]: 'PERCEIVING',
                [Branch.Using]: 'USING',
                [Branch.Understanding]: 'UNDERSTANDING',
                [Branch.Managing]: 'MANAGING'
            };
            updates.branch = BRANCH_TO_DB[updates.branch];
            updates.branch = BRANCH_TO_DB[updates.branch];
        }

        await supabase.from('practice_tests').update(updates).eq('id', testId);
    };

    // Helper for branch mapping (used in sections too)
    const BRANCH_TO_DB: Record<string, string> = {
        [Branch.Perceiving]: 'PERCEIVING',
        [Branch.Using]: 'USING',
        [Branch.Understanding]: 'UNDERSTANDING',
        [Branch.Managing]: 'MANAGING'
    };

    const DB_TO_BRANCH: Record<string, Branch> = {
        'PERCEIVING': Branch.Perceiving,
        'USING': Branch.Using,
        'UNDERSTANDING': Branch.Understanding,
        'MANAGING': Branch.Managing
    };


    // --- Section Handlers ---
    const handleAddSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectionTitle) return;

        const optimisticId = crypto.randomUUID();
        const newSection = {
            id: optimisticId,
            test_id: testId,
            title: newSectionTitle,
            instructions: '',
            order_index: sections.length,
            questions: []
        };

        // Optimistic Update
        setSections([...sections, newSection]);
        setNewSectionTitle('');
        setIsAddSectionOpen(false);

        const { error } = await supabase
            .from('test_sections')
            .insert([newSection]);

        if (error) {
            console.error('Add section failed', error);
            // Revert likely needed in real prod, but for now we rely on eventual consistency or reload
        }
    };

    const updateSection = async (sectionId: string, updates: Partial<ITestSection>) => {
        // Optimistic
        setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));

        // DB
        // Check for branch update to map to DB value
        const dbUpdates = { ...updates };
        if (updates.branch) {
            (dbUpdates as any).branch = BRANCH_TO_DB[updates.branch];
        }

        await supabase.from('test_sections').update(dbUpdates).eq('id', sectionId);
    };

    const deleteSection = async (sectionId: string) => {
        if (!confirm('Delete section and all its questions?')) return;

        // Optimistic
        setSections(sections.filter(s => s.id !== sectionId));

        await supabase.from('test_sections').delete().eq('id', sectionId);
    };

    // --- Question Handlers ---
    const addQuestion = async (sectionId: string) => {
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;

        const optimisticId = crypto.randomUUID();
        const newQuestion = {
            id: optimisticId,
            section_id: sectionId,
            question_text: 'New Question',
            type: 'MCQ' as const, // Explicit literal type
            order_index: (sections[sectionIndex].questions || []).length, // append to end
            options: [], // important for UI
            explanation: '' // New field
        };

        // Optimistic Update
        const newSections = [...sections];
        newSections[sectionIndex].questions = [...newSections[sectionIndex].questions, newQuestion];
        setSections(newSections);

        const { error } = await supabase
            .from('questions')
            .insert([{
                id: optimisticId,
                section_id: sectionId,
                question_text: 'New Question',
                type: 'MCQ',
                order_index: newQuestion.order_index,
                explanation: ''
            }]);

        if (error) console.error('Add question failed', error);
    };

    const deleteQuestion = async (sectionId: string, questionId: string) => {
        if (!confirm('Delete question?')) return;

        const newSections = sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.filter((q: any) => q.id !== questionId)
            };
        });
        setSections(newSections);

        await supabase.from('questions').delete().eq('id', questionId);
    };

    const updateQuestion = async (sectionId: string, questionId: string, updates: any) => {
        // Optimistic Update
        const newSections = sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map((q: any) =>
                    q.id === questionId ? { ...q, ...updates } : q
                )
            };
        });
        setSections(newSections);

        await supabase.from('questions').update(updates).eq('id', questionId);
    }

    // --- Answer Key Handler ---
    const setCorrectAnswer = async (sectionId: string, questionId: string, optionId: string) => {
        // 1. Optimistic Update (UI Only - currently supports single correct visual)
        const newSections = sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map((q: any) =>
                    q.id === questionId ? { ...q, correct_option_id: optionId } : q
                )
            };
        });
        setSections(newSections);

        // 2. Logic & DB Update
        await updateAnswerKeys(sectionId, questionId, optionId, sections);
    };

    const updateAnswerKeys = async (sectionId: string, questionId: string, primaryOptionId: string, currentSections: ITestSection[]) => {
        const section = currentSections.find(s => s.id === sectionId);
        const question = section?.questions.find((q: any) => q.id === questionId);

        if (!question) return;

        // Clear existing keys for this question
        await supabase.from('answer_keys').delete().eq('question_id', questionId);

        const keysToInsert = [];

        if (question.type === 'LIKERT_GRID') {
            // Logic: 2 pts for correct, 1 pt for adjacent
            const primaryOption = question.options.find((o: any) => o.id === primaryOptionId);
            if (!primaryOption) return;

            const primaryVal = parseInt(primaryOption.value);

            // Primary Key (2 pts)
            keysToInsert.push({
                question_id: questionId,
                question_option_id: primaryOptionId,
                points: 2
            });

            // Adjacent Keys (1 pt)
            if (!isNaN(primaryVal)) {
                const lowerVal = primaryVal - 1;
                const upperVal = primaryVal + 1;

                question.options.forEach((opt: any) => {
                    const val = parseInt(opt.value);
                    if (val === lowerVal || val === upperVal) {
                        keysToInsert.push({
                            question_id: questionId,
                            question_option_id: opt.id,
                            points: 1
                        });
                    }
                });
            }
        } else {
            // Default MCQ / Scenario Logic (2 pts for now, standard)
            keysToInsert.push({
                question_id: questionId,
                question_option_id: primaryOptionId,
                points: 2
            });
        }

        if (keysToInsert.length > 0) {
            const { error } = await supabase.from('answer_keys').insert(keysToInsert);
            if (error) console.error('Error saving answer keys:', error);
        }
    };

    const handleSaveTest = async () => {
        const loadingId = toast.loading("Saving test...", { position: 'top-center' });
        try {
            // 1. Upsert Test Meta
            await supabase.from('practice_tests').update({
                title: testMeta.title,
                branch: testMeta.branch ? ({
                    [Branch.Perceiving]: 'PERCEIVING',
                    [Branch.Using]: 'USING',
                    [Branch.Understanding]: 'UNDERSTANDING',
                    [Branch.Managing]: 'MANAGING'
                } as any)[testMeta.branch] : null
            }).eq('id', testId);

            // 2. Process Sections & Content
            for (const section of sections) {
                // Upsert Section
                await supabase.from('test_sections').upsert({
                    id: section.id,
                    test_id: testId,
                    title: section.title,
                    instructions: section.instructions || '',
                    order_index: section.order_index,
                    branch: section.branch ? BRANCH_TO_DB[section.branch] : null
                });

                // Upsert Questions
                for (const q of section.questions) {
                    await supabase.from('questions').upsert({
                        id: q.id,
                        section_id: section.id,
                        question_text: q.question_text,
                        type: q.type,
                        order_index: q.order_index,
                        scenario_context: q.scenario_context,
                        scenario_image_url: q.scenario_image_url,
                        explanation: (q as any).explanation
                    });

                    // Upsert Options
                    if (q.options && q.options.length > 0) {
                        const formattedOptions = q.options.map((o: any) => ({
                            id: o.id,
                            question_id: q.id,
                            label: o.label,
                            value: o.value,
                            order_index: o.order_index
                        }));
                        await supabase.from('question_options').upsert(formattedOptions);
                    }

                    // Re-calculate and Save Answer Keys (Ensure Consistency)
                    // Only if a correct option is visually selected in UI state OR it's a Likert Grid
                    if ((q as any).correct_option_id || q.type === 'LIKERT_GRID') {
                        await updateAnswerKeys(section.id, q.id, (q as any).correct_option_id, sections);
                    }
                }
            }
            toast.success("Test saved successfully!", { id: loadingId, position: 'top-center' });
        } catch (e) {
            console.error("Save error", e);
            toast.error("Failed to save test", { id: loadingId, position: 'top-center' });
        }
    };

    // --- Option Handlers ---
    const addOption = async (sectionId: string, questionId: string) => {
        const sIdx = sections.findIndex(s => s.id === sectionId);
        if (sIdx === -1) return;
        const qIdx = sections[sIdx].questions.findIndex((q: any) => q.id === questionId);
        if (qIdx === -1) return;

        const optimisticId = crypto.randomUUID();
        const newOption = {
            id: optimisticId,
            question_id: questionId,
            label: 'New Option',
            value: '0',
            order_index: (sections[sIdx].questions[qIdx].options || []).length
        };

        // Optimistic
        const newSections = [...sections];
        // Ensure options array exists
        if (!newSections[sIdx].questions[qIdx].options) newSections[sIdx].questions[qIdx].options = [];
        newSections[sIdx].questions[qIdx].options.push(newOption);
        setSections(newSections);

        await supabase.from('question_options').insert([newOption]);
        setFocusedOptionId(optimisticId);
    };

    const updateOption = async (sectionId: string, questionId: string, optionId: string, updates: any) => {
        // 1. Calculate new sections state
        let sectionsToSet = sections;

        // Improve UX: Auto-scoring logic
        if (updates.value === '2') {
            // Find indices
            const sIdx = sections.findIndex(s => s.id === sectionId);
            if (sIdx === -1) return; // Should not happen

            const qIdx = sections[sIdx].questions.findIndex((q: any) => q.id === questionId);
            if (qIdx === -1) return;

            const options = sections[sIdx].questions[qIdx].options || [];
            const optIndex = options.findIndex((o: any) => o.id === optionId);

            // Create updated options array
            const updatedOptions = options.map((opt: any, idx: number) => {
                // If it's the target option, apply the update (value: '2')
                if (opt.id === optionId) return { ...opt, ...updates };

                // Logic: Neighbors get '1', everyone else gets '0'
                let newValue = '0';
                if (idx === optIndex - 1 || idx === optIndex + 1) {
                    newValue = '1';
                }

                return { ...opt, value: newValue };
            });

            // Apply to section state
            sectionsToSet = sections.map((s, si) => {
                if (si !== sIdx) return s;
                return {
                    ...s,
                    questions: s.questions.map((q: any, qi: number) => {
                        if (qi !== qIdx) return q;
                        return { ...q, options: updatedOptions };
                    })
                };
            });

            // Fire DB updates for all modified options
            updatedOptions.forEach((opt: any) => {
                // We'll await the main one at the end, but others can fire-and-forget
                if (opt.id === optionId) return;
                // Only update if changed? optimizing db calls
                // For now, simpler to just ensure consistency
                supabase.from('question_options').update({ value: opt.value }).eq('id', opt.id).then();
            });

        } else {
            // Standard single update
            sectionsToSet = sections.map(s => {
                if (s.id !== sectionId) return s;
                return {
                    ...s,
                    questions: s.questions.map((q: any) => {
                        if (q.id !== questionId) return q;
                        return {
                            ...q,
                            options: q.options.map((o: any) =>
                                o.id === optionId ? { ...o, ...updates } : o
                            )
                        };
                    })
                };
            });
        }

        setSections(sectionsToSet);
        await supabase.from('question_options').update(updates).eq('id', optionId);
    };

    const deleteOption = async (sectionId: string, questionId: string, optionId: string) => {
        // Optimistic
        const newSections = sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map((q: any) => {
                    if (q.id !== questionId) return q;
                    return {
                        ...q,
                        options: q.options.filter((o: any) => o.id !== optionId)
                    };
                })
            };
        });
        setSections(newSections);

        await supabase.from('question_options').delete().eq('id', optionId);
    };


    return (
        <div className="fixed inset-0 z-[150] bg-gray-50 dark:bg-dark-bg flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-dark-nav border-b border-gray-200 dark:border-white/10 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex-1 mr-8">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                        <span>Editing Test</span>
                        <span>•</span>
                        <select
                            value={testMeta.branch || ''}
                            onChange={(e) => updateTestMeta({ branch: e.target.value as Branch })}
                            className="bg-transparent border-none p-0 text-gray-500 font-bold focus:ring-0 cursor-pointer hover:text-blue-500"
                        >
                            <option value="">No Branch (Exam)</option>
                            {Object.values(Branch).map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <AutoSaveInput
                        value={testMeta.title}
                        onSave={(val) => updateTestMeta({ title: val })}
                        className="text-2xl font-bold font-serif text-gray-900 dark:text-white bg-transparent border-none p-0 w-full focus:ring-0 placeholder-gray-300"
                        placeholder="Test Title"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveTest}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        <span>Save</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-80"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8 pb-32">
                    {isLoading && sections.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">Loading content...</div>
                    ) : (
                        <>
                            {sections.map((section, sIdx) => (
                                <div key={section.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm animate-fade-in-up">
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-gray-100 dark:bg-white/10 w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs">
                                                {sIdx + 1}
                                            </span>
                                            <h3 className="font-bold text-lg">{section.title}</h3>

                                            {/* Branch Selector */}
                                            <div className="flex items-center gap-2 ml-4">
                                                <select
                                                    value={section.branch || ''}
                                                    onChange={(e) => updateSection(section.id, { branch: e.target.value as Branch })}
                                                    className="bg-gray-100 dark:bg-white/5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-none focus:ring-1 focus:ring-black cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10"
                                                >
                                                    <option value="">No Branch</option>
                                                    {Object.values(Branch).map(b => (
                                                        <option key={b} value={b}>{b}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteSection(section.id)} className="text-red-400 hover:text-red-500 text-xs font-bold uppercase">
                                            Delete Section
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Questions Loop */}
                                        {(section.questions || []).map((q: any, qIdx: number) => (
                                            <div key={q.id} className="pl-6 border-l-2 border-gray-100 dark:border-white/5 animate-fade-in">
                                                <div className="flex gap-4 mb-4">
                                                    <span className="text-xs font-bold text-gray-400 mt-2">Q{qIdx + 1}</span>
                                                    <div className="flex-1 space-y-3">
                                                        {/* Question Type & Text */}
                                                        <div className="flex gap-2">
                                                            <select
                                                                className="bg-gray-100 dark:bg-white/5 rounded-xl px-3 py-2 text-xs font-bold border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-black/5"
                                                                value={q.type}
                                                                onChange={(e) => updateQuestion(section.id, q.id, { type: e.target.value as any })}
                                                            >
                                                                <option value="MCQ">Multiple Choice</option>
                                                                <option value="LIKERT_GRID">Likert Grid</option>
                                                                <option value="SCENARIO">Scenario</option>
                                                            </select>
                                                            <AutoSaveInput
                                                                className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold placeholder-gray-400"
                                                                value={q.question_text}
                                                                onSave={(val) => updateQuestion(section.id, q.id, { question_text: val })}
                                                            />
                                                            <button onClick={() => deleteQuestion(section.id, q.id)} className="text-gray-400 hover:text-red-500">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>

                                                        {/* Optional Fields using updated args */}
                                                        {(q.type === 'SCENARIO' || q.type === 'MCQ') && (
                                                            <AutoSaveInput
                                                                isTextArea
                                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium h-24 resize-none placeholder-gray-400"
                                                                placeholder="Scenario Context / Description (Optional)"
                                                                value={q.scenario_context || ''}
                                                                onSave={(val) => updateQuestion(section.id, q.id, { scenario_context: val })}
                                                            />
                                                        )}
                                                        {(q.type === 'SCENARIO' || q.type === 'LIKERT_GRID') && (
                                                            <AutoSaveInput
                                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-medium placeholder-gray-400"
                                                                placeholder="Stimulus Image URL (Optional)"
                                                                value={q.scenario_image_url || ''}
                                                                onSave={(val) => updateQuestion(section.id, q.id, { scenario_image_url: val })}
                                                            />
                                                        )}

                                                        {/* Explanation field for all question types */}
                                                        <div className="mt-2">
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Explanation (Post-Answer Context)</label>
                                                            <AutoSaveInput
                                                                isTextArea
                                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium h-20 resize-none placeholder-gray-400"
                                                                placeholder="Explain why the answer is correct..."
                                                                value={(q as any).explanation || ''}
                                                                onSave={(val) => updateQuestion(section.id, q.id, { explanation: val })}
                                                            />
                                                        </div>

                                                        {/* Options */}
                                                        <div className="space-y-2 mt-2">
                                                            {(q.options || []).map((opt: any) => (
                                                                <div key={opt.id} className="flex items-center gap-2 animate-fade-in group">
                                                                    {/* Radio for Correct Answer */}
                                                                    <div
                                                                        onClick={() => setCorrectAnswer(section.id, q.id, opt.id)}
                                                                        className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center transition-colors
                                                                            ${(q.correct_option_id === opt.id)
                                                                                ? 'bg-emerald-500 border-emerald-500'
                                                                                : 'border-gray-300 hover:border-emerald-400'}`}
                                                                        title="Mark as correct answer"
                                                                    >
                                                                        {(q.correct_option_id === opt.id) && (
                                                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                                        )}
                                                                    </div>
                                                                    <AutoSaveInput
                                                                        className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium placeholder-gray-400"
                                                                        value={opt.label}
                                                                        onSave={(val) => updateOption(section.id, q.id, opt.id, { label: val })}
                                                                        autoFocus={focusedOptionId === opt.id}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && e.shiftKey) {
                                                                                e.preventDefault();
                                                                                addOption(section.id, q.id);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <AutoSaveInput
                                                                        className="w-20 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-center font-bold text-gray-500"
                                                                        placeholder="Value"
                                                                        value={opt.value}
                                                                        onSave={(val) => {
                                                                            let cleanVal = val;
                                                                            const num = parseInt(val);
                                                                            if (!isNaN(num) && num > 2) cleanVal = '2';
                                                                            updateOption(section.id, q.id, opt.id, { value: cleanVal });
                                                                        }}
                                                                    />
                                                                    <button onClick={() => deleteOption(section.id, q.id, opt.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => addOption(section.id, q.id)}
                                                                className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 mt-1"
                                                            >
                                                                + Add Option
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => addQuestion(section.id)}
                                            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            + Add Question to {section.title}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setIsAddSectionOpen(true)}
                                className="w-full py-4 bg-gray-100 dark:bg-white/5 rounded-3xl font-bold text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                + Add New Section
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Add Section Modal */}
            {isAddSectionOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddSectionOpen(false)}></div>
                    <div className="relative bg-white dark:bg-dark-nav w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                        <h3 className="font-bold text-lg mb-4">New Section</h3>
                        <form onSubmit={handleAddSection}>
                            <input
                                autoFocus
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black mb-4"
                                placeholder="Section Title (e.g. Faces)"
                                value={newSectionTitle}
                                onChange={e => setNewSectionTitle(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSectionOpen(false)}
                                    className="flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-widest border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-full bg-black text-white font-bold text-xs uppercase tracking-widest"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
