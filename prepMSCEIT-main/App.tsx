
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Assessment } from './components/Assessment';
import { Training } from './components/Training';
import { Analytics } from './components/Analytics';
import { Profile } from './components/Profile';
import { Tutors } from './components/Tutors';
import { Results } from './components/Results';
import { History } from './components/History';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { UserStats, Branch } from './types';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';

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
          src="https://80648f23d1b436c9680a76f256663212.cdn.bubble.io/f1765931308525x632039041304004700/2.png"
          alt="prepMSCEIT Logo Dark"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
        <img
          src="https://80648f23d1b436c9680a76f256663212.cdn.bubble.io/f1765931313852x208585298521758880/3.png"
          alt="prepMSCEIT Logo Light"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${!isDark ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 animate-fade-in-up text-black dark:text-white">prepMSCEIT</h1>
      <p className="text-sm font-medium text-gray-500 max-w-md text-center px-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        "{quote}"
      </p>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [remoteSyncEnabled, setRemoteSyncEnabled] = useState(true);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setShowSplash(true);
        checkOnboarding(session);
        loadStatsFromSupabase(session.user.id);
      }
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        if (event === 'SIGNED_IN') setShowSplash(true);
        checkOnboarding(session);
        loadStatsFromSupabase(session.user.id);
      } else {
        setStats(INITIAL_STATS);
        setShowOnboarding(false);
        setShowSplash(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboarding = (session: Session) => {
    const metadata = session.user.user_metadata;
    if (!metadata || metadata.onboarding_complete !== true) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    setSession(refreshedSession);
    setShowOnboarding(false);

    if (refreshedSession) {
      // Sync profile to database
      const metadata = refreshedSession.user.user_metadata;
      if (metadata && metadata.profile) {
        await supabase.from('profiles').upsert({
          id: refreshedSession.user.id,
          full_name: metadata.full_name || '',
          role: metadata.profile.role,
          goal: metadata.profile.goal,
          experience_level: metadata.profile.experience,
          updated_at: new Date().toISOString()
        });
      }
      saveStats(INITIAL_STATS, refreshedSession);
    }
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
      const { data, error } = await supabase
        .from('user_progress')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.log('App: Supabase stats error', error);
        setRemoteSyncEnabled(false);
        loadStatsFromLocal();
      } else if (data && data.data) {
        console.log('App: Loaded stats from Supabase', data.data);
        setStats(data.data as UserStats);
      } else {
        console.log('App: No stats found in Supabase');
        loadStatsFromLocal();
      }

      // Fetch profile for future use (e.g., displaying name/role)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        console.log("Profile loaded:", profileData);
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
    const currentBranchScore = stats.scores[branch] || 0;
    const updatedScore = currentBranchScore === 0 ? newScore : Math.round((currentBranchScore + newScore) / 2);

    const currentLevel = stats.masteryLevels[branch] || 1;
    const shouldLevelUp = newScore >= 80 && currentLevel < 10;
    const newLevel = shouldLevelUp ? currentLevel + 1 : currentLevel;

    const allScores = (Object.values({ ...stats.scores, [branch]: updatedScore }) as number[]).filter(s => s > 0);
    const newAlignment = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : newScore;

    const newStats: UserStats = {
      ...stats,
      scores: { ...stats.scores, [branch]: updatedScore },
      masteryLevels: { ...stats.masteryLevels, [branch]: newLevel },
      consensusAlignment: newAlignment,
      percentile: Math.min(99, Math.round(newAlignment * 1.1)),
      history: [
        ...stats.history,
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          score: newScore,
          branch: branch
        }
      ],
      completionCount: stats.completionCount + 1,
      weakestBranch: (Object.entries({ ...stats.scores, [branch]: updatedScore }) as [Branch, number][]).reduce((a, b) => a[1] < b[1] ? a : b)[0]
    };

    saveStats(newStats);

    // Save to assessment_history table
    if (session) {
      supabase.from('assessment_history').insert({
        user_id: session.user.id,
        branch: branch,
        score: newScore,
        created_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error("History save error:", error);
      });
    }

    setLastResult({ score: newScore, branch });
    setActiveTab('results');
    setSelectedBranch(null);
  };

  const handleStartModule = (branch: Branch) => {
    setSelectedBranch(branch);
    setActiveTab('assessment');
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
    await supabase.auth.signOut();
    setActiveTab('dashboard');
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

  if (!session) return <Auth isDark={isDark} toggleTheme={toggleTheme} />;
  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} isDark={isDark} />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== 'assessment') setSelectedBranch(null);
      }}
      isDark={isDark}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
      user={session?.user}
    >
      {activeTab === 'dashboard' && <Dashboard stats={stats} user={session?.user} isDark={isDark} onStartExam={() => setActiveTab('assessment')} onStartTraining={() => setActiveTab('training')} onLogout={handleLogout} toggleTheme={toggleTheme} onTabChange={setActiveTab} />}
      {activeTab === 'assessment' && <Assessment onComplete={handleExamComplete} onCancel={() => { setActiveTab('dashboard'); setSelectedBranch(null); }} initialBranch={selectedBranch} />}
      {activeTab === 'results' && lastResult && <Results score={lastResult.score} branch={lastResult.branch} stats={stats} onBack={() => setActiveTab('dashboard')} isDark={isDark} />}
      {activeTab === 'analytics' && <Analytics stats={stats} isDark={isDark} />}
      {activeTab === 'history' && <History stats={stats} />}
      {activeTab === 'training' && <Training stats={stats} onRunModule={handleStartModule} />}
      {activeTab === 'tutors' && <Tutors />}
      {activeTab === 'profile' && <Profile user={session?.user} onUpdate={handleUpdateProfile} />}
    </Layout>
  );
}

export default App;
