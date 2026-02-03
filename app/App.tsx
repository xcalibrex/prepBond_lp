
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Assessment } from './components/Assessment';
import { Practice } from './components/Practice';
import { Classroom } from './components/Classroom';
import { Analytics } from './components/Analytics';
import { Profile } from './components/Profile';
import { Tutors } from './components/Tutors';
import { Results } from './components/Results';
import { History } from './components/History';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { AppTour } from './components/AppTour';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminUsers } from './components/Admin/AdminUsers';
import { AdminClasses } from './components/Admin/AdminClasses';
import { AdminPractice } from './components/Admin/AdminPractice';
import { Ebook } from './components/Ebook';
import { TestRunner } from './components/TestRunner';

import { TestRunnerWrapper } from './components/TestRunnerWrapper';
import { NotFound } from './components/NotFound';
import { UserStats, Branch } from './types';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { Toaster } from 'react-hot-toast';

// Clean baseline for new Med School Aspirants
const INITIAL_STATS: UserStats = {
  scores: {
    [Branch.Perceiving]: 0,
    [Branch.Using]: 0,
    [Branch.Understanding]: 0,
    [Branch.Managing]: 0,
  },
  masteryLevels: {
    [Branch.Perceiving]: 1,
    [Branch.Using]: 1,
    [Branch.Understanding]: 1,
    [Branch.Managing]: 1,
  },
  consensusAlignment: 0,
  percentile: 0,
  history: [],
  weakestBranch: Branch.Managing,
  completionCount: 0,
};

const EI_QUOTES = [
  "Emotional intelligence is the key to both personal and professional success.",
  "The only way to change someone's mind is to connect with them from the heart.",
  "What really matters for success, character, happiness and life long achievements is a definite set of emotional skills. — Daniel Goleman",
  "Knowing others is intelligence; knowing yourself is true wisdom. — Lao Tzu",
  "Your intellect may be confused, but your emotions will never lie to you. — Roger Ebert"
];

