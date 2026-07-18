import { motion } from 'motion/react';
import { Trophy, Star, Sparkles, Brain, Award, ShieldAlert, Zap, Flame, Compass } from 'lucide-react';
import { Badge, UserProfile } from '../types';
import { getTranslation, Language } from '../utils/translations';

interface AchievementsViewProps {
  user: UserProfile;
  lang: Language;
}

const BADGES_LIST: Badge[] = [
  {
    id: 'first_game',
    name: 'First Synapse',
    description: 'Play your very first mind training game round',
    icon: 'Brain'
  },
  {
    id: 'math_genius',
    name: 'Cortex Calculator',
    description: 'Answer 5+ consecutive Math Challenge questions correct',
    icon: 'Award'
  },
  {
    id: 'speed_demon',
    name: 'Reflex Master',
    description: 'Register a Reaction Speed Test of under 220ms',
    icon: 'Zap'
  },
  {
    id: 'streak_starter',
    name: 'Daily Devotee',
    description: 'Secure a consecutive daily login streak of 3+ days',
    icon: 'Flame'
  },
  {
    id: 'coin_collector',
    name: 'Coin Barong',
    description: 'Amass 500+ golden coins in your local balance',
    icon: 'Sparkles'
  },
  {
    id: 'memory_wizard',
    name: 'Mnemonist',
    description: 'Complete Memory Match with over 80% pairing accuracy',
    icon: 'Compass'
  },
  {
    id: 'grandmaster',
    name: 'Cognitive Sage',
    description: 'Unlock and play every game category in the Mind Master ecosystem',
    icon: 'Trophy'
  }
];

const ICON_MAP: { [k: string]: any } = {
  Brain, Award, Zap, Flame, Sparkles, Compass, Trophy
};

export default function AchievementsView({ user, lang }: AchievementsViewProps) {
  // Utility to check if a badge is earned in simulated state
  const isBadgeEarned = (badgeId: string) => {
    // Dynamic checks
    if (badgeId === 'first_game') return user.gamesPlayed > 0;
    if (badgeId === 'streak_starter') return user.streak >= 3;
    if (badgeId === 'coin_collector') return user.coins >= 500;
    
    // Fallback check on profile lists
    return user.badges.includes(badgeId);
  };

  const unlockedCount = BADGES_LIST.filter(b => isBadgeEarned(b.id)).length;

  return (
    <div className="space-y-6">
      {/* Achievements Banner summary card */}
      <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-white/5 pointer-events-none">
          <Trophy className="w-40 h-40" />
        </div>

        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Your Achievements</h2>
            <p className="text-xs text-gray-400">
              Unlocked <strong className="text-yellow-400">{unlockedCount}</strong> of {BADGES_LIST.length} milestones
            </p>
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-400">Completion Percentage</span>
            <span className="text-cyan-300">{Math.round((unlockedCount / BADGES_LIST.length) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / BADGES_LIST.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BADGES_LIST.map((badge) => {
          const unlocked = isBadgeEarned(badge.id);
          const IconComponent = ICON_MAP[badge.icon] || Star;

          return (
            <motion.div 
              key={badge.id}
              whileHover={{ scale: unlocked ? 1.01 : 1 }}
              className={`border rounded-2xl p-4 flex items-center gap-4 transition-all ${
                unlocked 
                  ? 'bg-gradient-to-r from-white/5 to-white/0 border-yellow-500/35 shadow-md shadow-yellow-500/5' 
                  : 'bg-white/5 opacity-50 border-white/5'
              }`}
            >
              {/* Badge Icon Emblem */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                unlocked 
                  ? 'bg-gradient-to-tr from-yellow-500/25 to-amber-500/25 border-yellow-500/50 text-yellow-400 shadow-inner' 
                  : 'bg-white/5 border-white/10 text-gray-500'
              }`}>
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Badge info */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold ${unlocked ? 'text-white font-display' : 'text-gray-400'}`}>
                    {badge.name}
                  </h4>
                  {unlocked && (
                    <span className="text-[9px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      Earned
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  {badge.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
