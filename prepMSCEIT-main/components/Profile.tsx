import React, { useState } from 'react';

export const Profile: React.FC = () => {
    const [tab, setTab] = useState<'profile' | 'billing'>('profile');

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="hidden md:flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and subscription.</p>
                </div>
            </div>

            <div className="flex gap-8 mb-8 border-b border-gray-100 dark:border-gray-800">
                <button
                    onClick={() => setTab('profile')}
                    className={`pb-3 px-1 text-sm font-medium transition-all relative ${tab === 'profile'
                        ? 'text-black dark:text-white'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                        }`}
                >
                    My Profile
                    {tab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setTab('billing')}
                    className={`pb-3 px-1 text-sm font-medium transition-all relative ${tab === 'billing'
                        ? 'text-black dark:text-white'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                        }`}
                >
                    Billing
                    {tab === 'billing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full"></div>}
                </button>
            </div>

            {tab === 'profile' ? (
                <div className="bg-white dark:bg-dark-nav rounded-xl p-8 border border-gray-200 dark:border-white/10 space-y-8 animate-fade-in-up">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 border-2 border-white dark:border-gray-700 flex items-center justify-center text-xl font-bold text-gray-400 dark:text-gray-500 shadow-sm">JD</div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Johnny Doe</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Level 5 Scholar</p>
                            <button className="text-xs font-bold text-black dark:text-white hover:underline">Change Avatar</button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Name</label>
                            <input type="text" defaultValue="Johnny Doe" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email Address</label>
                            <input type="email" defaultValue="johnny.doe@example.com" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Password & Security</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">New Password</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Confirm Password</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-[200px] font-bold text-sm hover:opacity-90 transition-all shadow-md hover:scale-105 active:scale-95">Save Changes</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Plan Card */}
                    <div className="bg-white dark:bg-dark-nav text-gray-900 dark:text-white rounded-xl p-8 border border-gray-200 dark:border-white/10 relative overflow-hidden group">
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">Current Plan</p>
                                <h3 className="text-3xl font-bold mb-1">Pro Scholar</h3>
                                <p className="text-xs text-gray-500">$29.00 / month</p>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">Active</span>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-[200px] text-xs font-bold hover:opacity-90 transition-all">Manage Subscription</button>
                            <button className="px-4 py-2 text-gray-900 dark:text-white border border-gray-200 dark:border-white/20 rounded-[200px] text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Cancel Plan</button>
                        </div>

                        {/* Decorative bg shapes */}
                        <div className="absolute -right-6 -bottom-10 w-40 h-40 bg-gray-100/50 dark:bg-white/5 rounded-full blur-2xl"></div>
                    </div>

                </div>
            )}
        </div>
    );
};