import React, { useState } from 'react';

interface ClassSession {
    id: string;
    title: string;
    description: string;
    videoUrl: string; // Placeholder for now
    duration: string;
    thumbnail?: string;
}

const MOCK_CLASSES: ClassSession[] = [
    {
        id: '1',
        title: 'Introduction to Emotional Intelligence',
        description: 'An overview of EI concepts and why they matter for medical practice. We explore the four branches of the Mayer-Salovey-Caruso model.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
        duration: '45 min',
    },
    {
        id: '2',
        title: 'Perceiving Emotions in Micro-expressions',
        description: 'Deep dive into recognizing subtle facial cues. Learn to identify the 7 universal emotions.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: '50 min',
    },
    {
        id: '3',
        title: 'Using Emotions to Facilitate Thought',
        description: 'How to harness different emotional states to improve problem solving and creativity.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: '40 min',
    },
    {
        id: '4',
        title: 'Understanding Emotional Chains',
        description: 'Analyzing how emotions transition from one to another. Case studies on complex emotional blends.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: '55 min',
    }
];

export const Classroom: React.FC = () => {
    const [selectedClass, setSelectedClass] = useState<ClassSession>(MOCK_CLASSES[0]);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-6 animate-fade-in-up">
            {/* Left Sidebar: Class List */}
            <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-dark-nav rounded-[24px] border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Classroom</h2>
                    <p className="text-xs text-gray-500 mt-1">Select a session to watch</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {MOCK_CLASSES.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => setSelectedClass(session)}
                            className={`w-full text-left p-4 rounded-xl transition-all border ${selectedClass.id === session.id
                                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md'
                                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedClass.id === session.id ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400'}`}>
                                    Class {session.id}
                                </span>
                                <span className={`text-[10px] font-bold ${selectedClass.id === session.id ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`}>
                                    {session.duration}
                                </span>
                            </div>
                            <h3 className="font-bold text-sm leading-tight mb-1">{session.title}</h3>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Content: Video Player */}
            <div className="w-full md:w-2/3 flex flex-col bg-white dark:bg-dark-nav rounded-[24px] border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="relative aspect-video w-full bg-black">
                    <iframe
                        src={selectedClass.videoUrl}
                        title={selectedClass.title}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="p-8 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black dark:bg-white dark:text-black px-3 py-1 rounded-full">
                            Now Playing
                        </span>
                        <span className="text-xs text-gray-500 font-bold">{selectedClass.duration}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif mb-4">{selectedClass.title}</h1>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                        {selectedClass.description}
                    </p>
                </div>
            </div>
        </div>
    );
};
