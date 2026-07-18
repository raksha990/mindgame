import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Heart, Zap, Trophy, AlertCircle } from 'lucide-react';
import { audio } from '../../utils/audio';
import { getTranslation, Language } from '../../utils/translations';
import { Difficulty } from '../../types';

interface PatternRecognitionProps {
  difficulty: Difficulty;
  lang: Language;
  onGameComplete: (score: number, coins: number, xp: number, accuracy: number) => void;
  onBack: () => void;
}

export default function PatternRecognition({
  difficulty,
  lang,
  onGameComplete,
  onBack
}: PatternRecognitionProps) {
  const [gridSize, setGridSize] = useState(difficulty === 'Hard' ? 4 : 3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());

  const totalTiles = gridSize * gridSize;
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIdRef = useRef<number>(0);

  useEffect(() => {
    startNewGame();
    return () => {
      playbackIdRef.current += 1;
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, [difficulty]);

  const startNewGame = () => {
    playbackIdRef.current += 1;
    const currentPlaybackId = playbackIdRef.current;

    const size = difficulty === 'Hard' ? 4 : 3;
    setGridSize(size);
    setSequence([]);
    setUserSequence([]);
    setActiveTile(null);
    setRound(1);
    setLives(3);
    setScore(0);
    setGameOver(false);
    
    // Initial sequence length
    const initialLen = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 5;
    generateSequence(initialLen, size * size, currentPlaybackId);
  };

  const generateSequence = (length: number, total: number, currentPlaybackId: number) => {
    if (currentPlaybackId !== playbackIdRef.current) return;
    const newSeq: number[] = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * total));
    }
    setSequence(newSeq);
    setUserSequence([]);
    playSequence(newSeq, currentPlaybackId);
  };

  const playSequence = async (seq: number[], currentPlaybackId: number) => {
    if (currentPlaybackId !== playbackIdRef.current) return;
    setIsPlayingSequence(true);
    const speed = difficulty === 'Easy' ? 800 : difficulty === 'Medium' ? 600 : 450;
    
    for (let i = 0; i < seq.length; i++) {
      if (currentPlaybackId !== playbackIdRef.current) return;
      await new Promise<void>(resolve => {
        sequenceTimerRef.current = setTimeout(() => {
          if (currentPlaybackId !== playbackIdRef.current) {
            resolve();
            return;
          }
          setActiveTile(seq[i]);
          playTileSound(seq[i]);
          
          // Hold the tile light up
          sequenceTimerRef.current = setTimeout(() => {
            if (currentPlaybackId !== playbackIdRef.current) {
              resolve();
              return;
            }
            setActiveTile(null);
            resolve();
          }, speed - 150);
        }, 150);
      });
    }
    
    if (currentPlaybackId === playbackIdRef.current) {
      setIsPlayingSequence(false);
    }
  };

  const playTileSound = (tileIndex: number) => {
    if (hasMuted) return;
    // Scale tone pitch based on tile index
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const baseFreq = 261.63; // C4
      const freq = baseFreq + (tileIndex * 35);
      
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio Fallback
    }
  };

  const handleTileClick = (tileIdx: number) => {
    if (isPlayingSequence || gameOver) return;

    const currentPlaybackId = playbackIdRef.current;

    // Highlight clicked tile briefly
    setActiveTile(tileIdx);
    playTileSound(tileIdx);
    setTimeout(() => {
      if (playbackIdRef.current === currentPlaybackId) {
        setActiveTile(prev => prev === tileIdx ? null : prev);
      }
    }, 150);

    const newUserSeq = [...userSequence, tileIdx];
    setUserSequence(newUserSeq);

    // Check match correctness
    const currentStep = newUserSeq.length - 1;
    if (newUserSeq[currentStep] !== sequence[currentStep]) {
      // Mistake!
      audio.playFailure();
      const remainingLives = lives - 1;
      setLives(remainingLives);
      setUserSequence([]);

      if (remainingLives <= 0) {
        handleGameOver();
      } else {
        // Replay sequence for helper
        setTimeout(() => {
          if (playbackIdRef.current === currentPlaybackId) {
            playSequence(sequence, currentPlaybackId);
          }
        }, 1000);
      }
      return;
    }

    // Sequence completed correctly?
    if (newUserSeq.length === sequence.length) {
      audio.playMatch();
      setScore(prev => prev + (round * 50));
      
      // Go to next round
      setRound(prev => {
        const nextRound = prev + 1;
        // Add one more step to the sequence
        setTimeout(() => {
          if (playbackIdRef.current === currentPlaybackId) {
            const nextSeq = [...sequence, Math.floor(Math.random() * totalTiles)];
            setSequence(nextSeq);
            setUserSequence([]);
            playSequence(nextSeq, currentPlaybackId);
          }
        }, 1000);
        return nextRound;
      });
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    audio.playLevelUp();

    const coins = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 22 : 45;
    const xp = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 80 : 160;
    
    // Accuracy based on rounds cleared vs lives remaining
    const accuracy = Math.max(20, Math.min(100, (round * 10) + (lives * 15)));

    onGameComplete(score, coins, xp, accuracy);
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
          <ArrowLeft className="w-5 h-5 text-indigo-300" />
        </button>
        <span className="font-display font-bold text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
          {getTranslation(lang, 'patternRecognitionTitle')}
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

      {/* Stats and Lives */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Score</p>
          <p className="font-bold text-indigo-300 text-sm md:text-base">{score}</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sequence</p>
          <p className="font-bold text-purple-300 text-sm md:text-base">{sequence.length} steps</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2 text-center flex flex-col justify-center items-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Lives</p>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Heart 
                key={idx}
                className={`w-4 h-4 ${idx < lives ? 'text-rose-500 fill-rose-500' : 'text-white/20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status Instruction */}
      <div className="text-center mb-4">
        <p className={`text-xs font-semibold ${isPlayingSequence ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
          {isPlayingSequence ? 'Pay Attention to the Pattern!' : 'Your Turn: Repeat the Pattern!'}
        </p>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 flex items-center justify-center min-h-[280px]">
        {!gameOver ? (
          <div 
            className={`grid gap-3 w-full max-w-[320px] aspect-square ${
              gridSize === 4 ? 'grid-cols-4' : 'grid-cols-3'
            }`}
          >
            {Array.from({ length: totalTiles }).map((_, idx) => {
              const isActive = activeTile === idx;
              
              return (
                <button
                  key={idx}
                  disabled={isPlayingSequence || gameOver}
                  onClick={() => handleTileClick(idx)}
                  className={`aspect-square rounded-2xl border transition-all duration-100 ${
                    isActive 
                      ? 'bg-purple-400 border-purple-300 shadow-lg shadow-purple-500/50 scale-95' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-95'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 w-full shadow-2xl animate-fade-in"
          >
            <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-purple-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-purple-300 mb-2">{getTranslation(lang, 'gameOver')}</h2>
            <div className="space-y-2 mb-6">
              <p className="text-gray-300 text-sm">You reached Round <strong className="text-indigo-300">{round}</strong> with a length of {sequence.length} steps!</p>
              <p className="text-sm font-semibold text-purple-300">{getTranslation(lang, 'coinsEarned', { coins: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 22 : 45 })}</p>
              <p className="text-sm font-semibold text-cyan-300">{getTranslation(lang, 'xpEarned', { xp: difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 80 : 160 })}</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={startNewGame}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 font-bold shadow-lg shadow-indigo-500/20 transition-all"
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
        <AlertCircle className="w-4 h-4 text-purple-300 shrink-0" />
        <p className="text-[10px] text-gray-400">
          This game exercises your sequential and spatial working memory capacity. Recalling 7+ steps matches the standard peak adult capacity limits!
        </p>
      </div>
    </div>
  );
}
