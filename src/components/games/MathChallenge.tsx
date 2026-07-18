import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles, 
  Check, X, Trophy, AlertCircle, Cpu
} from 'lucide-react';
import { audio } from '../../utils/audio';
import { getTranslation, Language } from '../../utils/translations';
import { Difficulty, UserProfile } from '../../types';

interface MathChallengeProps {
  difficulty: Difficulty;
  lang: Language;
  onGameComplete: (score: number, coins: number, xp: number, accuracy: number) => void;
  onBack: () => void;
  user: UserProfile;
}

interface Question {
  equation: string;
  correctAnswer: number;
  options: number[];
}

export default function MathChallenge({
  difficulty,
  lang,
  onGameComplete,
  onBack,
  user
}: MathChallengeProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [gameOver, setGameOver] = useState(false);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());
  const [answeredState, setAnsweredState] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Performance-based Adaptive AI level (scales from 1 to 10)
  const [aiLevel, setAiLevel] = useState(
    difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 4 : 7
  );
  const [correctStreak, setCorrectStreak] = useState(0);
  const [aiAlert, setAiAlert] = useState<string | null>(null);
  
  const playbackIdRef = useRef<number>(0);
  const nextQuestionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiAlertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef<boolean>(false);

  // Start new game on difficulty change
  useEffect(() => {
    startNewGame();
    return () => {
      playbackIdRef.current += 1;
      if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
      if (aiAlertTimerRef.current) clearTimeout(aiAlertTimerRef.current);
    };
  }, [difficulty]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      playbackIdRef.current += 1;
      if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
      if (aiAlertTimerRef.current) clearTimeout(aiAlertTimerRef.current);
    };
  }, []);

  // Main game timer countdown
  useEffect(() => {
    if (gameOver || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameOver, timeRemaining]);

  // Handle Game Over complete side-effect outside the render/state-update phase
  useEffect(() => {
    if (gameOver && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      audio.playLevelUp();

      // Final accuracy and score rewards
      const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
      const finalScore = score + (correctAnswers * 10);
      const coins = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 25 : 50;
      const xp = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 90 : 180;

      onGameComplete(finalScore, coins, xp, accuracy);
    }
  }, [gameOver, totalAnswered, correctAnswers, score, difficulty, onGameComplete]);

  const startNewGame = () => {
    playbackIdRef.current += 1;
    const currentPlaybackId = playbackIdRef.current;
    hasCompletedRef.current = false;

    // Clear any pending timers
    if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
    if (aiAlertTimerRef.current) clearTimeout(aiAlertTimerRef.current);

    setScore(0);
    setQuestionCount(0);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setTimeRemaining(45);
    setGameOver(false);
    setAnsweredState(null);
    setSelectedAnswer(null);
    setCorrectStreak(0);
    setAiAlert(null);
    
    const initialLevel = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 4 : 7;
    setAiLevel(initialLevel);
    generateNextQuestion(initialLevel, currentPlaybackId);
  };

  const generateNextQuestion = (level: number, currentPlaybackId: number) => {
    if (currentPlaybackId !== playbackIdRef.current) return;
    setAnsweredState(null);
    setSelectedAnswer(null);

    let num1 = 0;
    let num2 = 0;
    let op = '+';
    let equation = '';
    let correctAnswer = 0;

    // AI Math Parameters based on level (1 - 10)
    if (level <= 2) {
      // Simple Add/Sub
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      op = Math.random() > 0.5 ? '+' : '-';
      if (op === '-' && num1 < num2) {
        // No negative outcomes for easy levels
        const temp = num1;
        num1 = num2;
        num2 = temp;
      }
      correctAnswer = op === '+' ? num1 + num2 : num1 - num2;
      equation = `${num1} ${op} ${num2}`;
    } else if (level <= 4) {
      // Double Digits Add/Sub
      num1 = Math.floor(Math.random() * 40) + 10;
      num2 = Math.floor(Math.random() * 30) + 10;
      op = Math.random() > 0.55 ? '+' : '-';
      if (op === '-' && num1 < num2) {
        const temp = num1;
        num1 = num2;
        num2 = temp;
      }
      correctAnswer = op === '+' ? num1 + num2 : num1 - num2;
      equation = `${num1} ${op} ${num2}`;
    } else if (level <= 6) {
      // Basic Multiplication & division
      const ops = ['+', '-', '*'];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === '*') {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 10) + 2;
        correctAnswer = num1 * num2;
        equation = `${num1} × ${num2}`;
      } else {
        num1 = Math.floor(Math.random() * 100) + 20;
        num2 = Math.floor(Math.random() * 80) + 10;
        if (op === '-' && num1 < num2) {
          const temp = num1;
          num1 = num2;
          num2 = temp;
        }
        correctAnswer = op === '+' ? num1 + num2 : num1 - num2;
        equation = `${num1} ${op} ${num2}`;
      }
    } else if (level <= 8) {
      // Harder Multiplication and Divisions
      const ops = ['+', '-', '*', '/'];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === '*') {
        num1 = Math.floor(Math.random() * 20) + 5;
        num2 = Math.floor(Math.random() * 12) + 3;
        correctAnswer = num1 * num2;
        equation = `${num1} × ${num2}`;
      } else if (op === '/') {
        num2 = Math.floor(Math.random() * 10) + 2;
        correctAnswer = Math.floor(Math.random() * 12) + 2;
        num1 = num2 * correctAnswer; // guarantees whole division
        equation = `${num1} ÷ ${num2}`;
      } else {
        num1 = Math.floor(Math.random() * 300) + 50;
        num2 = Math.floor(Math.random() * 250) + 30;
        if (op === '-' && num1 < num2) {
          const temp = num1;
          num1 = num2;
          num2 = temp;
        }
        correctAnswer = op === '+' ? num1 + num2 : num1 - num2;
        equation = `${num1} ${op} ${num2}`;
      }
    } else {
      // Level 9-10 (Brutal arithmetic / triple ops!)
      const useTriple = Math.random() > 0.4;
      if (useTriple) {
        num1 = Math.floor(Math.random() * 15) + 2;
        num2 = Math.floor(Math.random() * 10) + 2;
        const num3 = Math.floor(Math.random() * 20) + 5;
        correctAnswer = (num1 * num2) + num3;
        equation = `(${num1} × ${num2}) + ${num3}`;
      } else {
        num1 = Math.floor(Math.random() * 35) + 10;
        num2 = Math.floor(Math.random() * 25) + 5;
        correctAnswer = num1 * num2;
        equation = `${num1} × ${num2}`;
      }
    }

    // Generate 4 plausible options with absolute protection against infinite loops
    const optionsSet = new Set<number>();
    optionsSet.add(correctAnswer);

    let attempts = 0;
    while (optionsSet.size < 4 && attempts < 100) {
      attempts++;
      const spread = Math.max(5, Math.ceil(Math.abs(correctAnswer) * 0.2));
      const drift = Math.floor(Math.random() * (spread * 2)) - spread;
      const option = correctAnswer + (drift === 0 ? (Math.random() > 0.5 ? 5 : -5) : drift);
      if (option !== correctAnswer && option >= 0) {
        optionsSet.add(option);
      }
    }

    // Fallback if we couldn't generate enough unique options under limits
    let fallbackOffset = 1;
    while (optionsSet.size < 4) {
      const fallbackOption = correctAnswer + fallbackOffset;
      if (fallbackOption >= 0) {
        optionsSet.add(fallbackOption);
      }
      fallbackOffset++;
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      equation,
      correctAnswer,
      options
    });
    setQuestionCount(prev => prev + 1);
  };

  const handleAnswerSelect = (option: number) => {
    if (answeredState !== null || gameOver) return;
    setSelectedAnswer(option);
    setTotalAnswered(prev => prev + 1);

    const currentPlaybackId = playbackIdRef.current;
    const isCorrect = option === currentQuestion?.correctAnswer;

    let nextLevel = aiLevel;

    if (isCorrect) {
      audio.playSuccess();
      setAnsweredState('correct');
      setScore(prev => prev + (aiLevel * 20));
      setCorrectAnswers(prev => prev + 1);
      
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);

      // AI difficulty scaling up
      if (newStreak >= 3 && aiLevel < 10) {
        nextLevel = aiLevel + 1;
        setAiLevel(nextLevel);
        triggerAiNotification(`AI: Elevating cognitive complexity (Level ${nextLevel}/10)`);
        setCorrectStreak(0);
      }
    } else {
      audio.playFailure();
      setAnsweredState('wrong');
      setCorrectStreak(0);

      // AI difficulty scaling down to maintain engagement (unless at Easy lower bounds)
      const minLevel = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 4 : 7;
      if (aiLevel > minLevel) {
        nextLevel = aiLevel - 1;
        setAiLevel(nextLevel);
        triggerAiNotification(`AI: Recalibrating challenge range (Level ${nextLevel}/10)`);
      }
    }

    // Wait and load next question safely
    if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
    nextQuestionTimerRef.current = setTimeout(() => {
      if (playbackIdRef.current === currentPlaybackId) {
        generateNextQuestion(nextLevel, currentPlaybackId);
      }
    }, 1200);
  };

  const triggerAiNotification = (msg: string) => {
    setAiAlert(msg);
    if (aiAlertTimerRef.current) clearTimeout(aiAlertTimerRef.current);
    aiAlertTimerRef.current = setTimeout(() => {
      setAiAlert(null);
    }, 2500);
  };

  const handleGameOver = () => {
    setGameOver(true);
  };

  const toggleSound = () => {
    const isMuted = audio.toggleMute();
    setHasMuted(isMuted);
  };

  return (
    <div className="flex flex-col h-full text-white max-w-lg mx-auto px-4 py-3">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-purple-300" />
        </button>
        <span className="font-display font-bold text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
          {getTranslation(lang, 'mathChallengeTitle')}
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
            <RotateCcw className="w-5 h-5 text-purple-300" />
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Score</p>
          <p className="font-bold text-cyan-300 text-sm md:text-base">{score}</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center flex flex-col justify-center items-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            AI Level
          </p>
          <p className="font-bold text-purple-300 text-sm md:text-base">{aiLevel}/10</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Time</p>
          <p className={`font-bold text-sm md:text-base ${timeRemaining <= 8 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {timeRemaining}s
          </p>
        </div>
      </div>

      {/* Dynamic AI Alert Notification Banner */}
      <AnimatePresence>
        {aiAlert && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="mb-3 bg-purple-500/20 border border-purple-500/40 rounded-xl px-3 py-2 flex items-center gap-2 justify-center text-xs text-purple-200"
          >
            <Cpu className="w-4 h-4 text-purple-300 animate-pulse" />
            <span className="font-semibold">{aiAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Interface */}
      <div className="flex-1 flex items-center justify-center min-h-[280px]">
        {!gameOver && currentQuestion ? (
          <div className="w-full space-y-6">
            {/* The Equation Bubble */}
            <motion.div 
              key={currentQuestion.equation}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl shadow-purple-500/5"
            >
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Solve</p>
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-cyan-100">
                {currentQuestion.equation}
              </h1>
            </motion.div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                
                let buttonStyle = 'bg-white/5 border-white/10 hover:bg-white/10';
                if (answeredState !== null) {
                  if (isCorrect) {
                    buttonStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
                  } else if (isSelected) {
                    buttonStyle = 'bg-red-500/20 border-red-500/50 text-red-300';
                  } else {
                    buttonStyle = 'bg-white/5 border-white/10 opacity-50';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    disabled={answeredState !== null}
                    onClick={() => handleAnswerSelect(option)}
                    whileTap={{ scale: 0.98 }}
                    className={`py-4 px-6 rounded-2xl border text-xl font-bold transition-all flex items-center justify-center gap-2 ${buttonStyle}`}
                  >
                    {answeredState !== null && isCorrect && <Check className="w-5 h-5 text-emerald-400" />}
                    {answeredState !== null && isSelected && !isCorrect && <X className="w-5 h-5 text-red-400" />}
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-purple-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-purple-300 mb-2">{getTranslation(lang, 'gameOver')}</h2>
            <div className="space-y-2 mb-6">
              <p className="text-gray-300 text-sm">You answered <strong className="text-emerald-300">{correctAnswers}</strong> equations correctly!</p>
              <p className="text-sm font-semibold text-purple-300">{getTranslation(lang, 'coinsEarned', { coins: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 25 : 50 })}</p>
              <p className="text-sm font-semibold text-cyan-300">{getTranslation(lang, 'xpEarned', { xp: difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 90 : 180 })}</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={startNewGame}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold shadow-lg shadow-purple-500/20 transition-all"
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
        <AlertCircle className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
        <p className="text-[11px] text-gray-400">
          {getTranslation(lang, 'quickTip')}
        </p>
      </div>
    </div>
  );
}
