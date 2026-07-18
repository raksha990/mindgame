import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, AlertCircle, HelpCircle, Check, X } from 'lucide-react';
import { audio } from '../../utils/audio';
import { getTranslation, Language } from '../../utils/translations';
import { Difficulty } from '../../types';

interface IQQuizProps {
  difficulty: Difficulty;
  lang: Language;
  onGameComplete: (score: number, coins: number, xp: number, accuracy: number) => void;
  onBack: () => void;
}

interface Riddle {
  id: number;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  category: 'logic' | 'pattern' | 'math' | 'spatial';
}

const RIDDLE_POOL: Riddle[] = [
  {
    id: 1,
    question: 'Complete the sequence: 2, 4, 8, 16, 32, ?',
    options: ['48', '64', '128', '96'],
    correctIdx: 1,
    explanation: 'Each term in the sequence is multiplied by 2 to yield the next term (32 × 2 = 64).',
    category: 'pattern'
  },
  {
    id: 2,
    question: 'A doctor gives you 3 pills and tells you to take one every half hour. How long will the pills last?',
    options: ['30 Minutes', '1 Hour', '1.5 Hours', '2 Hours'],
    correctIdx: 1,
    explanation: 'You take the first pill immediately (time 0), the second pill 30 minutes later, and the third pill at the 1-hour mark.',
    category: 'logic'
  },
  {
    id: 3,
    question: 'If all bloops are razzies and all razzies are fozzies, are all bloops definitely fozzies?',
    options: ['Yes', 'No', 'Only some', 'Cannot be determined'],
    correctIdx: 0,
    explanation: 'This is a transitive syllogism. Since Bloops is a subset of Razzies, and Razzies is a subset of Fozzies, Bloops is a subset of Fozzies.',
    category: 'logic'
  },
  {
    id: 4,
    question: 'Find the next term: O, T, T, F, F, S, S, E, N, ?',
    options: ['T', 'E', 'O', 'D'],
    correctIdx: 0,
    explanation: 'These are the first letters of numbers: One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten. Next is Ten ("T").',
    category: 'pattern'
  },
  {
    id: 5,
    question: 'Which word does NOT belong with the others? Inch, Mile, Centimeter, Liter, Yard',
    options: ['Mile', 'Liter', 'Centimeter', 'Yard'],
    correctIdx: 1,
    explanation: 'Liter measures volume, whereas all other options measure length.',
    category: 'logic'
  },
  {
    id: 6,
    question: 'If a clock strikes 6 times in 5 seconds, how many times will it strike in 10 seconds?',
    options: ['12', '11', '10', '13'],
    correctIdx: 1,
    explanation: 'There are 5 intervals between 6 strikes, so 1 interval = 1 second. In 10 seconds, there are 10 intervals, which means 11 strikes.',
    category: 'math'
  },
  {
    id: 7,
    question: 'Look at this series: 36, 34, 30, 28, 24, ... What number should come next?',
    options: ['20', '22', '23', '26'],
    correctIdx: 1,
    explanation: 'Alternating subtraction pattern: subtract 2, then subtract 4, then subtract 2, then subtract 4. (24 - 2 = 22).',
    category: 'pattern'
  },
  {
    id: 8,
    question: 'A feather and a rock are dropped simultaneously on the Moon (no atmosphere). Which hits the ground first?',
    options: ['The rock', 'The feather', 'Both hit at the same time', 'Depends on exact drop height'],
    correctIdx: 2,
    explanation: 'Without air resistance, gravity accelerates all objects at the exact same rate regardless of mass.',
    category: 'logic'
  }
];

