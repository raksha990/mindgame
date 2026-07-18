import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Brain, Flame, Heart, Star, Sparkles, Smile, 
  Trophy, Zap, Compass, Moon, Sun, Anchor,
  Volume2, VolumeX, HelpCircle, ArrowLeft, RotateCcw, AlertCircle
} from 'lucide-react';
import { audio } from '../../utils/audio';
import { getTranslation, Language } from '../../utils/translations';
import { Difficulty, UserProfile } from '../../types';

interface MemoryMatchProps {
  difficulty: Difficulty;
  lang: Language;
  onGameComplete: (score: number, coins: number, xp: number, accuracy: number) => void;
  onBack: () => void;
  user: UserProfile;
  deductCoins: (amount: number) => boolean;
}

interface Card {
  id: number;
  iconName: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICON_MAP: { [key: string]: any } = {
  Brain, Flame, Heart, Star, Sparkles, Smile, 
  Trophy, Zap, Compass, Moon, Sun, Anchor
};

const ICONS_LIST = [
  'Brain', 'Flame', 'Heart', 'Star', 'Sparkles', 'Smile', 
  'Trophy', 'Zap', 'Compass', 'Moon', 'Sun', 'Anchor'
];

export default function MemoryMatch({ 
  difficulty, 
  lang, 
  onGameComplete, 
  onBack,
  user,
  deductCoins
}: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());

  // Determine grid sizes and pair counts based on difficulty
  const getGridConfig = () => {
    switch (difficulty) {
      case 'Easy':
        return { cols: 'grid-cols-4', pairsCount: 6, timeLimit: 45 };
      case 'Medium':
        return { cols: 'grid-cols-4', pairsCount: 8, timeLimit: 60 };
      case 'Hard':
        return { cols: 'grid-cols-6', pairsCount: 12, timeLimit: 90 };
    }
  };

