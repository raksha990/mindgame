import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, 
  HelpCircle, Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import { audio } from '../../utils/audio';
import { getTranslation, Language } from '../../utils/translations';
import { Difficulty } from '../../types';

interface ColorShapeMemoryProps {
  difficulty: Difficulty;
  lang: Language;
  onGameComplete: (score: number, coins: number, xp: number, accuracy: number) => void;
  onBack: () => void;
}

interface VisualItem {
  shape: string; // 'circle' | 'square' | 'triangle' | 'star' | 'diamond'
  color: string;  // 'Red' | 'Blue' | 'Yellow' | 'Green' | 'Purple'
}

const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond'];
const COLORS = ['Red', 'Blue', 'Yellow', 'Green', 'Purple'];

// Color mapping to hex
const COLOR_MAP: { [k: string]: string } = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Yellow: '#eab308',
  Green: '#22c55e',
  Purple: '#a855f7'
};

export default function ColorShapeMemory({
  difficulty,
  lang,
  onGameComplete,
  onBack
}: ColorShapeMemoryProps) {
  const [target, setTarget] = useState<VisualItem | null>(null);
  const [options, setOptions] = useState<VisualItem[]>([]);
  const [phase, setPhase] = useState<'memorize' | 'delay' | 'guess' | 'result' | 'finished'>('memorize');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(6);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isCorrectGuess, setIsCorrectGuess] = useState<boolean | null>(null);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [difficulty]);

  const startNewGame = () => {
    setScore(0);
    setRound(1);
    setCorrectCount(0);
    setPhase('memorize');
    generateRound(1);
  };

  const generateRound = (currentRound: number) => {
    setSelectedIdx(null);
    setIsCorrectGuess(null);
    setPhase('memorize');

    // Limit pool based on difficulty
    const shapePoolCount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 5;
    const colorPoolCount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 5;

    const shapes = SHAPES.slice(0, shapePoolCount);
    const colors = COLORS.slice(0, colorPoolCount);

    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const targetItem = { shape: randomShape, color: randomColor };
    
    setTarget(targetItem);

    // Timing configurations
    const displayDuration = difficulty === 'Easy' ? 2200 : difficulty === 'Medium' ? 1600 : 1000;
    const delayDuration = difficulty === 'Easy' ? 600 : difficulty === 'Medium' ? 1000 : 1400;

    // Show target, then hide
    timerRef.current = setTimeout(() => {
      setPhase('delay');
      
      // Delay phase
      timerRef.current = setTimeout(() => {
        // Generate options (1 correct, 3 distractor)
        const optSet = new Set<string>();
        optSet.add(JSON.stringify(targetItem));

        while (optSet.size < 4) {
          const s = shapes[Math.floor(Math.random() * shapes.length)];
          const c = colors[Math.floor(Math.random() * colors.length)];
          optSet.add(JSON.stringify({ shape: s, color: c }));
        }

        const list = Array.from(optSet).map(str => JSON.parse(str) as VisualItem);
        // Shuffle options
        setOptions(list.sort(() => Math.random() - 0.5));
        setPhase('guess');
      }, delayDuration);

    }, displayDuration);
  };

  const handleOptionSelect = (idx: number, opt: VisualItem) => {
    if (phase !== 'guess') return;
    setSelectedIdx(idx);

    const isMatch = opt.shape === target?.shape && opt.color === target?.color;
    setIsCorrectGuess(isMatch);
    setPhase('result');

    if (isMatch) {
      audio.playSuccess();
      setCorrectCount(prev => prev + 1);
      const difficultyMultiplier = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 80 : 150;
      setScore(prev => prev + difficultyMultiplier);
    } else {
      audio.playFailure();
    }

    // Advance to next round
    timerRef.current = setTimeout(() => {
      if (round < maxRounds) {
        setRound(prev => prev + 1);
        generateRound(round + 1);
      } else {
        handleGameOver();
      }
    }, 1500);
  };

  const handleGameOver = () => {
    setPhase('finished');
    audio.playLevelUp();

    const coins = difficulty === 'Easy' ? 8 : difficulty === 'Medium' ? 20 : 40;
    const xp = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 75 : 150;
    const accuracy = Math.round((correctCount / maxRounds) * 100);

    onGameComplete(score, coins, xp, accuracy);
  };

  const toggleSound = () => {
    const isMuted = audio.toggleMute();
    setHasMuted(isMuted);
  };

  // Render vector shape
  const renderShapeIcon = (shape: string, colorHex: string, sizeClass = 'w-24 h-24') => {
    switch (shape) {
      case 'circle':
        return (
          <svg className={sizeClass} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill={colorHex} filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))" />
          </svg>
        );
      case 'square':
        return (
          <svg className={sizeClass} viewBox="0 0 100 100">
            <rect x="15" y="15" width="70" height="70" rx="10" fill={colorHex} filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))" />
          </svg>
        );
      case 'triangle':
        return (
          <svg className={sizeClass} viewBox="0 0 100 100">
            <polygon points="50,15 85,80 15,80" fill={colorHex} filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))" />
          </svg>
        );
      case 'star':
        return (
          <svg className={sizeClass} viewBox="0 0 100 100">
            <polygon points="50,10 63,38 93,38 69,56 78,86 50,68 22,86 31,56 7,38 37,38" fill={colorHex} filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))" />
          </svg>
        );
      case 'diamond':
        return (
          <svg className={sizeClass} viewBox="0 0 100 100">
            <polygon points="50,15 85,50 50,85 15,50" fill={colorHex} filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))" />
          </svg>
        );
      default:
        return null;
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
          <ArrowLeft className="w-5 h-5 text-indigo-300" />
        </button>
        <span className="font-display font-bold text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
          {getTranslation(lang, 'colorShapeMemoryTitle')}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            {hasMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button 
            onClick={startNewGame}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            <RotateCcw className="w-5 h-5 text-indigo-300" />
          </button>
        </div>
      </div>

      {/* Trial Counter */}
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-xs text-gray-400">
          Round <strong className="text-indigo-300">{round}</strong> of {maxRounds}
        </span>
        <span className="text-xs text-emerald-400 font-bold">Score: {score}</span>
      </div>

      {/* Primary Display Stage */}
      <div className="flex-1 flex flex-col justify-center">
        {phase !== 'finished' ? (
          <div className="w-full space-y-6">
            
            {/* Stage Box */}
            <div className="min-h-[220px] bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-xl">
              
              {/* Distractor background effects on HARD difficulty */}
              {difficulty === 'Hard' && phase === 'memorize' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse pointer-events-none" />
              )}

              <AnimatePresence mode="wait">
                {phase === 'memorize' && target && (
                  <motion.div 
                    key="memorize"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: difficulty === 'Hard' ? 10 : 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="text-center flex flex-col items-center"
                  >
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-4">
                      <Eye className="w-3.5 h-3.5 text-cyan-300" /> Memorize this combination
                    </p>
                    {renderShapeIcon(target.shape, COLOR_MAP[target.color])}
                    <p className="text-sm font-semibold mt-4 text-cyan-300 tracking-wider">
                      {target.color} {target.shape.toUpperCase()}
                    </p>
                  </motion.div>
                )}

                {phase === 'delay' && (
                  <motion.div 
                    key="delay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <EyeOff className="w-12 h-12 text-white/20 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-gray-400">Recall phase...</p>
                  </motion.div>
                )}

                {(phase === 'guess' || phase === 'result') && (
                  <motion.div 
                    key="guess"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <HelpCircle className="w-10 h-10 text-indigo-400/50 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-200">
                      Select the matching shape and color combination
                    </p>
                    {isCorrectGuess !== null && (
                      <p className={`text-xs font-bold mt-2 ${isCorrectGuess ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCorrectGuess ? 'Correct Match!' : 'Incorrect Combination'}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Answer Options list */}
            {phase === 'guess' && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(idx, opt)}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/40 transition-all shadow-md group"
                  >
                    {renderShapeIcon(opt.shape, COLOR_MAP[opt.color], 'w-12 h-12 group-hover:scale-105 transition-all')}
                    <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">
                      {opt.color} {opt.shape}
                    </p>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Locked screen during result reveal */}
            {phase === 'result' && (
              <div className="grid grid-cols-2 gap-3 opacity-60 pointer-events-none">
                {options.map((opt, idx) => {
                  const isSelected = selectedIdx === idx;
                  const isCorrect = opt.shape === target?.shape && opt.color === target?.color;
                  
                  let borderStyle = 'border-white/10';
                  if (isSelected && isCorrect) borderStyle = 'border-emerald-500/70 bg-emerald-500/10';
                  if (isSelected && !isCorrect) borderStyle = 'border-red-500/70 bg-red-500/10';
                  if (!isSelected && isCorrect) borderStyle = 'border-emerald-500/30';

                  return (
                    <div
                      key={idx}
                      className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${borderStyle}`}
                    >
                      {renderShapeIcon(opt.shape, COLOR_MAP[opt.color], 'w-12 h-12')}
                      <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">
                        {opt.color} {opt.shape}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-indigo-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-indigo-300 mb-2">Challenge Accomplished!</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Visual accuracy rate</p>
                <p className="text-4xl font-extrabold font-display text-white">
                  {Math.round((correctCount / maxRounds) * 100)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Matched {correctCount} of {maxRounds} combinations correctly</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <div className="bg-white/5 rounded-xl py-2 border border-white/5">
                  <p className="text-[10px] text-gray-400">Reward Coins</p>
                  <p className="font-bold text-purple-300">+{difficulty === 'Easy' ? 8 : difficulty === 'Medium' ? 20 : 40}</p>
                </div>
                <div className="bg-white/5 rounded-xl py-2 border border-white/5">
                  <p className="text-[10px] text-gray-400">XP Earned</p>
                  <p className="font-bold text-cyan-300">+{difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 75 : 150}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={startNewGame}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-bold shadow-lg shadow-blue-500/20 transition-all"
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

      <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-indigo-300 mt-0.5 shrink-0" />
        <p className="text-[10px] text-gray-400">
          This test triggers binding memory processes (forcing your brain to store two independent features: shape AND color, as a single unified memory representation).
        </p>
      </div>
    </div>
  );
}
