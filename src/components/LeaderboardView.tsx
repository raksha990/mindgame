import { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Users, Globe, Search, Brain, ArrowUp } from 'lucide-react';
import { LeaderboardEntry, UserProfile } from '../types';
import { Language } from '../utils/translations';

interface LeaderboardViewProps {
  user: UserProfile;
  lang: Language;
}

const GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { uid: 'g1', displayName: 'CortexKing', score: 9850, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', rank: 1 },
  { uid: 'g2', displayName: 'SynapseWizard', score: 9420, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', rank: 2 },
  { uid: 'g3', displayName: 'NeuronNinja', score: 8900, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', rank: 3 },
  { uid: 'g4', displayName: 'BrainyGamer', score: 8150, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', rank: 4 },
  { uid: 'g5', displayName: 'LogicSlayer', score: 7600, avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=80&q=80', rank: 5 },
  { uid: 'g6', displayName: 'CerebralSage', score: 6900, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', rank: 6 },
  { uid: 'g7', displayName: 'Speedster00', score: 6200, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80', rank: 7 }
];

const FRIENDS_LEADERBOARD: LeaderboardEntry[] = [
  { uid: 'f1', displayName: 'Sophia (Bestie)', score: 6500, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80', rank: 1 },
  { uid: 'f2', displayName: 'Liam (Brother)', score: 5800, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80', rank: 2 },
  { uid: 'f3', displayName: 'Emma (Classmate)', score: 4900, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80', rank: 3 },
  { uid: 'f4', displayName: 'Noah (Logic Rival)', score: 3800, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=80&q=80', rank: 4 }
];

export default function LeaderboardView({ user, lang }: LeaderboardViewProps) {
  const [tab, setTab] = useState<'global' | 'friends'>('global');

  // Compute player scores: gather sums of all game highscores in user profiles
  const totalHighscore = Object.values(user.scoresHistory).reduce((sum, hList) => {
    if (hList.length === 0) return sum;
    const maxVal = Math.max(...hList.map(h => h.score));
    return sum + maxVal;
  }, 0);

  // Fallback to XP-based rating if highscores are empty
  const currentPlayerScore = Math.max(user.xp * 2, totalHighscore, 300);

  // Construct current player row
  const getCompetitors = (): LeaderboardEntry[] => {
    const list = tab === 'global' ? [...GLOBAL_LEADERBOARD] : [...FRIENDS_LEADERBOARD];
    
    // Inject player
    const playerRow: LeaderboardEntry = {
      uid: user.uid,
      displayName: user.displayName + ' (You)',
      score: currentPlayerScore,
      avatar: user.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
      rank: 1, // calculated below
      isCurrentUser: true
    };

    const combined = [...list, playerRow].sort((a, b) => b.score - a.score);
    
    // Recalculate ranks
    return combined.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));
  };

  const rankedList = getCompetitors();
  const playerRank = rankedList.find(r => r.isCurrentUser)?.rank || 1;

  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-yellow-400/25">
            <Medal className="w-4 h-4" />
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-slate-300/25">
            <Medal className="w-4 h-4" />
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/25">
            <Medal className="w-4 h-4" />
          </div>
        );
      default:
        return <span className="text-gray-400 text-xs font-semibold w-7 text-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Dynamic ranking teaser */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border border-white/10 p-5 rounded-[28px] flex justify-between items-center relative overflow-hidden shadow-xl shadow-indigo-950/40">
        <div className="space-y-1 z-10">
          <p className="text-[9px] text-cyan-200 uppercase tracking-widest font-black">Active Ranking</p>
          <h2 className="text-2xl font-black font-display text-white flex items-center gap-1.5 uppercase tracking-tight">
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
            Rank #{playerRank}
          </h2>
          <p className="text-[11px] text-white/80 font-medium">Competitive brain rating: {currentPlayerScore} PTS</p>
        </div>
        
        <div className="w-12 h-12 rounded-2xl bg-white text-[#0A0E21] flex flex-col justify-center items-center shrink-0 z-10 shadow-lg">
          <ArrowUp className="w-5 h-5 text-indigo-950 animate-bounce" />
          <span className="text-[9px] font-black text-indigo-950 uppercase leading-none">Up</span>
        </div>
        <div className="absolute -right-6 -bottom-6 text-[110px] leading-none font-black opacity-10 select-none text-white font-display pointer-events-none uppercase tracking-tighter">
          #1
        </div>
      </div>

      {/* Toggles */}
      <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl">
        <button
          onClick={() => setTab('global')}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            tab === 'global' 
              ? 'bg-white text-[#0A0E21] border-white shadow-xl shadow-cyan-500/5' 
              : 'bg-transparent border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Global Arena</span>
        </button>
        <button
          onClick={() => setTab('friends')}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            tab === 'friends' 
              ? 'bg-white text-[#0A0E21] border-white shadow-xl shadow-cyan-500/5' 
              : 'bg-transparent border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Friends List</span>
        </button>
      </div>

      {/* Leaderboard Competitors List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {rankedList.map((entry) => (
          <div
            key={entry.uid}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              entry.isCurrentUser
                ? 'bg-white/10 border-cyan-400 shadow-md shadow-cyan-500/5 scale-[1.01]'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Rank Medal */}
              {renderRankBadge(entry.rank)}

              {/* Avatar Photo */}
              <img
                src={entry.avatar}
                alt={entry.displayName}
                referrerPolicy="no-referrer"
                className={`w-9 h-9 rounded-xl object-cover border ${
                  entry.isCurrentUser ? 'border-cyan-400 shadow-md p-0.5' : 'border-white/10'
                }`}
              />

              {/* Identity */}
              <div>
                <p className={`text-xs font-black uppercase tracking-tight ${entry.isCurrentUser ? 'text-cyan-300 font-display' : 'text-white'}`}>
                  {entry.displayName}
                </p>
                <p className="text-[9px] text-gray-400 font-black tracking-wider uppercase flex items-center gap-0.5">
                  <Brain className="w-3 h-3 text-purple-400" />
                  Brain Rating
                </p>
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <span className={`text-sm font-black font-display tracking-tight ${entry.isCurrentUser ? 'text-cyan-300' : 'text-gray-100'}`}>
                {entry.score}
              </span>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider">pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