  const config = getGridConfig();

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && !gameOver && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleGameOver(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeRemaining]);

  const startNewGame = () => {
    const { pairsCount, timeLimit } = getGridConfig();
    const selectedIcons = ICONS_LIST.slice(0, pairsCount);
    const doubleIcons = [...selectedIcons, ...selectedIcons];
    
    // Shuffle
    const shuffled = doubleIcons
      .map((icon, idx) => ({ id: idx, iconName: icon, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setSelectedIds([]);
    setMoves(0);
    setMatchesCount(0);
    setTimeRemaining(timeLimit);
    setGameStarted(true);
    setGameOver(false);
    setVictory(false);
  };

  const handleCardClick = (id: number) => {
    if (gameOver || selectedIds.length >= 2) return;
    
    const cardIndex = cards.findIndex(c => c.id === id);
    if (cards[cardIndex].isFlipped || cards[cardIndex].isMatched) return;

    audio.playTap();

    const updatedCards = [...cards];
    updatedCards[cardIndex].isFlipped = true;
    setCards(updatedCards);

    const newSelected = [...selectedIds, id];
    setSelectedIds(newSelected);

    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId)!;
      const secondCard = cards.find(c => c.id === secondId)!;

      if (firstCard.iconName === secondCard.iconName) {
        // Match found!
        setTimeout(() => {
          audio.playMatch();
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true, isFlipped: true } 
              : c
          ));
          setMatchesCount(prev => {
            const nextMatches = prev + 1;
            if (nextMatches === config.pairsCount) {
              handleGameOver(true);
            }
            return nextMatches;
          });
          setSelectedIds([]);
        }, 300);
      } else {
        // No match, flip back
        setTimeout(() => {
          audio.playFailure();
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setSelectedIds([]);
        }, 1000);
      }
    }
  };

  const handleGameOver = (isVictory: boolean) => {
    setGameOver(true);
    setVictory(isVictory);
    
    if (isVictory) {
      audio.playLevelUp();
      const accuracy = Math.round((config.pairsCount / Math.max(moves, config.pairsCount)) * 100);
      // Calculate rewarding scores based on remaining time & difficulty multiplier
      const timeBonus = timeRemaining * 2;
      const baseDifficultyMultiplier = difficulty === 'Easy' ? 100 : difficulty === 'Medium' ? 250 : 500;
      const score = Math.max(10, baseDifficultyMultiplier + timeBonus - (moves * 5));
      const coins = difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 30 : 60;
      const xp = difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200;

      onGameComplete(score, coins, xp, accuracy);
    } else {
      audio.playFailure();
    }
  };

  const useHint = () => {
    // Deduct coins and flip one unmatched pair temporarily as a helper hint!
    const unmatched = cards.filter(c => !c.isMatched && !c.isFlipped);
    if (unmatched.length < 2) return;

    if (deductCoins(10)) {
      audio.playTap();
      // Find a matching pair among unmatched cards
      let pair: Card[] = [];
      for (const card of unmatched) {
        const match = unmatched.find(c => c.id !== card.id && c.iconName === card.iconName);
        if (match) {
          pair = [card, match];
          break;
        }
      }

      if (pair.length === 2) {
        // Temporarily flip them
        setCards(prev => prev.map(c => 
          c.id === pair[0].id || c.id === pair[1].id ? { ...c, isFlipped: true } : c
        ));

        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === pair[0].id || c.id === pair[1].id) && !c.isMatched 
              ? { ...c, isFlipped: false } 
              : c
          ));
        }, 1500);
      }
    }
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
          <ArrowLeft className="w-5 h-5 text-cyan-300" />
        </button>
        <span className="font-display font-bold text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          {getTranslation(lang, 'memoryMatchTitle')}
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
            <RotateCcw className="w-5 h-5 text-cyan-300" />
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{getTranslation(lang, 'difficulty')}</p>
          <p className="font-bold text-cyan-300 text-sm md:text-base">
            {difficulty === 'Easy' ? getTranslation(lang, 'easy') : difficulty === 'Medium' ? getTranslation(lang, 'medium') : getTranslation(lang, 'hard')}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Moves</p>
          <p className="font-bold text-emerald-400 text-sm md:text-base">{moves}</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Time</p>
          <p className={`font-bold text-sm md:text-base ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-purple-400'}`}>
            {timeRemaining}s
          </p>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        {!gameOver ? (
          <div className={`grid ${config.cols} gap-3 w-full h-full max-h-[420px]`}>
            {cards.map((card) => {
              const IconComp = ICON_MAP[card.iconName] || Brain;
              const isRevealed = card.isFlipped || card.isMatched;

              return (
                <div 
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className="aspect-square relative cursor-pointer group"
                >
                  <motion.div 
                    className="w-full h-full rounded-2xl absolute style-preserve-3d"
                    animate={{ rotateY: isRevealed ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Front Face (Flipped/Matched) */}
                    <div 
                      className={`absolute inset-0 w-full h-full rounded-2xl border flex items-center justify-center backface-hidden shadow-lg ${
                        card.isMatched 
                          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-emerald-500/10' 
                          : 'bg-cyan-500/20 border-cyan-500/50 shadow-cyan-500/10'
                      }`}
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      <IconComp className={`w-8 h-8 ${card.isMatched ? 'text-emerald-300' : 'text-cyan-300'}`} />
                    </div>

                    {/* Back Face (Unflipped) */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 flex items-center justify-center backface-hidden shadow-inner group-hover:scale-105 transition-all">
                      <HelpCircle className="w-8 h-8 text-white/30 group-hover:text-cyan-400/50 transition-all" />
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 w-full shadow-2xl"
          >
            {victory ? (
              <>
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-emerald-300" />
                </div>
                <h2 className="text-2xl font-display font-bold text-emerald-300 mb-2">{getTranslation(lang, 'levelCompleted')}</h2>
                <div className="space-y-2 mb-6">
                  <p className="text-gray-300 text-sm">{getTranslation(lang, 'congratulations')}</p>
                  <p className="text-sm font-semibold text-purple-300">{getTranslation(lang, 'coinsEarned', { coins: difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 30 : 60 })}</p>
                  <p className="text-sm font-semibold text-cyan-300">{getTranslation(lang, 'xpEarned', { xp: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200 })}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-display font-bold text-red-400 mb-2">{getTranslation(lang, 'gameOver')}</h2>
                <p className="text-gray-300 text-sm mb-6">Time ran out before you could match all the cognitive nodes.</p>
              </>
            )}

            <div className="flex gap-4">
              <button 
                onClick={startNewGame}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold shadow-lg shadow-cyan-500/20 transition-all"
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

      {/* Game Footer Help Actions */}
      {!gameOver && (
        <div className="flex gap-4 mt-4">
          <button 
            onClick={useHint}
            disabled={user.coins < 10}
            className="flex-1 py-3 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 font-semibold disabled:opacity-40 disabled:hover:bg-purple-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>{getTranslation(lang, 'getHint')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
