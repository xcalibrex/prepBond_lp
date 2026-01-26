import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DS } from '../design-system';
import { TaskType } from '../types';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: { title: string, description: string, due_date: string, type: TaskType }) => Promise<void>;
    isSaving: boolean;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave, isSaving }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TaskType>('user_created');

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            title,
            description,
            due_date: date,
            type
        });
        // Reset form
        setTitle('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setType('user_created');
        onClose();
    };

    if (!mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-dark-nav border border-gray-100 dark:border-white/10 w-full max-w-md ${DS.radius.card} p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g., Study Session"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="hidden">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as TaskType)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="user_created">Personal Task</option>
                                <option value="group_class" disabled>Group Class</option>
                                <option value="curriculum" disabled>Curriculum</option>
                                <option value="key_date">Key Date</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? 'Saving...' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