export default function IQQuiz({
  difficulty,
  lang,
  onGameComplete,
  onBack
}: IQQuizProps) {
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!gameOver && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameOver, timeRemaining]);

  const startNewGame = () => {
    setSelectedIdx(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setCurrentIndex(0);
    setTimeRemaining(90);
    setGameOver(false);

    // Shuffle and pick 5 questions based on difficulty limit
    const shuffled = [...RIDDLE_POOL]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    setRiddles(shuffled);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);

    const isCorrect = idx === riddles[currentIndex].correctIdx;
    if (isCorrect) {
      audio.playSuccess();
      setCorrectCount(prev => prev + 1);
    } else {
      audio.playFailure();
    }

    // Go to next question or end
    setTimeout(() => {
      if (currentIndex < riddles.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedIdx(null);
        setIsAnswered(false);
      } else {
        handleGameOver();
      }
    }, 2500);
  };

  const handleGameOver = () => {
    setGameOver(true);
    audio.playLevelUp();

    const baseScore = difficulty === 'Easy' ? 100 : difficulty === 'Medium' ? 250 : 500;
    const score = baseScore * (correctCount / 5) + (timeRemaining * 3);
    const coins = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 40;
    const xp = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 80 : 160;
    const accuracy = Math.round((correctCount / 5) * 100);

    onGameComplete(Math.round(score), coins, xp, accuracy);
  };

  const toggleSound = () => {
    const isMuted = audio.toggleMute();
    setHasMuted(isMuted);
  };

  const currentRiddle = riddles[currentIndex];

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
        <span className="font-display font-bold text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-300">
          {getTranslation(lang, 'iqQuizTitle')}
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

      {/* Progress Board */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2.5 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Question</p>
          <p className="font-bold text-cyan-300 text-sm">
            {currentIndex + 1} / 5
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2.5 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Correct</p>
          <p className="font-bold text-emerald-400 text-sm">{correctCount} / 5</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2.5 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Time</p>
          <p className={`font-bold text-sm ${timeRemaining <= 15 ? 'text-red-400 animate-pulse' : 'text-purple-400'}`}>
            {timeRemaining}s
          </p>
        </div>
      </div>

      {/* Main Question Arena */}
      <div className="flex-1 flex flex-col justify-center">
        {!gameOver && currentRiddle ? (
          <div className="space-y-4">
            
            {/* Question Bubble */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden shadow-lg">
              <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold border border-indigo-500/25">
                Category: {currentRiddle.category.toUpperCase()}
              </span>
              <p className="text-base md:text-lg font-medium text-white font-sans mt-4 leading-relaxed">
                {currentRiddle.question}
              </p>
            </div>

            {/* Answer Options Grid */}
            <div className="space-y-2">
              {currentRiddle.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrect = idx === currentRiddle.correctIdx;

                let btnStyle = 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-100 hover:border-cyan-400/40';
                
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-500/20 border-red-500/50 text-red-300';
                  } else {
                    btnStyle = 'bg-white/5 border-white/10 opacity-40';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left py-3.5 px-5 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <X className="w-5 h-5 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation reveal */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3.5 bg-indigo-950/40 border border-indigo-500/35 rounded-2xl"
                >
                  <p className="text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Explanation
                  </p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {currentRiddle.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 w-full shadow-2xl animate-fade-in"
          >
            <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-indigo-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-indigo-300 mb-2">Quiz Finished!</h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Deductive reasoning rate</p>
                <p className="text-4xl font-extrabold font-display text-white">
                  {Math.round((correctCount / 5) * 100)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Cleared {correctCount} of 5 riddles correctly</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <div className="bg-white/5 rounded-xl py-2 border border-white/5">
                  <p className="text-[10px] text-gray-400">Reward Coins</p>
                  <p className="font-bold text-purple-300">+{difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 40}</p>
                </div>
                <div className="bg-white/5 rounded-xl py-2 border border-white/5">
                  <p className="text-[10px] text-gray-400">XP Earned</p>
                  <p className="font-bold text-cyan-300">+{difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 80 : 160}</p>
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

      <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-cyan-300 shrink-0" />
        <p className="text-[10px] text-gray-400">
          Logical and spatial tests activate lateral prefrontal cortex, enhancing cognitive deduction and fluid IQ levels.
        </p>
      </div>
    </div>
  );
}
