import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, AlertTriangle, Zap, Trophy } from 'lucide-react';
import { audio } from '../../utils/audio';
import { getTranslation, Language } from '../../utils/translations';
import { Difficulty } from '../../types';

interface ReactionSpeedProps {
  difficulty: Difficulty;
  lang: Language;
  onGameComplete: (score: number, coins: number, xp: number, accuracy: number) => void;
  onBack: () => void;
}

type GameState = 'idle' | 'waiting' | 'clickable' | 'early' | 'result' | 'finished';

export default function ReactionSpeed({
  difficulty,
  lang,
  onGameComplete,
  onBack
}: ReactionSpeedProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [trials, setTrials] = useState<number[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());

  const maxTrials = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 5;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startTrial = () => {
    audio.playTap();
    setGameState('waiting');
    setReactionTime(null);

    // Random delay between 1.5s and 5s
    const randomDelay = Math.random() * 3500 + 1500;
    
    timerRef.current = setTimeout(() => {
      setGameState('clickable');
      startTimeRef.current = performance.now();
      // Optional sound beep on click prompt
      if (!audio.getMuteState()) {
        audio.playMatch();
      }
    }, randomDelay);
  };

  const handleScreenClick = () => {
    if (gameState === 'idle') {
      startTrial();
    } else if (gameState === 'waiting') {
      // Clicked too early!
      if (timerRef.current) clearTimeout(timerRef.current);
      audio.playFailure();
      setGameState('early');
    } else if (gameState === 'clickable') {
      const endTime = performance.now();
      const clickDuration = Math.round(endTime - startTimeRef.current);
      audio.playSuccess();
      setReactionTime(clickDuration);
      setTrials(prev => [...prev, clickDuration]);
      setGameState('result');
    } else if (gameState === 'early') {
      startTrial();
    } else if (gameState === 'result') {
      nextTrial();
    }
  };

  const nextTrial = () => {
    audio.playTap();
    if (currentTrial < maxTrials) {
      setCurrentTrial(prev => prev + 1);
      setGameState('idle');
    } else {
      handleGameOver();
    }
  };

  const handleGameOver = () => {
    setGameState('finished');
    audio.playLevelUp();

    const validTrials = trials.length > 0 ? trials : [1000];
    const avgSpeed = Math.round(validTrials.reduce((a, b) => a + b, 0) / validTrials.length);
    
    // Scoring logic (faster reaction = higher score)
    // 300ms is standard, sub-200ms is excellent!
    const baseDifficultyBonus = difficulty === 'Easy' ? 150 : difficulty === 'Medium' ? 300 : 500;
    const speedBonus = Math.max(0, 1000 - avgSpeed);
    const score = baseDifficultyBonus + speedBonus;
    
    const coins = difficulty === 'Easy' ? 12 : difficulty === 'Medium' ? 24 : 48;
    const xp = difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 85 : 170;
    const accuracy = trials.length === maxTrials ? 100 : Math.round((trials.length / maxTrials) * 100);

    onGameComplete(score, coins, xp, accuracy);
  };

  const resetGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTrials([]);
    setCurrentTrial(1);
    setGameState('idle');
    setReactionTime(null);
  };

  const toggleSound = () => {
    const isMuted = audio.toggleMute();
    setHasMuted(isMuted);
  };

  // Background color mapping depending on state
  const getBgStyle = () => {
    switch (gameState) {
      case 'waiting':
        return 'bg-rose-950/80 border-rose-500/30';
      case 'clickable':
        return 'bg-emerald-950/80 border-emerald-400/40 animate-pulse';
      case 'early':
        return 'bg-amber-950/80 border-amber-500/30';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="flex flex-col h-full text-white max-w-lg mx-auto px-4 py-3">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-300" />
        </button>
        <span className="font-display font-bold text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
          {getTranslation(lang, 'reactionSuccess', { speed: '' }).split(':')[0]}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            {hasMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button 
            onClick={resetGame}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            <RotateCcw className="w-5 h-5 text-cyan-300" />
          </button>
        </div>
      </div>

      {/* Trial Counter */}
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-xs text-gray-400">
          Trial <strong className="text-cyan-300">{currentTrial}</strong> of {maxTrials}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: maxTrials }).map((_, idx) => (
            <div 
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx < trials.length 
                  ? 'bg-emerald-400' 
                  : idx === currentTrial - 1 && gameState !== 'idle' 
                    ? 'bg-cyan-400 animate-pulse' 
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Click Pad */}
      <div className="flex-1 flex flex-col justify-center">
        {gameState !== 'finished' ? (
          <div 
            onClick={handleScreenClick}
            className={`w-full h-72 rounded-3xl border backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden group select-none shadow-xl ${getBgStyle()}`}
          >
            {gameState === 'idle' && (
              <div className="text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-cyan-500/25 border border-cyan-500/40 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-8 h-8 text-cyan-300" />
                </div>
                <h3 className="text-xl font-bold font-display">Ready for Speed Trial?</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Click anywhere in the frame to begin. Tap as soon as the screen flashes emerald.
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startTrial();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Start
                </button>
              </div>
            )}

            {gameState === 'waiting' && (
              <div className="text-center">
                <p className="text-rose-300 font-semibold uppercase tracking-widest text-sm mb-1">
                  {getTranslation(lang, 'reactionWait')}
                </p>
                <p className="text-[10px] text-rose-400/70">Keep your focus locked...</p>
              </div>
            )}

            {gameState === 'clickable' && (
              <div className="text-center scale-110 transition-all">
                <h1 className="text-4xl font-black tracking-widest text-emerald-300 font-display animate-bounce">
                  {getTranslation(lang, 'reactionTap')}
                </h1>
              </div>
            )}

            {gameState === 'early' && (
              <div className="text-center p-6 space-y-4">
                <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="text-lg font-bold text-amber-200">
                  {getTranslation(lang, 'reactionEarly')}
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startTrial();
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/40 text-xs font-bold transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {gameState === 'result' && (
              <div className="text-center p-6 space-y-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Reaction Latency</p>
                <h1 className="text-5xl font-black font-display text-emerald-300">
                  {reactionTime} <span className="text-lg font-medium">ms</span>
                </h1>
                <p className="text-xs text-emerald-400">
                  {reactionTime && reactionTime < 200 ? 'Sub-human limits! Excellent!' : reactionTime && reactionTime < 300 ? 'Awesome quick tap!' : 'Good effort! Try to stay alert.'}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    nextTrial();
                  }}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-xs font-bold transition-all"
                >
                  {currentTrial === maxTrials ? 'Check Full Summary' : 'Next Trial'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-teal-500/20 border border-teal-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-teal-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-teal-300 mb-2">Challenge Accomplished!</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Average Response Rate</p>
                <p className="text-4xl font-extrabold font-display text-white">
                  {trials.length > 0 ? Math.round(trials.reduce((a,b)=>a+b,0)/trials.length) : 0} <span className="text-sm font-medium text-gray-400">ms</span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <div className="bg-white/5 rounded-xl py-2 border border-white/5">
                  <p className="text-[10px] text-gray-400">Reward Coins</p>
                  <p className="font-bold text-purple-300">+{difficulty === 'Easy' ? 12 : difficulty === 'Medium' ? 24 : 48}</p>
                </div>
                <div className="bg-white/5 rounded-xl py-2 border border-white/5">
                  <p className="text-[10px] text-gray-400">XP Earned</p>
                  <p className="font-bold text-cyan-300">+{difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 85 : 170}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={resetGame}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-bold shadow-lg shadow-teal-500/20 transition-all"
              >
                {getTranslation(lang, 'playAgain')}
              </button>
              <button 
                onClick={onBack}
                className="flex-1 py-3 px-4 rounded-xl bg-white/15 hover:bg-white/20 border border-white/10 font-bold transition-all"
              >
                {getTranslation(lang, 'backToDashboard')}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-2xl">
        <p className="text-[10px] text-center text-gray-400">
          The average human reaction speed is around 250ms to 270ms. Train daily to push yours towards 150ms!
        </p>
      </div>
    </div>
  );
}
