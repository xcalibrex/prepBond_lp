import React, { useState, useEffect, useRef } from 'react';
import { DS } from '../design-system';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    isDark: boolean;
    toggleTheme: () => void;
    onLogout: () => void;
    user: any;
    role: string | null;
}

interface NavItemProps {
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    isCollapsed: boolean;
    className?: string;
}

const TAB_TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    curriculum: 'Curriculum',
    analytics: 'Analytics',
    history: 'History',
    tutors: 'Tutors',
    profile: 'Settings',
    assessment: 'Assessment',
    results: 'Results',
    users: 'Users',
    classes: 'Classes'
};

const NavItem: React.FC<NavItemProps> = ({ id, label, isActive, onClick, icon, isCollapsed, className = '' }) => (
    <button
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        aria-label={label}
        className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold transition-all duration-300 mb-1 mx-auto rounded-[200px] group relative overflow-hidden
      ${isActive
                ? 'text-black dark:text-white bg-gray-100/50 dark:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:bg-dark-hover dark:hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''} ${className}`}
    >
        <div className={`transition-colors duration-200 relative z-10 ${isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
            {icon}
        </div>
        {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-200 relative z-10">{label}</span>}
    </button>
);

const AppLogo = ({ isDark }: { isDark: boolean }) => (
    <div className="relative w-8 h-8 flex items-center justify-center rounded-lg overflow-hidden">
        <img
            src="/media/2.png"
            alt="prepMSCEIT Logo Dark"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
        <img
            src="/media/3.png"
            alt="prepMSCEIT Logo Light"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${!isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
    </div>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isDark, toggleTheme, onLogout, user, role }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [prevTab, setPrevTab] = useState('dashboard');

    // Track tab history for back button logic
    useEffect(() => {
        if (activeTab !== 'profile' && activeTab !== 'assessment' && activeTab !== 'results') {
            setPrevTab(activeTab);
        }
    }, [activeTab]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isFocusMode = activeTab === 'assessment';
    const isSettingsView = activeTab === 'profile';

    const handleMobileNav = (tab: string) => {
        onTabChange(tab);
        setIsMobileOpen(false);
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
        { id: 'curriculum', label: 'Curriculum', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
        { id: 'analytics', label: 'Insight', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg> },
        { id: 'history', label: 'History', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'tutors', label: 'Tutors', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    ];

    const adminMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
        { id: 'users', label: 'Users', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
        { id: 'classes', label: 'Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    ];

    const currentMenuItems = role === 'admin' ? adminMenuItems : menuItems;

    const getDynamicHeaderTitle = () => {
        if (activeTab === 'dashboard') {
            return (
                <h1 className="text-[36px] font-serif font-bold text-black dark:text-white leading-tight">
                    Welcome back, <span className="text-gray-400">{user?.user_metadata?.full_name || 'Scholar'}</span>
                </h1>
            );
        }
        return (
            <h1 className="text-[36px] font-bold font-serif text-gray-900 dark:text-white tracking-tight">
                {TAB_TITLES[activeTab] || 'prepMSCEIT'}
            </h1>
        );
    };

    return (
        <div className={`h-screen w-screen flex flex-col md:flex-row bg-white text-black dark:bg-dark-bg dark:text-white overflow-hidden font-sans relative ${DS.animation.theme}`}>

            {/* Mobile Header */}
            {!isFocusMode && (
                <header className={`md:hidden flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-dark-nav/95 backdrop-blur-md z-[55] border-b border-gray-100 dark:border-gray-800 shrink-0 h-16 ${DS.animation.theme}`}>
                    <div className="w-12 flex items-center">
                        {isSettingsView ? (
                            <button
                                onClick={() => onTabChange(prevTab)}
                                className="p-2 -ml-2 text-gray-700 dark:text-white rounded-lg active:scale-90 transition-transform"
                                aria-label="Go back"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsMobileOpen(!isMobileOpen)}
                                className="p-2 -ml-2 text-gray-700 dark:text-white rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                                aria-label="Open mobile menu"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 flex justify-center">
                        <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white uppercase transition-all duration-300">
                            {TAB_TITLES[activeTab] || 'prepMSCEIT'}
                        </h2>
                    </div>

                    <div className="w-12 flex justify-end">
                        {!isSettingsView && (
                            <button
                                onClick={() => onTabChange('profile')}
                                className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold shadow-sm active:scale-90 transition-transform border border-white/20 dark:border-black/20"
                            >
                                JD
                            </button>
                        )}
                    </div>
                </header>
            )}

            {/* Sidebar Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-[60] flex flex-col bg-white dark:bg-dark-nav border-r border-gray-100 dark:border-white/5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            md:relative md:translate-x-0
            ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            ${isFocusMode ? 'md:-ml-64 md:opacity-0 md:w-0' : 'md:ml-0 md:opacity-100'}
            ${isCollapsed && !isFocusMode ? 'md:w-20' : 'md:w-64'}
            ${DS.animation.theme}
        `}
            >
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden absolute top-6 right-6 p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white rounded-full bg-gray-100 dark:bg-white/5 transition-colors z-[70]"
                    aria-label="Close mobile menu"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute top-10 -right-3 w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-black dark:text-white items-center justify-center shadow-md z-50 cursor-pointer hover:scale-110 transition-transform border border-gray-100 dark:border-gray-700"
                >
                    <svg className={`w-3.5 h-3.5 transition-transform duration-500 ease-out ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex flex-col h-full w-full">
                    <div className={`p-6 flex items-center gap-3 mb-2 ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}>
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onTabChange('dashboard')}>
                            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                                <AppLogo isDark={isDark} />
                            </div>
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white animate-fade-in font-serif">
                                prepMSCEIT
                            </h1>
                        )}
                    </div>

                    <nav className="flex-1 flex flex-col px-4 gap-1 overflow-y-auto overflow-x-hidden pt-2">
                        {(!isCollapsed || isMobileOpen) && <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Main Menu</p>}

                        {currentMenuItems.map(item => (
                            <NavItem
                                key={item.id}
                                id={item.id}
                                label={item.label}
                                isActive={activeTab === item.id}
                                onClick={() => handleMobileNav(item.id)}
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={item.icon}
                            />
                        ))}

                        {role !== 'admin' && (
                            <NavItem
                                id="tutors"
                                label="Tutors"
                                isActive={activeTab === 'tutors'}
                                onClick={() => handleMobileNav('tutors')}
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>}
                            />
                        )}

                    </nav>
                </div>
            </aside>

            <main className={`flex-1 w-full h-full relative flex flex-col bg-white dark:bg-dark-bg ${isSettingsView ? 'md:translate-x-0' : ''} ${DS.animation.theme}`}>
                {!isFocusMode && (
                    <header className="hidden md:flex pt-4 pb-4 shrink-0">
                        <div className="max-w-[1600px] mx-auto w-full px-6 md:px-8 flex items-center justify-between">
                            <div className="flex-1">
                                {getDynamicHeaderTitle()}
                            </div>

                            <div className="relative" ref={userMenuRef}>
                                <div
                                    className={`flex items-center gap-3 py-2 px-1 rounded-[24px] cursor-pointer transition-all duration-200 group`}
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                >
                                    <div className="flex flex-col overflow-hidden text-right">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {user?.user_metadata?.full_name || 'Johnny Doe'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                            {user?.email || 'johnny@example.com'}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-bold shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                        {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'JD'}
                                    </div>
                                </div>

                                {isUserMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-dark-nav border border-gray-100 dark:border-white/10 rounded-[24px] shadow-xl overflow-hidden animate-fade-in-up z-50">
                                        <div className="p-2 border-b border-gray-50 dark:border-white/5">
                                            <button
                                                onClick={() => {
                                                    onTabChange('profile');
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                Settings
                                            </button>
                                        </div>
                                        <div className="p-2 border-b border-gray-50 dark:border-white/5">
                                            <div
                                                onClick={() => {
                                                    toggleTheme();
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isDark ? (
                                                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                                    )}
                                                    {isDark ? 'Light Mode' : 'Dark Mode'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    onLogout();
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                )}

                <div className={`flex-1 w-full overflow-y-auto overflow-x-hidden ${isSettingsView ? 'md:translate-x-0' : ''}`}>
                    <div className={`mx-auto transition-all duration-500 min-h-full
                ${isFocusMode ? 'p-0' : 'max-w-[1600px] px-6 md:px-8 py-6 pb-32 md:pb-10'}
                ${isSettingsView ? 'animate-slide-in-right md:animate-none' : 'animate-fade-in'}
             `}>
                        {children}
                    </div>
                </div>
                {isMobileOpen && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 md:hidden" onClick={() => setIsMobileOpen(false)}></div>
                )}
            </main>

            {!isFocusMode && (
                <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-dark-nav/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-[40] px-6 py-2 pb-safe flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-500 ease-in-out ${isSettingsView ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'} ${DS.animation.theme}`}>
                    {currentMenuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-[24px] transition-all duration-200 ${activeTab === item.id
                                ? 'text-black dark:text-white scale-110 font-bold'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                                }`}
                        >
                            <div className={activeTab === item.id ? 'stroke-2' : ''}>
                                {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
                            </div>
                            <span className="text-[10px]">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};