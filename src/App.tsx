/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Coins, Trophy, Flame, Play, Lock, Sparkles, 
  Settings, Award, Volume2, VolumeX, BarChart3, 
  Bell, CheckCircle2, Cpu, ShieldAlert, Languages, Info,
  Sparkle, ShieldCheck, LogOut, LayoutDashboard, Compass, 
  User, Signal, Battery, Wifi, Crown
} from 'lucide-react';

import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import LeaderboardView from './components/LeaderboardView';
import AchievementsView from './components/AchievementsView';
import AdminPanel from './components/AdminPanel';

// Game files
import MemoryMatch from './components/games/MemoryMatch';
import MathChallenge from './components/games/MathChallenge';
import ReactionSpeed from './components/games/ReactionSpeed';
import PatternRecognition from './components/games/PatternRecognition';
import ColorShapeMemory from './components/games/ColorShapeMemory';
import NumberPuzzle from './components/games/NumberPuzzle';
import IQQuiz from './components/games/IQQuiz';

import { Game, UserProfile, Difficulty, AppAnnouncement } from './types';
import { getTranslation, Language } from './utils/translations';
import { audio } from './utils/audio';

const INITIAL_GAMES: Game[] = [
  { id: 'memory', name: 'Memory Match', category: 'Memory Match', description: 'Test your visual recall and card pairing speed.', icon: 'Brain', difficulty: 'Easy', isUnlocked: true, coinCost: 0, highScore: 0, popularity: 82 },
  { id: 'math', name: 'Math Challenge', category: 'Math Challenge', description: 'Mental calculations that scale dynamically based on accuracy.', icon: 'Zap', difficulty: 'Medium', isUnlocked: true, coinCost: 0, highScore: 0, popularity: 95 },
  { id: 'reaction', name: 'Reaction Speed', category: 'Reaction Speed Test', description: 'Measure visual reaction latencies in high precision milliseconds.', icon: 'Flame', difficulty: 'Hard', isUnlocked: true, coinCost: 0, highScore: 0, popularity: 88 },
  { id: 'pattern', name: 'Sequence Recall', category: 'Pattern Recognition', description: 'Memorize and recall sequential tile illumination paths.', icon: 'Compass', difficulty: 'Medium', isUnlocked: false, coinCost: 50, highScore: 0, popularity: 74 },
  { id: 'color_shape', name: 'Visual Match', category: 'Color & Shape Memory', description: 'Identify changes in visual shapes and color pairings.', icon: 'Eye', difficulty: 'Easy', isUnlocked: false, coinCost: 80, highScore: 0, popularity: 69 },
  { id: 'number_puzzle', name: 'Number Slider', category: 'Number Puzzle', description: 'Slide grid blocks into perfect chronological sequences.', icon: 'RotateCcw', difficulty: 'Hard', isUnlocked: false, coinCost: 100, highScore: 0, popularity: 62 },
  { id: 'iq', name: 'IQ & Logic Test', category: 'IQ Quiz', description: 'Solve advanced spatial reasoning and logic riddles.', icon: 'Award', difficulty: 'Hard', isUnlocked: false, coinCost: 150, highScore: 0, popularity: 91 }
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [currentTab, setCurrentTab] = useState<'home' | 'leaderboard' | 'achievements' | 'admin'>('home');
  const [systemTime, setSystemTime] = useState('');
  
  // Dynamic system push notification banner state
  const [pushNotification, setPushNotification] = useState<{ title: string; body: string } | null>(null);

  // App announcements list
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([
    {
      id: 'welcome_ann',
      title: 'Welcome to Mind Master v1.4!',
      content: 'Unveil daily rewards, explore dynamic game modes, and challenge your brain limits with our performance-adaptive algorithms.',
      timestamp: '08:30 AM',
      sender: 'Lead Developer'
    }
  ]);

  // Load profile from local storage if available
  useEffect(() => {
    const savedProfile = localStorage.getItem('mindmaster_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile) as UserProfile;
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('mindmaster_profile');
      }
    }

    // Load custom games locked/unlocked state
    const savedGames = localStorage.getItem('mindmaster_games_store');
    if (savedGames) {
      try {
        setGames(JSON.parse(savedGames));
      } catch (e) {}
    }

    // Dynamic clock ticking for device header
    const updateClock = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('mindmaster_profile', JSON.stringify(profile));
  };

  const handleLogout = () => {
    audio.playFailure();
    setUser(null);
    localStorage.removeItem('mindmaster_profile');
    setCurrentTab('home');
    setActiveGame(null);
  };

  const deductCoins = (amount: number): boolean => {
    if (!user) return false;
    if (user.coins >= amount) {
      const updated = { ...user, coins: user.coins - amount };
      setUser(updated);
      localStorage.setItem('mindmaster_profile', JSON.stringify(updated));
      return true;
    }
    return false;
  };

  const triggerPushNotification = (title: string, body: string) => {
    setPushNotification({ title, body });
    // Auto clear after 4s
    setTimeout(() => {
      setPushNotification(null);
    }, 4000);
  };

  const handleGameComplete = (score: number, coinsEarned: number, xpEarned: number, accuracy: number) => {
    if (!user || !activeGame) return;

    // Check highscore
    const previousHighScore = user.scoresHistory[activeGame.id] 
      ? Math.max(...user.scoresHistory[activeGame.id].map(h => h.score), 0)
      : 0;

    const isNewHighScore = score > previousHighScore;

    // Build entry
    const entry = {
      date: new Date().toISOString().split('T')[0],
      score,
      accuracy
    };

    // Update game scores history
    const historyList = user.scoresHistory[activeGame.id] || [];
    const updatedHistory = [...historyList, entry];

    // Compute achievements unlocking criteria on completion
    const currentBadges = [...user.badges];
    if (user.gamesPlayed === 0 && !currentBadges.includes('first_game')) {
      currentBadges.push('first_game');
      triggerPushNotification('Badge Unlocked! 🏅', 'Earned the "First Synapse" milestone badge!');
    }
    if (activeGame.id === 'math' && accuracy >= 95 && !currentBadges.includes('math_genius')) {
      currentBadges.push('math_genius');
      triggerPushNotification('Badge Unlocked! 🏅', 'Earned the "Cortex Calculator" milestone badge!');
    }
    if (activeGame.id === 'reaction' && score >= 1200 && !currentBadges.includes('speed_demon')) {
      currentBadges.push('speed_demon');
      triggerPushNotification('Badge Unlocked! 🏅', 'Earned the "Reflex Master" milestone badge!');
    }

    const updatedProfile: UserProfile = {
      ...user,
      coins: user.coins + coinsEarned,
      xp: user.xp + xpEarned,
      gamesPlayed: user.gamesPlayed + 1,
      badges: currentBadges,
      scoresHistory: {
        ...user.scoresHistory,
        [activeGame.id]: updatedHistory
      }
    };

    // Update game records highscores
    if (isNewHighScore) {
      setGames(prev => {
        const next = prev.map(g => g.id === activeGame.id ? { ...g, highScore: score } : g);
        localStorage.setItem('mindmaster_games_store', JSON.stringify(next));
        return next;
      });
    }

    setUser(updatedProfile);
    localStorage.setItem('mindmaster_profile', JSON.stringify(updatedProfile));
  };

  const handleUnlockGame = (gameId: string, cost: number) => {
    if (!user) return;
    if (user.coins >= cost) {
      const updatedProfile = {
        ...user,
        coins: user.coins - cost,
        unlockedGames: [...user.unlockedGames, gameId]
      };
      
      setUser(updatedProfile);
      localStorage.setItem('mindmaster_profile', JSON.stringify(updatedProfile));

      setGames(prev => {
        const next = prev.map(g => g.id === gameId ? { ...g, isUnlocked: true } : g);
        localStorage.setItem('mindmaster_games_store', JSON.stringify(next));
        return next;
      });

      triggerPushNotification('Game Unlocked! 🎮', `Category game is now fully playable!`);
    }
  };

  const updateSimulatedCoins = (amount: number) => {
    if (!user) return;
    const updated = { ...user, coins: Math.max(0, user.coins + amount) };
    setUser(updated);
    localStorage.setItem('mindmaster_profile', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#0A0E21] flex items-center justify-center font-sans">
      
      {/* Dynamic Push Notification Banner (Floating HUD) */}
      <AnimatePresence>
        {pushNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-0 z-50 max-w-sm w-full mx-4 bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 shadow-xl shadow-cyan-500/10"
          >
            <div className="p-2 bg-cyan-500/15 rounded-xl border border-cyan-500/30">
              <Crown className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">{pushNotification.title}</p>
              <p className="text-[11px] text-gray-300 leading-normal">{pushNotification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!user ? (
        <div className="w-full">
          <AuthScreen 
            lang={lang} 
            setLang={setLang} 
            onLoginSuccess={handleLoginSuccess} 
          />
        </div>
      ) : (
        /* The Smartphone Device Wrapper Frame (on desktop, normal fluid view on mobile) */
        <div className="w-full max-w-md md:h-[840px] md:border-[10px] md:border-slate-900 md:rounded-[44px] md:shadow-2xl md:shadow-cyan-500/5 relative overflow-hidden bg-[#0A0E21] md:flex md:flex-col">
          
          {/* Simulated Phone Status Bar Notch at top (Desktop only) */}
          <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-1 bg-[#0A0E21] border-b border-white/5 select-none text-[11px] text-gray-400 font-semibold">
            <span>{systemTime}</span>
            {/* Notch */}
            <div className="w-24 h-4 bg-slate-900 rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2" />
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Main App Content View Container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5 pb-20">
            <AnimatePresence mode="wait">
              {activeGame ? (
                /* Interactive Games Shell Route mapping */
                <motion.div 
                  key="active-game"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {activeGame.id === 'memory' && (
                    <MemoryMatch 
                      difficulty={difficulty}
                      lang={lang}
                      onBack={() => setActiveGame(null)}
                      onGameComplete={handleGameComplete}
                      user={user}
                      deductCoins={deductCoins}
                    />
                  )}
                  {activeGame.id === 'math' && (
                    <MathChallenge 
                      difficulty={difficulty}
                      lang={lang}
                      onBack={() => setActiveGame(null)}
                      onGameComplete={handleGameComplete}
                      user={user}
                    />
                  )}
                  {activeGame.id === 'reaction' && (
                    <ReactionSpeed 
                      difficulty={difficulty}
                      lang={lang}
                      onBack={() => setActiveGame(null)}
                      onGameComplete={handleGameComplete}
                    />
                  )}
                  {activeGame.id === 'pattern' && (
                    <PatternRecognition 
                      difficulty={difficulty}
                      lang={lang}
                      onBack={() => setActiveGame(null)}
                      onGameComplete={handleGameComplete}
                    />
                  )}
                  {activeGame.id === 'color_shape' && (
                    <ColorShapeMemory 
                      difficulty={difficulty}
                      lang={lang}
                      onBack={() => setActiveGame(null)}
                      onGameComplete={handleGameComplete}
                    />
                  )}
                  {activeGame.id === 'number_puzzle' && (
                    <NumberPuzzle 
                      difficulty={difficulty}
                      lang={lang}
                      onBack={() => setActiveGame(null)}
                      onGameComplete={handleGameComplete}
                      user={user}
                      deductCoins={deductCoins}
                    />
                  )}
                  {activeGame.id === 'iq' && (
                    <IQQuiz 
                      difficulty={difficulty}
                      lang={lang}
                      onBack={() => setActiveGame(null)}
                      onGameComplete={handleGameComplete}
                    />
                  )}
                </motion.div>
              ) : (
                /* Primary Tab Navigation view mapping */
                <motion.div 
                  key={currentTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {currentTab === 'home' && (
                    <Dashboard 
                      user={user}
                      lang={lang}
                      setLang={setLang}
                      games={games}
                      onUnlockGame={handleUnlockGame}
                      onSelectGame={(g) => {
                        audio.playTap();
                        setActiveGame(g);
                      }}
                      difficulty={difficulty}
                      setDifficulty={setDifficulty}
                      onLogout={handleLogout}
                      announcements={announcements}
                      deductCoins={deductCoins}
                    />
                  )}

                  {currentTab === 'leaderboard' && (
                    <LeaderboardView user={user} lang={lang} />
                  )}

                  {currentTab === 'achievements' && (
                    <AchievementsView user={user} lang={lang} />
                  )}

                  {currentTab === 'admin' && (
                    <AdminPanel 
                      lang={lang}
                      user={user}
                      games={games}
                      setGames={setGames}
                      announcements={announcements}
                      setAnnouncements={setAnnouncements}
                      onUpdateUserCoins={updateSimulatedCoins}
                      triggerPushNotification={triggerPushNotification}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Navigation HUD bar (Visible only if not in an active game) */}
          {!activeGame && (
            <div className="absolute bottom-0 inset-x-0 h-16 bg-[#0A0E21]/80 border-t border-white/5 backdrop-blur-lg flex justify-around items-center px-4 z-40 select-none">
              {[
                { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                { id: 'achievements', label: 'Badges', icon: Award },
                { id: 'admin', label: 'Admin', icon: Cpu }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = currentTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      audio.playTap();
                      setCurrentTab(tab.id as any);
                    }}
                    className={`flex flex-col items-center justify-center py-1.5 transition-all w-16 cursor-pointer ${
                      active ? 'text-cyan-300 scale-105' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-bold tracking-wider">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
