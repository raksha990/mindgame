import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Coins, Trophy, Flame, Play, Lock, Sparkles, 
  Settings, Award, Volume2, VolumeX, BarChart3, 
  Bell, CheckCircle2, Cpu, ShieldAlert, Languages, Info
} from 'lucide-react';
import { getTranslation, Language } from '../utils/translations';
import { UserProfile, Game, Difficulty, DailyChallenge, AppAnnouncement } from '../types';
import { audio } from '../utils/audio';

interface DashboardProps {
  user: UserProfile;
  lang: Language;
  setLang: (lang: Language) => void;
  games: Game[];
  onUnlockGame: (gameId: string, cost: number) => void;
  onSelectGame: (game: Game) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  onLogout: () => void;
  announcements: AppAnnouncement[];
  deductCoins: (amount: number) => boolean;
}

export default function Dashboard({
  user,
  lang,
  setLang,
  games,
  onUnlockGame,
  onSelectGame,
  difficulty,
  setDifficulty,
  onLogout,
  announcements,
  deductCoins
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'lobby' | 'progress' | 'settings'>('lobby');
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());

  // Daily Challenge data
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>({
    id: 'daily_01',
    gameId: 'memory',
    title: 'Achieve 300+ score in Memory Match!',
    rewardCoins: 40,
    targetScore: 300,
    completed: false
  });

  const [claimedDaily, setClaimedDaily] = useState(false);

  // Filter game categories
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | 'Memory' | 'Speed' | 'Math' | 'Logic'>('All');

  const filteredGames = games.filter(g => {
    if (selectedCategoryFilter === 'All') return true;
    if (selectedCategoryFilter === 'Memory') return g.category.includes('Memory') || g.name.includes('Pattern');
    if (selectedCategoryFilter === 'Speed') return g.name.includes('Reaction');
    if (selectedCategoryFilter === 'Math') return g.category.includes('Math');
    if (selectedCategoryFilter === 'Logic') return g.category.includes('IQ') || g.category.includes('Puzzle');
    return true;
  });

  const handleClaimDailyReward = () => {
    if (claimedDaily) return;
    audio.playSuccess();
    setClaimedDaily(true);
    user.coins += dailyChallenge.rewardCoins;
    localStorage.setItem('mindmaster_profile', JSON.stringify(user));
  };

  const handleUnlockClick = (game: Game) => {
    if (user.coins >= game.coinCost) {
      audio.playLevelUp();
      onUnlockGame(game.id, game.coinCost);
    } else {
      audio.playFailure();
    }
  };

  const toggleSound = () => {
    const isMuted = audio.toggleMute();
    setHasMuted(isMuted);
  };

  // SVG Chart Helper Data Calculations
  // Get score logs
  const getOverallScoreHistory = () => {
    const logs: { date: string; score: number }[] = [];
    Object.values(user.scoresHistory).forEach(history => {
      history.forEach(h => {
        logs.push({ date: h.date, score: h.score });
      });
    });
    // Sort and take latest 6
    return logs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-6);
  };

  const scoreLogs = getOverallScoreHistory();

  // Categories metrics
  const getCategoriesMetrics = () => {
    const metrics = [
      { name: 'Memory', score: 0 },
      { name: 'Quantitative', score: 0 },
      { name: 'Reaction Speed', score: 0 },
      { name: 'Visual Recall', score: 0 },
      { name: 'Deductive IQ', score: 0 }
    ];

    // Compute averages from highscores
    if (user.scoresHistory['memory']?.length) {
      metrics[0].score = Math.max(...user.scoresHistory['memory'].map(h => h.score));
    } else metrics[0].score = 250;

    if (user.scoresHistory['math']?.length) {
      metrics[1].score = Math.max(...user.scoresHistory['math'].map(h => h.score));
    } else metrics[1].score = 180;

    if (user.scoresHistory['reaction']?.length) {
      metrics[2].score = Math.max(...user.scoresHistory['reaction'].map(h => h.score));
    } else metrics[2].score = 400;

    if (user.scoresHistory['color_shape']?.length) {
      metrics[3].score = Math.max(...user.scoresHistory['color_shape'].map(h => h.score));
    } else metrics[3].score = 200;

    if (user.scoresHistory['iq']?.length) {
      metrics[4].score = Math.max(...user.scoresHistory['iq'].map(h => h.score));
    } else metrics[4].score = 300;

    return metrics;
  };

  const categoryMetrics = getCategoriesMetrics();

  // Native SVG Line Graph rendering
  const renderLineChart = () => {
    if (scoreLogs.length < 2) {
      // Fallback mockup trend lines if user hasn't played games
      const mockPoints = [150, 310, 240, 520, 480, 690];
      const width = 360;
      const height = 150;
      const maxVal = 800;
      const pointsStr = mockPoints.map((val, idx) => {
        const x = (idx / (mockPoints.length - 1)) * (width - 40) + 20;
        const y = height - (val / maxVal) * (height - 40) - 20;
        return `${x},${y}`;
      }).join(' ');

      return (
        <svg className="w-full h-40" viewBox="0 0 360 150">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1="20" y1="20" x2="340" y2="20" stroke="rgba(255,255,255,0.05)" />
          <line x1="20" y1="65" x2="340" y2="65" stroke="rgba(255,255,255,0.05)" />
          <line x1="20" y1="110" x2="340" y2="110" stroke="rgba(255,255,255,0.05)" />
          
          {/* Trend Line Path */}
          <polyline fill="none" stroke="#22d3ee" strokeWidth="3" points={pointsStr} />
          
          {/* Area Fill */}
          <path fill="url(#chartGrad)" d={`M 20,130 ${pointsStr} L 340,130 Z`} />

          {/* Dots on points */}
          {mockPoints.map((val, idx) => {
            const x = (idx / (mockPoints.length - 1)) * (width - 40) + 20;
            const y = height - (val / maxVal) * (height - 40) - 20;
            return <circle key={idx} cx={x} cy={y} r="4" fill="#a855f7" stroke="#22d3ee" strokeWidth="1" />;
          })}
        </svg>
      );
    }

    const width = 360;
    const height = 150;
    const scores = scoreLogs.map(l => l.score);
    const minVal = Math.min(...scores);
    const maxVal = Math.max(...scores) + 50;
    const valDiff = maxVal - minVal || 10;

    const pointsStr = scoreLogs.map((log, idx) => {
      const x = (idx / (scoreLogs.length - 1)) * (width - 40) + 20;
      const y = height - ((log.score - minVal) / valDiff) * (height - 40) - 20;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-40" viewBox="0 0 360 150">
        <defs>
          <linearGradient id="chartGradReal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="20" y1="20" x2="340" y2="20" stroke="rgba(255,255,255,0.05)" />
        <line x1="20" y1="65" x2="340" y2="65" stroke="rgba(255,255,255,0.05)" />
        <line x1="20" y1="110" x2="340" y2="110" stroke="rgba(255,255,255,0.05)" />

        <polyline fill="none" stroke="#a855f7" strokeWidth="3.5" points={pointsStr} />
        <path fill="url(#chartGradReal)" d={`M 20,130 ${pointsStr} L 340,130 Z`} />

        {scoreLogs.map((log, idx) => {
          const x = (idx / (scoreLogs.length - 1)) * (width - 40) + 20;
          const y = height - ((log.score - minVal) / valDiff) * (height - 40) - 20;
          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="4.5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />
              <text x={x} y={y - 10} fontSize="8" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
                {log.score}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6 text-white">
      {/* Lobby Greeting & Profile Bar */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-md relative overflow-hidden">
        <div className="flex gap-3 items-center">
          <img 
            src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt="Profile Avatar"
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-2xl object-cover border-2 border-cyan-400 p-0.5 shadow-md shadow-cyan-500/10"
          />
          <div>
            <h3 className="text-sm font-black font-display text-white uppercase tracking-tight">
              {getTranslation(lang, 'dashboardGreeting', { name: user.displayName })}
            </h3>
            <p className="text-[9px] font-black tracking-wider text-cyan-300 uppercase">Cerebral XP: {user.xp}</p>
          </div>
        </div>

        {/* Coins, Streak & Notification Bell */}
        <div className="flex gap-1.5 items-center">
          <div className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-black text-yellow-400 font-display">{user.coins}</span>
          </div>

          {/* Daily Streak */}
          <div className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow-lg text-amber-400">
            <Flame className="w-3.5 h-3.5 fill-amber-400 animate-pulse" />
            <span className="text-xs font-black font-display">{user.streak}</span>
          </div>

          {/* Bell Icon for System Alerts */}
          <button 
            onClick={() => {
              audio.playTap();
              setShowNotifications(!showNotifications);
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/15 relative transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 text-purple-400" />
            {announcements.length > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0A0E21] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Slideout Notification Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-950/40 border border-indigo-500/35 rounded-2xl p-4 space-y-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-indigo-300">System Bulletins</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-full uppercase font-bold">Live Updates</span>
            </div>
            {announcements.length === 0 ? (
              <p className="text-[10px] text-gray-400 text-center py-2">No new brain trainer updates active.</p>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {announcements.map((ann) => (
                  <div key={ann.id} className="space-y-1 p-2.5 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-xs font-bold text-cyan-200">{ann.title}</p>
                    <p className="text-[10.5px] text-gray-300 leading-normal">{ann.content}</p>
                    <p className="text-[8px] text-gray-500 text-right">{ann.timestamp} by {ann.sender}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub tabs inside Dashboard */}
      <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl">
        {[
          { id: 'lobby', label: 'Lobby', icon: Brain },
          { id: 'progress', label: 'Brain Progress', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                audio.playTap();
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                active 
                  ? 'bg-white text-[#0A0E21] border-white shadow-xl shadow-cyan-500/5' 
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab content router */}
      <div className="animate-fade-in">
        {activeTab === 'lobby' && (
          <div className="space-y-6">
            
            {/* Daily Brain Challenge Header Card */}
            <div className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 rounded-[32px] p-6 relative overflow-hidden shadow-2xl shadow-indigo-900/40">
              <div className="absolute -right-4 -top-4 text-[120px] leading-none font-black opacity-10 select-none text-white font-display pointer-events-none uppercase tracking-tighter">
                XP
              </div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <span className="text-[9px] bg-white/10 text-cyan-200 px-2.5 py-1 rounded-full uppercase font-black tracking-widest border border-white/10">
                    {getTranslation(lang, 'dailyChallenge')}
                  </span>
                  <h2 className="text-xl font-black font-display text-white mt-3 uppercase tracking-tight leading-tight max-w-[240px]">
                    {dailyChallenge.title}
                  </h2>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10 flex items-center gap-1 text-white font-black text-xs tracking-wider">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span>+{dailyChallenge.rewardCoins} PTS</span>
                </div>
              </div>

              {claimedDaily ? (
                <div className="flex items-center gap-1.5 text-emerald-300 font-black text-xs bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-2xl relative z-10 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Daily Reward Claimed! Come back tomorrow!</span>
                </div>
              ) : (
                <div className="flex gap-3 justify-end relative z-10">
                  <button 
                    onClick={handleClaimDailyReward}
                    className="px-6 py-3 rounded-2xl bg-white text-indigo-950 hover:bg-gray-100 font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xl shadow-indigo-900/30"
                  >
                    Claim Reward (+{dailyChallenge.rewardCoins} Coins)
                  </button>
                </div>
              )}
            </div>

            {/* Filter buttons for category mapping */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(['All', 'Memory', 'Speed', 'Math', 'Logic'] as any[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    audio.playTap();
                    setSelectedCategoryFilter(cat);
                  }}
                  className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border select-none shrink-0 cursor-pointer ${
                    selectedCategoryFilter === cat 
                      ? 'bg-white border-white text-[#0A0E21] shadow-lg' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Games Listing Card Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredGames.map((game) => {
                const isGameLocked = !game.isUnlocked && !user.unlockedGames.includes(game.id);

                return (
                  <motion.div
                    key={game.id}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      if (isGameLocked) {
                        handleUnlockClick(game);
                      } else {
                        audio.playTap();
                        onSelectGame(game);
                      }
                    }}
                    className={`bg-white/5 border rounded-[28px] p-5 flex justify-between items-center gap-4 relative overflow-hidden backdrop-blur-xl transition-all cursor-pointer select-none ${
                      isGameLocked 
                        ? 'border-white/5 opacity-80 bg-[#0A0E21]/60 hover:border-yellow-500/30' 
                        : 'border-white/10 hover:border-white/35 hover:bg-white/10 shadow-xl shadow-cyan-500/5'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black border ${
                          game.id === 'memory' || game.id === 'pattern' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20' :
                          game.id === 'math' ? 'text-pink-400 bg-pink-400/10 border-pink-500/20' :
                          game.id === 'reaction' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20' :
                          'text-purple-400 bg-purple-400/10 border-purple-500/20'
                        }`}>
                          {game.category}
                        </span>
                        {!isGameLocked && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-emerald-500/20">
                            Available
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-black text-white font-display uppercase tracking-tight">
                        {game.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed pr-3">
                        {game.description}
                      </p>
                    </div>

                    {/* Action buttons (Unlock vs Play) */}
                    <div className="shrink-0 z-10">
                      {isGameLocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockClick(game);
                          }}
                          disabled={user.coins < game.coinCost}
                          className="py-3 px-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400 text-yellow-400 hover:text-[#0A0E21] disabled:opacity-40 font-black text-[10px] uppercase tracking-wider flex flex-col items-center gap-1 transition-all cursor-pointer w-24 shadow-md"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock ({game.coinCost})</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playTap();
                            onSelectGame(game);
                          }}
                          className="w-12 h-12 rounded-2xl bg-white hover:bg-gray-100 text-[#0A0E21] flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                        >
                          <Play className="w-5 h-5 fill-[#0A0E21] text-[#0A0E21]" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            
            {/* Native SVG Progress trend card */}
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">Cognitive Index Trend</h3>
                  <p className="text-[10px] text-gray-400">Tracks performance scores across latest completed rounds</p>
                </div>
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <div className="w-full flex justify-center py-2">
                {renderLineChart()}
              </div>
            </div>

            {/* Category Performance Bar chart */}
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md space-y-4">
              <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">Cognitive Category Strengths</h3>
              <div className="grid grid-cols-2 gap-3">
                {categoryMetrics.map((met, idx) => {
                  const maxMetValue = 600; // max reference boundary
                  const fillPercent = Math.min(100, (met.score / maxMetValue) * 100);

                  return (
                    <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{met.name}</p>
                      <p className="text-lg font-extrabold text-cyan-300 font-mono leading-none my-1">{met.score} <span className="text-[10px] font-medium text-gray-400">pts</span></p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500" 
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md space-y-5">
            <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">{getTranslation(lang, 'settings')}</h3>

            {/* Mute toggle */}
            <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Sound Effects</p>
                <p className="text-[10px] text-gray-400">Toggle audio synthesizers on button triggers</p>
              </div>
              <button
                onClick={() => {
                  toggleSound();
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  hasMuted 
                    ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}
              >
                {hasMuted ? getTranslation(lang, 'muteSound') : getTranslation(lang, 'unmuteSound')}
              </button>
            </div>

            {/* Difficulty selectors */}
            <div className="space-y-2 p-3.5 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">{getTranslation(lang, 'difficulty')}</p>
                <p className="text-[10px] text-gray-400">Adapts gameplay grid limits and equation boundaries</p>
              </div>
              <div className="flex gap-2 mt-2">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      audio.playTap();
                      setDifficulty(d);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      difficulty === d
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/15'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {d === 'Easy' ? getTranslation(lang, 'easy') : d === 'Medium' ? getTranslation(lang, 'medium') : getTranslation(lang, 'hard')}
                  </button>
                ))}
              </div>
            </div>

            {/* Language toggle selector */}
            <div className="space-y-2 p-3.5 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-white">{getTranslation(lang, 'language')}</p>
                  <p className="text-[10px] text-gray-400">Swap global translation keys instantly</p>
                </div>
                <Languages className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="flex gap-2 mt-2">
                {(['en', 'es', 'fr'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      audio.playTap();
                      setLang(l);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      lang === l 
                        ? 'bg-purple-600 text-purple-100 border-purple-500 shadow-md shadow-purple-500/15' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {l === 'en' ? 'English' : l === 'es' ? 'Español' : 'Français'}
                  </button>
                ))}
              </div>
            </div>

            {/* App credit footer */}
            <div className="pt-2 flex justify-between items-center text-gray-500 text-[10px]">
              <span className="font-mono">V1.4.0 (Offline Enabled)</span>
              <button 
                onClick={() => {
                  audio.playFailure();
                  onLogout();
                }}
                className="text-red-400 hover:underline cursor-pointer font-bold"
              >
                Log Out account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
