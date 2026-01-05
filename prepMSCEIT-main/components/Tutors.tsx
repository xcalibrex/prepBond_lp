import React, { useState } from 'react';

export const Tutors: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in-up relative h-full flex flex-col">

            {/* Coming Soon State */}
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
                <div className="w-24 h-24 rounded-3xl bg-gray-50 dark:bg-dark-nav flex items-center justify-center mb-8 shadow-sm border border-gray-100 dark:border-white/5 relative">
                    <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.321c1.961 0 3.55 1.589 3.55 3.55s-1.589 3.55-3.55 3.55-3.55-1.589-3.55-3.55 1.589-3.55 3.55-3.55zM4.694 19.171a7.306 7.306 0 0114.612 0c0 .403-.327.73-.73.73H5.424a.731.731 0 01-.73-.73z" />
                    </svg>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Mentorship Coming Soon</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed text-sm">
                    Connect with Emotional Intelligence specialists to 10x your journey.
                </p>
            </div>
        </div>
    );
};