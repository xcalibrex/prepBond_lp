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
    const [invalidQuestionIds, setInvalidQuestionIds] = useState<string[]>([]);

    // Bulk Upload State
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [bulkUploadText, setBulkUploadText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

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
                        correct_answer: q.correct_answer || q.answer_keys?.[0]?.correct_answer || null,
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
            question_text: '',
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
                question_text: '',
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

        // Clear invalid highlight when answer is selected
        setInvalidQuestionIds(prev => prev.filter(id => id !== questionId));

        // 2. Logic & DB Update
        await updateAnswerKeys(sectionId, questionId, optionId, sections);
    };

    const updateAnswerKeys = async (sectionId: string, questionId: string, primaryOptionId: string, currentSections: ITestSection[]) => {
        const section = currentSections.find(s => s.id === sectionId);
        const question = section?.questions.find((q: any) => q.id === questionId);

        if (!question || !primaryOptionId) return;

        // Clear existing keys for this question
        await supabase.from('answer_keys').delete().eq('question_id', questionId);

        // Simply save the selected correct answer with 1 point
        const keysToInsert = [{
            question_id: questionId,
            question_option_id: primaryOptionId,
            points: 1
        }];

        if (keysToInsert.length > 0) {
            const { error } = await supabase.from('answer_keys').insert(keysToInsert);
            if (error) console.error('Error saving answer keys:', error);
        }
    };

    const updateSlidingScaleKey = async (sectionId: string, questionId: string, correctVal: string | number) => {
        if (!correctVal) return;

        // Clear existing
        await supabase.from('answer_keys').delete().eq('question_id', questionId);

        // Insert new
        await supabase.from('answer_keys').insert({
            question_id: questionId,
            question_option_id: null,
            correct_answer: String(correctVal),
            points: 1
        });
    }


    const handleSaveTest = async () => {
        // Validate all questions have correct answers selected
        const questionsWithoutAnswers: string[] = [];
        sections.forEach(section => {
            section.questions.forEach((q: any) => {
                const isExempt = q.type === 'LIKERT_GRID' || q.type === 'EMOTION_ORDER' || (q.type === 'SLIDING_SCALE' && q.correct_answer);
                if (!isExempt && !q.correct_option_id && q.options?.length > 0) {
                    questionsWithoutAnswers.push(q.id);
                } else if (q.type === 'SLIDING_SCALE' && !q.correct_answer) {
                    questionsWithoutAnswers.push(q.id);
                }
            });
        });

        if (questionsWithoutAnswers.length > 0) {
            setInvalidQuestionIds(questionsWithoutAnswers);
            toast.error(`${questionsWithoutAnswers.length} question(s) are missing correct answers`, { position: 'top-center' });
            // Scroll to first invalid question
            setTimeout(() => {
                const firstInvalidEl = document.getElementById(`question-${questionsWithoutAnswers[0]}`);
                if (firstInvalidEl) {
                    firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }

        setInvalidQuestionIds([]);
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

                        explanation: (q as any).explanation,
                        correct_order: (q as any).correct_order,
                        correct_answer: (q as any).correct_answer
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
                    } else if (q.type === 'SLIDING_SCALE' && (q as any).correct_answer) {
                        await updateSlidingScaleKey(section.id, q.id, (q as any).correct_answer);
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
        const optionsList = newSections[sIdx].questions[qIdx].options;
        optionsList.push(newOption);

        // Auto-sync correct order if EMOTION_ORDER
        if (newSections[sIdx].questions[qIdx].type === 'EMOTION_ORDER') {
            const orderedIds = optionsList.map((o: any) => o.id);
            // Async update DB
            supabase.from('questions').update({ correct_order: orderedIds }).eq('id', questionId).then();
            // Update local
            newSections[sIdx].questions[qIdx].correct_order = orderedIds;
        }

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
                            ).sort((a: any, b: any) => a.order_index - b.order_index)
                        };
                    })
                };
            });
        }

        setSections(sectionsToSet);
        await supabase.from('question_options').update(updates).eq('id', optionId);
    };

    const moveOption = async (sectionId: string, questionId: string, index: number, direction: number) => {
        const sIdx = sections.findIndex(s => s.id === sectionId);
        if (sIdx === -1) return;
        const qIdx = sections[sIdx].questions.findIndex((q: any) => q.id === questionId);
        if (qIdx === -1) return;

        const allOptions = [...(sections[sIdx].questions[qIdx].options || [])];
        if (index + direction < 0 || index + direction >= allOptions.length) return;

        const optA = allOptions[index];
        const optB = allOptions[index + direction];

        // Swap order indices
        const tempOrder = optA.order_index;
        optA.order_index = optB.order_index;
        optB.order_index = tempOrder;

        // Re-sort
        allOptions.sort((a, b) => a.order_index - b.order_index);

        // Optimistic Update
        const newSections = sections.map((s, si) => {
            if (si !== sIdx) return s;
            return {
                ...s,
                questions: s.questions.map((q: any, qi: number) => {
                    if (qi !== qIdx) return q;

                    // Sync correct order if type is EMOTION_ORDER
                    const correctOrder = q.type === 'EMOTION_ORDER'
                        ? allOptions.map(o => o.id)
                        : q.correct_order;

                    if (q.type === 'EMOTION_ORDER') {
                        supabase.from('questions').update({ correct_order: correctOrder }).eq('id', q.id).then();
                    }

                    return { ...q, options: allOptions, correct_order: correctOrder };
                })
            };
        });

        setSections(newSections);

        // Update DB options
        await Promise.all([
            supabase.from('question_options').update({ order_index: optA.order_index }).eq('id', optA.id),
            supabase.from('question_options').update({ order_index: optB.order_index }).eq('id', optB.id)
        ]);
    };

    const deleteOption = async (sectionId: string, questionId: string, optionId: string) => {
        // Optimistic
        const newSections = sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map((q: any) => {
                    if (q.id !== questionId) return q;

                    const newOptions = q.options.filter((o: any) => o.id !== optionId);

                    // Sync correct order if EMOTION_ORDER
                    let newCorrectOrder = q.correct_order;
                    if (q.type === 'EMOTION_ORDER') {
                        newCorrectOrder = newOptions.map((o: any) => o.id);
                        supabase.from('questions').update({ correct_order: newCorrectOrder }).eq('id', q.id).then();
                    }

                    return {
                        ...q,
                        options: newOptions,
                        correct_order: newCorrectOrder
                    };
                })
            };
        });
        setSections(newSections);

        await supabase.from('question_options').delete().eq('id', optionId);
    };

    // --- Bulk Upload Handler ---
    const handleBulkUpload = async () => {
        if (!bulkUploadText.trim()) return;
        setIsParsing(true);
        const toastId = toast.loading("Magic parsing in progress...");

        try {
            const { data, error } = await supabase.functions.invoke('parse-questions', {
                body: { rawText: bulkUploadText }
            });

            if (error) throw error;
            if (!data?.questions || !Array.isArray(data.questions)) throw new Error("Invalid response from AI");

            const parsedQuestions = data.questions;

            // Add to the FIRST section by default, or create one if none exist
            let targetSectionId = sections[0]?.id;

            if (!targetSectionId) {
                // Create a default section
                const newSectionId = crypto.randomUUID();
                const newSection = {
                    id: newSectionId,
                    test_id: testId,
                    title: 'Section 1',
                    instructions: '',
                    order_index: 0,
                    questions: []
                };

                // Optimistic update for section
                setSections([newSection]);
                await supabase.from('test_sections').insert([newSection]);
                targetSectionId = newSectionId;
            }

            // Map parsed questions to our internal structure
            // We need to fetch the current section index again as state might have updated
            setSections(prevSections => {
                const sIdx = prevSections.findIndex(s => s.id === targetSectionId);
                if (sIdx === -1) return prevSections;

                const section = prevSections[sIdx];
                let currentOrderIndex = (section.questions || []).length;

                const newQuestions = parsedQuestions.map((q: any) => {
                    const qId = crypto.randomUUID();

                    // Prepare Options
                    const options = (q.options || []).map((opt: any, idx: number) => ({
                        id: crypto.randomUUID(),
                        question_id: qId,
                        label: opt.label,
                        value: opt.value,
                        order_index: idx
                    }));

                    // Determine correct option ID
                    let correctOptionId = null;
                    if (q.correct_option_label) {
                        const found = options.find((o: any) => o.label === q.correct_option_label);
                        if (found) correctOptionId = found.id;
                    }

                    return {
                        id: qId,
                        section_id: targetSectionId,
                        question_text: q.question_text || 'Untitled Question',
                        type: q.type || 'MCQ',
                        order_index: currentOrderIndex++,
                        scenario_context: q.scenario_context || null,
                        explanation: q.explanation || '',
                        options: options,
                        correct_option_id: correctOptionId,
                        isNew: true // Marker for processing
                    };
                });

                const updatedSection = {
                    ...section,
                    questions: [...section.questions, ...newQuestions]
                };

                const newSectionsList = [...prevSections];
                newSectionsList[sIdx] = updatedSection;
                return newSectionsList;
            });

            // Note: We are updating local state optimistically. 
            // The user must hit "Save" to commit these 50 rows to DB.
            // This allows review.

            toast.success(`Parsed ${parsedQuestions.length} questions! Review and Save.`, { id: toastId });
            setIsBulkUploadOpen(false);
            setBulkUploadText('');

        } catch (e: any) {
            console.error(e);
            const msg = e.context?.message || e.message || "Unknown error";
            toast.error(`Parsing failed: ${msg}`, { id: toastId });
        } finally {
            setIsParsing(false);
        }
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
                        onClick={() => setIsBulkUploadOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        <span>🪄 Import</span>
                    </button>
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
                                            <div
                                                key={q.id}
                                                id={`question-${q.id}`}
                                                className={`pl-6 border-l-2 animate-fade-in transition-colors ${invalidQuestionIds.includes(q.id)
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r-xl -ml-0.5 pl-6'
                                                    : 'border-gray-100 dark:border-white/5'
                                                    }`}
                                            >
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
                                                                <option value="VIDEO">Video Question</option>
                                                                <option value="EMOTION_ORDER">Emotion Ordering</option>
                                                                <option value="SLIDING_SCALE">Sliding Scale (1-5)</option>
                                                            </select>
                                                            <AutoSaveInput
                                                                className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold placeholder-gray-400"
                                                                placeholder="New Question"
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

                                                        {q.type === 'VIDEO' && (
                                                            <div className="space-y-2">
                                                                <AutoSaveInput
                                                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-medium placeholder-gray-400"
                                                                    placeholder="Video URL (YouTube/Vimeo/MP4)"
                                                                    value={(q as any).video_url || ''}
                                                                    onSave={(val) => updateQuestion(section.id, q.id, { video_url: val })}
                                                                />
                                                                {/* Optional Video Preview */}
                                                                {(q as any).video_url && (
                                                                    <div className="text-xs text-gray-400 bg-gray-100 dark:bg-white/5 p-2 rounded-lg">
                                                                        Video will be embedded below question text
                                                                    </div>
                                                                )}
                                                            </div>
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

                                                        {/* --- SLIDING SCALE EDITOR --- */}
                                                        {q.type === 'SLIDING_SCALE' && (
                                                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 mt-2">
                                                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Scale Configuration</h4>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Min Value</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold"
                                                                            value={(q as any).scale_min || 1}
                                                                            onChange={(e) => updateQuestion(section.id, q.id, { scale_min: parseInt(e.target.value) })}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Max Value</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold"
                                                                            value={(q as any).scale_max || 5}
                                                                            onChange={(e) => updateQuestion(section.id, q.id, { scale_max: parseInt(e.target.value) })}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-emerald-500 mb-1">Correct Answer</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-lg px-3 py-2 text-xs font-bold text-emerald-600"
                                                                            min={(q as any).scale_min || 1}
                                                                            max={(q as any).scale_max || 5}
                                                                            value={(q as any).correct_answer || ''}
                                                                            onChange={(e) => updateQuestion(section.id, q.id, { correct_answer: e.target.value })}
                                                                        />

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* --- EMOTION ORDER EDITOR --- */}
                                                        {q.type === 'EMOTION_ORDER' && (
                                                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 mt-2">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Correct Sequence (Top to Bottom)</h4>
                                                                    <span className="text-[10px] text-gray-400">Students will see these shuffled</span>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {(q.options || []).map((opt: any, idx: number) => (
                                                                        <div key={opt.id} className="flex items-center gap-2">
                                                                            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                                {idx + 1}
                                                                            </span>
                                                                            <AutoSaveInput
                                                                                className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium"
                                                                                value={opt.label}
                                                                                placeholder={`Emotion ${idx + 1}`}
                                                                                onSave={(val) => updateOption(section.id, q.id, opt.id, { label: val })}
                                                                            />
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <button
                                                                                    disabled={idx === 0}
                                                                                    onClick={() => moveOption(section.id, q.id, idx, -1)}
                                                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded disabled:opacity-30"
                                                                                >
                                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                                                </button>
                                                                                <button
                                                                                    disabled={idx === (q.options?.length || 0) - 1}
                                                                                    onClick={() => moveOption(section.id, q.id, idx, 1)}
                                                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded disabled:opacity-30"
                                                                                >
                                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                                </button>
                                                                            </div>
                                                                            <button onClick={() => deleteOption(section.id, q.id, opt.id)} className="text-gray-300 hover:text-red-400 p-2">✕</button>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => addOption(section.id, q.id)}
                                                                        className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 mt-2"
                                                                    >
                                                                        + Add Item
                                                                    </button>
                                                                </div>

                                                            </div>
                                                        )}

                                                        {/* Standard Options (Hide for special types) */}
                                                        {!['SLIDING_SCALE', 'EMOTION_ORDER'].includes(q.type) && (
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
                                                                        {/* Score indicator - auto shows 1 pt when correct */}
                                                                        <span className={`w-14 text-center text-xs font-bold py-2 px-2 rounded-xl ${q.correct_option_id === opt.id
                                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                                            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                                                            }`}>
                                                                            {q.correct_option_id === opt.id ? '1 pt' : '0 pt'}
                                                                        </span>
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
                                                        )}
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

            {/* Bulk Upload Modal */}
            {isBulkUploadOpen && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-8 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[80vh] rounded-3xl p-8 flex flex-col shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">🪄 Magic Bulk Import</h3>
                                <p className="text-gray-500 text-sm mt-1">Paste raw text questions (e.g. from Word/PDF). AI will parse them.</p>
                            </div>
                            <button onClick={() => setIsBulkUploadOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <textarea
                            className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder={"Paste your questions here...\n\nExample:\n1. What is the powerhouse of the cell?\nA. Nucleus\nB. Mitochondria\nC. Ribosome\nAnswer: B\nExplanation: Mitochondria generate most of the cell's supply of adenosine triphosphate."}
                            value={bulkUploadText}
                            onChange={(e) => setBulkUploadText(e.target.value)}
                        />

                        <div className="mt-6 flex justify-end gap-4">
                            <button
                                onClick={() => setIsBulkUploadOpen(false)}
                                className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkUpload}
                                disabled={isParsing || !bulkUploadText.trim()}
                                className={`px-8 py-3 rounded-xl font-bold text-white uppercase tracking-widest transition-all ${isParsing ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:scale-105 active:scale-95'
                                    }`}
                            >
                                {isParsing ? '✨ Parsing...' : '✨ Magic Parse'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