function SplashScreen({ onFinish, isDark }: { onFinish: () => void, isDark: boolean }) {
  const [quote] = useState(() => EI_QUOTES[Math.floor(Math.random() * EI_QUOTES.length)]);

  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-500 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="relative w-24 h-24 mb-6">
        <img
          src="/media/2.png"
          alt="PrepBond Logo Dark"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
        <img
          src="/media/3.png"
          alt="PrepBond Logo Light"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${!isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 animate-fade-in-up text-black dark:text-white font-serif">PrepBond</h1>
      <p className="text-sm font-medium text-gray-500 max-w-md text-center px-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        "{quote}"
      </p>
    </div>
  )
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract view from URL: /home/:view or /admin/:view
  const activeTab = React.useMemo(() => {
    const parts = location.pathname.split('/');
    if (parts[1] === 'home' || parts[1] === 'admin') {
      return parts[2] || 'dashboard';
    }
    return 'dashboard';
  }, [location.pathname]);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [lastResult, setLastResult] = useState<{ score: number, branch: Branch } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [remoteSyncEnabled, setRemoteSyncEnabled] = useState(true);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    return null;
  });
  // Tracking latest session ID to prevent race conditions
  const lastSessionIdRef = React.useRef<string | null>(null);

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('onboardingComplete');
      return cached === 'true' ? true : cached === 'false' ? false : null;
    }
    return null;
  });

  useEffect(() => {
    if (onboardingComplete !== null) {
      localStorage.setItem('onboardingComplete', String(onboardingComplete));
    }
  }, [onboardingComplete]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    console.log('App mounted');
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        lastSessionIdRef.current = session.access_token;
        // Only show splash if not shown in this session
        const hasShownSplash = sessionStorage.getItem('splash_shown');
        if (!hasShownSplash) {
          setShowSplash(true);
          sessionStorage.setItem('splash_shown', 'true');
        }
        checkOnboarding(session);
        loadStatsFromSupabase(session.user.id);
      }
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        lastSessionIdRef.current = session.access_token;
        if (event === 'SIGNED_IN') {
          // Do nothing on sign in event to prevent splash on tab switch
        }
        checkOnboarding(session);
        loadStatsFromSupabase(session.user.id);
      } else {
        lastSessionIdRef.current = null;
        setStats(INITIAL_STATS);
        setOnboardingComplete(null);
        localStorage.removeItem('onboardingComplete');
        setShowSplash(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboarding = async (currentSession: Session) => {
    const sessionIdAtStart = currentSession.access_token;

    try {
      // 1. Immediate hint from session metadata (if available)
      const metadata = currentSession.user.user_metadata;
      if (userRole === null && metadata?.role) {
        setUserRole(metadata.role);
        localStorage.setItem('userRole', metadata.role);
      }

      // Check profile table as source of truth for onboarding
      const fetchProfile = supabase
        .from('profiles')
        .select('onboarding_complete, role, status')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), 8000)
      );

      const { data: profile, error } = await Promise.race([fetchProfile, timeoutPromise]) as any;

      if (lastSessionIdRef.current !== sessionIdAtStart) return;

      if (error) {
        console.warn('App: Profile fetch warning', error);
        // On error, if we have metadata, trust it for the role
        if (userRole === null && metadata?.role) {
          setUserRole(metadata.role);
          localStorage.setItem('userRole', metadata.role);
        }
        // stay in null state for onboardingComplete to prevent redirects
        return;
      }

      if (profile?.status === 'inactive') {
        await handleLogout();
        return;
      }

      // Determine Role - DO NOT default to 'student' IF we are still loading or have conflicting info
      const definitiveRole = profile?.role || metadata?.role;
      if (definitiveRole) {
        setUserRole(definitiveRole);
        localStorage.setItem('userRole', definitiveRole);
      } else if (profile === null && !metadata?.role) {
        // Only if we searched and found NOTHING (no profile, no metadata), then default to student
        setUserRole('student');
        localStorage.setItem('userRole', 'student');
      }

      // Determine Onboarding Status
      if (profile) {
        setOnboardingComplete(profile.onboarding_complete === true);
      } else if (metadata?.onboarding_complete !== undefined) {
        setOnboardingComplete(metadata.onboarding_complete === true);
      } else if (profile === null && !metadata?.role) {
        // Only if brand new (no profile, no metadata), then false
        setOnboardingComplete(false);
      }
    } catch (err) {
      console.error('App: checkOnboarding failed', err);
    }
  };

  // Strict Redirection Logic for Students
  // Strict Redirection Logic
  useEffect(() => {
    // Wait for all Auth/State to be ready
    if (!session) return;

    // Debug Logging
    console.log('Redirect Logic Trace:', {
      role: userRole,
      complete: onboardingComplete,
      path: location.pathname,
      ready: onboardingComplete !== null && userRole !== null
    });

    if (onboardingComplete === null || userRole === null) return;

    const isOnOnboarding = location.pathname === '/onboarding';
    const isOnTest = location.pathname.startsWith('/test/');

    // 1. If user is auth and student and onboarding incomplete -> redirect to /onboarding
    if (userRole === 'student' && !onboardingComplete) {
      if (!isOnOnboarding && !isOnTest) {
        navigate('/onboarding', { replace: true });
      }
      return;
    }

    // 2. If user is auth and student and onboarding complete -> nav to intended route (or dashboard if stuck on onboarding)
    if (userRole === 'student' && onboardingComplete) {
      if (isOnOnboarding) {
        navigate('/home/dashboard', { replace: true });
      }
      return;
    }

    // 3. If user is auth and admin -> nav to users intended route
    // (Implicitly handled: they won't trigger the above, and routing allows access)
    // Just ensure they aren't stuck on /onboarding if they somehow got there
    if (userRole !== 'student' && isOnOnboarding) {
      navigate(userRole === 'admin' ? '/admin/dashboard' : '/home/dashboard', { replace: true });
    }

  }, [session, userRole, onboardingComplete, location.pathname, navigate]);

  const handleOnboardingComplete = async (startTest: boolean) => {
    // 1. Refresh session to get latest metadata (including password & onboarding_complete: true)
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    setSession(refreshedSession);

    if (refreshedSession) {
      // 2. Sync profile to database
      const metadata = refreshedSession.user.user_metadata;

      await supabase.from('profiles').upsert({
        id: refreshedSession.user.id,
        full_name: metadata.full_name || '',
        role: metadata.role || 'student',
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // Update state to trigger redirect/access
      setOnboardingComplete(true);

      // 3. Initialize stats and navigate
      saveStats(INITIAL_STATS, refreshedSession);

      if (startTest) {
        // Direct jump to assessment to bypass dashboard flicker
        setSelectedBranch(Branch.Perceiving);
        navigate('/assessment');
      } else {
        navigate('/home/dashboard');
        // Show tour if it's the first time
        if (!metadata.tour_complete) {
          setShowTour(true);
        }
      }
    }
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    if (!session) return;

    // Persist tour status in metadata (legacy) and profile (new source of truth)
    await supabase.auth.updateUser({
      data: { tour_complete: true }
    });

    await supabase.from('profiles').update({
      walkthrough_complete: true,
      updated_at: new Date().toISOString()
    }).eq('id', session.user.id);
  };

  const loadStatsFromLocal = () => {
    try {
      const savedStats = localStorage.getItem('userStats');
      const parsed = savedStats ? JSON.parse(savedStats) : INITIAL_STATS;
      console.log('App: Loaded stats from local', parsed);
      setStats(parsed);
    } catch (e) {
      console.log('App: Error loading stats from local', e);
      setStats(INITIAL_STATS);
    }
    setIsLoadingAuth(false);
  };

  const loadStatsFromSupabase = async (userId: string) => {
    try {
      // 1. Fetch existing user_progress (for branch assessments)
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      // 2. Fetch completed test sessions for practice tests/exams
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_test_sessions')
        .select(`
          id,
          score,
          completed_at,
          practice_tests (
            title,
            type,
            branch
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (progressError) {
        console.log('App: Supabase stats error', progressError);
        setRemoteSyncEnabled(false);
        loadStatsFromLocal();
        return;
      }

      // Start with existing progress data or initial stats
      let baseStats: UserStats = progressData?.data as UserStats || INITIAL_STATS;

      // 3. Calculate stats from test sessions
      if (sessions && sessions.length > 0) {
        // Build history from sessions
        // Helper to map DB branch to Enum
        const mapDbBranchToEnum = (dbBranch: string): Branch | string => {
          if (dbBranch === 'PERCEIVING') return Branch.Perceiving;
          if (dbBranch === 'USING') return Branch.Using;
          if (dbBranch === 'UNDERSTANDING') return Branch.Understanding;
          if (dbBranch === 'MANAGING') return Branch.Managing;
          return dbBranch || 'General';
        };

        // Build history from sessions
        const sessionHistory = sessions.map((s: any) => ({
          id: s.id,
          date: s.completed_at ? new Date(s.completed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          score: s.score || 0,
          branch: mapDbBranchToEnum(s.practice_tests?.branch) as Branch,
          type: s.practice_tests?.type || 'exam',
          title: s.practice_tests?.title || 'Practice Test'
        }));

        // Calculate consensus alignment (average of all scores)
        const allScores = sessions.map((s: any) => s.score || 0).filter((s: number) => s > 0);
        const avgScore = allScores.length > 0
          ? Math.round(allScores.reduce((sum: number, s: number) => sum + s, 0) / allScores.length)
          : baseStats.consensusAlignment || 0;

        // Calculate Branch Scores
        const branchScores: Record<string, number[]> = {
          [Branch.Perceiving]: [],
          [Branch.Using]: [],
          [Branch.Understanding]: [],
          [Branch.Managing]: [],
        };

        sessions.forEach((s: any) => {
          const branch = mapDbBranchToEnum(s.practice_tests?.branch);
          if (s.score > 0 && branch) {
            // Handle both Enum and string matching just in case
            if (Object.values(Branch).includes(branch as Branch)) {
              branchScores[branch as string].push(s.score);
            }
          }
        });

        const newScores = { ...baseStats.scores };
        Object.keys(branchScores).forEach(key => {
          const scores = branchScores[key];
          if (scores.length > 0) {
            const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            newScores[key as Branch] = average;
          }
        });

        // Calculate percentile (mock - based on score distribution)
        const percentile = avgScore >= 80 ? Math.min(95, avgScore + 10)
          : avgScore >= 60 ? Math.min(80, avgScore + 15)
            : Math.max(30, avgScore);

        // Merge with base stats
        baseStats = {
          ...baseStats,
          scores: newScores,
          consensusAlignment: avgScore,
          percentile: percentile,
          history: [...sessionHistory, ...(baseStats.history || [])].slice(0, 50), // Keep last 50
          completionCount: sessions.length + (baseStats.completionCount || 0)
        };

        console.log('App: Calculated stats from sessions', { sessionCount: sessions.length, avgScore, scores: newScores });
      }

      console.log('App: Loaded stats from Supabase', baseStats);
      setStats(baseStats);

      // Fetch profile for future use (e.g., displaying name/role)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        console.log("Profile details loaded for UI purposes");
        // Trigger tour if not complete and on a home route
        if (!profileData.walkthrough_complete && location.pathname.includes('/home')) {
          setShowTour(true);
        }
      }
    } catch (err) {
      loadStatsFromLocal();
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const saveStats = async (newStats: UserStats, currentSession = session) => {
    setStats(newStats);
    localStorage.setItem('userStats', JSON.stringify(newStats));

    if (currentSession && remoteSyncEnabled) {
      try {
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: currentSession.user.id,
            data: newStats,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          setRemoteSyncEnabled(false);
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    }
  };

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };


  const handleExamComplete = (newScore: number, branch: Branch) => {
    // We now rely on the DB trigger to calculate stats, so we should just refetch.
    // However, to keep the UI snappy for the immediate result screen, we might want to pass the single result.
    // The stats object usually updates via remote sync or re-fetch on mount/update.

    // Optimistic update for local UI (optional, but keep it consistent with DB logic if possible)
    // Actually, distinct from before, let's just trigger a re-fetch of stats to get the DB-calculated averages
    if (session) {
      setTimeout(() => {
        loadStatsFromSupabase(session.user.id);
      }, 1000); // Small delay to ensure trigger has run
    }

    setLastResult({ score: newScore, branch });
    navigate('/home/history/latest');
    setSelectedBranch(null);
  };


  const handleStartModule = (branch: Branch) => {
    setSelectedBranch(branch);
    navigate('/assessment');
  };

  const handleUpdateProfile = async (data: { full_name?: string }) => {
    if (!session) return;

    try {
      // 1. Update Auth Metadata (Source of truth for session)
      const { data: { user }, error: authError } = await supabase.auth.updateUser({
        data: data
      });

      if (authError) throw authError;

      // 2. Update Public Profile Table
      if (user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: data.full_name,
          updated_at: new Date().toISOString()
        });

        if (profileError) throw profileError;

        // Force session refresh to reflect changes immediately in UI
        const { data: { session: newSession } } = await supabase.auth.refreshSession();
        if (newSession) setSession(newSession);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    // 1. Clear Supabase Session
    await supabase.auth.signOut();

    // 2. Clear Local State
    setSession(null);
    setUserRole(null);
    setStats(INITIAL_STATS);
    setOnboardingComplete(null);

    // 3. Clear Storage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStats');
    sessionStorage.removeItem('splash_shown');

    // 4. Force Navigation
    navigate('/auth', { replace: true });
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-2 border-white rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth isDark={isDark} toggleTheme={toggleTheme} />} />
        <Route path="/ebook" element={<Ebook />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }
  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} isDark={isDark} />;



  if (session && userRole === null) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
          <svg className="animate-spin w-full h-full text-white" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="80" strokeDashoffset="20"></circle>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 font-serif italic">Authenticating...</h2>
        <p className="text-gray-400 text-sm font-light tracking-wide">Establishing secure connection protocols.</p>
      </div>
    );
  }

  // Redirect ebook users who try to access the main app
  if (userRole === 'ebook' && !location.pathname.startsWith('/ebook')) {
    return <Navigate to="/ebook" replace />;
  }

  return (
    <>
      <Toaster position="top-right" />
      {showTour && <AppTour onComplete={handleTourComplete} />}
      <Routes>
        {/* Standalone pages - no Layout wrapper */}
        <Route path="/404" element={<NotFound />} />
        <Route path="/ebook" element={<Ebook />} />

        {/* Dedicated Onboarding Route */}
        <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} />} />

        <Route path="/assessment" element={<Assessment onComplete={handleExamComplete} onCancel={() => { navigate('/home/dashboard'); setSelectedBranch(null); }} initialBranch={selectedBranch} />} />

        {/* Test Runner - Standalone */}
        <Route path="/test/:testId" element={
          <TestRunnerWrapper
            onComplete={() => navigate('/home/practice')}
            onCancel={() => navigate('/home/practice')}
          />
        } />

        {/* All other routes wrapped in Layout */}
        <Route path="/*" element={
          <Layout
            activeTab={activeTab}
            onTabChange={(tab) => {
              // Determine base from current URL, not just role, so admins can stay on /home if viewing student dashboard
              const currentBase = location.pathname.startsWith('/admin') ? 'admin' : 'home';
              navigate(`/${currentBase}/${tab}`);
              if (tab !== 'assessment') setSelectedBranch(null);
            }}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onLogout={handleLogout}
            user={session?.user}
            role={userRole}
          >
            <Routes>
              {/* Root redirect */}
              <Route index element={<Navigate to={userRole === 'admin' ? "/admin/dashboard" : userRole === 'ebook' ? "/ebook" : "/home/dashboard"} replace />} />
              <Route path="/" element={<Navigate to={userRole === 'admin' ? "/admin/dashboard" : userRole === 'ebook' ? "/ebook" : "/home/dashboard"} replace />} />
              <Route path="/dashboard" element={<Navigate to="/home/dashboard" replace />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />

              {/* Student Routes */}
              <Route path="/home" element={<Navigate to="/home/dashboard" replace />} />
              <Route path="/home/dashboard" element={<Dashboard stats={stats} user={session?.user} isDark={isDark} onStartExam={() => navigate('/assessment')} onStartPractice={() => navigate('/home/practice')} onLogout={handleLogout} toggleTheme={toggleTheme} onTabChange={(tab) => navigate(`/home/${tab}`)} />} />
              <Route path="/home/history/:id" element={lastResult ? <Results score={lastResult.score} branch={lastResult.branch} stats={stats} onBack={() => navigate('/home/history')} isDark={isDark} /> : <Navigate to="/home/history" replace />} />
              <Route path="/home/analytics" element={<Analytics stats={stats} isDark={isDark} />} />
              <Route path="/home/history" element={<History stats={stats} />} />
              <Route path="/home/practice" element={<Practice onStartTest={(testId) => {
                window.open(`/test/${testId}`, '_blank');
              }} />} />
              <Route path="/home/classroom" element={<Classroom />} />
              <Route path="/home/tutors" element={<Tutors />} />
              <Route path="/home/profile" element={<Profile user={session?.user} onUpdate={handleUpdateProfile} />} />

              {/* Admin Routes */}
              {userRole === 'admin' && (
                <>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/users/:id" element={<AdminUsers />} />
                  <Route path="/admin/classes" element={<AdminClasses />} />
                  <Route path="/admin/classes/:id" element={<AdminClasses />} />
                  <Route path="/admin/practice" element={<AdminPractice />} />
                  <Route path="/admin/practice/:id" element={<AdminPractice />} />
                </>
              )}

              {/* Unknown routes redirect to 404 */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </>
  );
}

export default App;
