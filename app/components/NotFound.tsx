import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center px-6 text-center">
            {/* Large 404 Number */}
            <div className="relative">
                <h1 className="text-[180px] md:text-[240px] font-bold text-gray-100 dark:text-gray-800 leading-none select-none">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 blur-3xl"></div>
                </div>
            </div>

            {/* Content */}
            <div className="relative -mt-16 md:-mt-20">
                <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4 font-serif">
                    Page Not Found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mb-8">
                    The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/dashboard"
                        className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        to="/"
                        className="px-8 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};
