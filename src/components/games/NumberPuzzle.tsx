import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Sparkles, HelpCircle } from 'lucide-react';
import { audio } from '../../utils/audio';
import { getTranslation, Language } from '../../utils/translations';
import { Difficulty, UserProfile } from '../../types';

interface NumberPuzzleProps {
  difficulty: Difficulty;
  lang: Language;
  onGameComplete: (score: number, coins: number, xp: number, accuracy: number) => void;
  onBack: () => void;
  user: UserProfile;
  deductCoins: (amount: number) => boolean;
}

export default function NumberPuzzle({
  difficulty,
  lang,
  onGameComplete,
  onBack,
  user,
  deductCoins
}: NumberPuzzleProps) {
  const [size, setSize] = useState(difficulty === 'Hard' ? 4 : 3);
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyIndex, setEmptyIndex] = useState(8);
  const [moves, setMoves] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [hasMuted, setHasMuted] = useState(audio.getMuteState());

  useEffect(() => {
    initializeBoard();
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

  const initializeBoard = () => {
    const s = difficulty === 'Hard' ? 4 : 3;
    setSize(s);
    const count = s * s;
    
    // Solved state: 1 to count-1, followed by 0 (empty)
    const solved = Array.from({ length: count - 1 }, (_, i) => i + 1);
    solved.push(0);

    // Perform random valid slides backwards from solved to guarantee solvability!
    let currentTiles = [...solved];
    let emptyIdx = count - 1;
    const shuffleSteps = s === 4 ? 60 : 35;

    for (let step = 0; step < shuffleSteps; step++) {
      const validMoves: number[] = [];
      const row = Math.floor(emptyIdx / s);
      const col = emptyIdx % s;

      if (row > 0) validMoves.push(emptyIdx - s); // Up
      if (row < s - 1) validMoves.push(emptyIdx + s); // Down
      if (col > 0) validMoves.push(emptyIdx - 1); // Left
      if (col < s - 1) validMoves.push(emptyIdx + 1); // Right

      const chosenMoveIdx = validMoves[Math.floor(Math.random() * validMoves.length)];
      // Swap
      const temp = currentTiles[emptyIdx];
      currentTiles[emptyIdx] = currentTiles[chosenMoveIdx];
      currentTiles[chosenMoveIdx] = temp;
      emptyIdx = chosenMoveIdx;
    }

    setTiles(currentTiles);
    setEmptyIndex(emptyIdx);
    setMoves(0);
    setTimeRemaining(s === 4 ? 240 : 120);
    setGameStarted(true);
    setGameOver(false);
    setVictory(false);
  };

  const handleTileClick = (index: number) => {
    if (gameOver) return;

    // A tile can slide if it is adjacent to the empty spot
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                     (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      audio.playTap();
      const updatedTiles = [...tiles];
      
      // Swap empty and clicked tile
      updatedTiles[emptyIndex] = tiles[index];
      updatedTiles[index] = 0;

      setTiles(updatedTiles);
      setEmptyIndex(index);
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      // Check if solved
      if (checkVictory(updatedTiles)) {
        handleGameOver(true, nextMoves);
      }
    }
  };

  const checkVictory = (board: number[]) => {
    const count = size * size;
    for (let i = 0; i < count - 1; i++) {
      if (board[i] !== i + 1) return false;
    }
    return board[count - 1] === 0;
  };

  const handleGameOver = (isVictory: boolean, finalMoves = moves) => {
    setGameOver(true);
    setVictory(isVictory);
    if (isVictory) {
      audio.playLevelUp();
      const accuracy = Math.round((Math.max(1, 40 - finalMoves) / 40) * 100);
      const baseScore = difficulty === 'Easy' ? 200 : difficulty === 'Medium' ? 400 : 800;
      const score = Math.max(50, baseScore - (finalMoves * 4) + (timeRemaining * 3));
      const coins = difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 30 : 60;
      const xp = difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200;

      onGameComplete(score, coins, xp, accuracy);
    } else {
      audio.playFailure();
    }
  };

  const useAutoHint = () => {
    // Reveal target solved state briefly as a hint!
    if (deductCoins(10)) {
      audio.playTap();
      const count = size * size;
      const solvedBoard = Array.from({ length: count - 1 }, (_, i) => i + 1);
      solvedBoard.push(0);

      const oldTiles = [...tiles];
      setTiles(solvedBoard);

      setTimeout(() => {
        setTiles(oldTiles);
      }, 1500);
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
          <ArrowLeft className="w-5 h-5 text-indigo-300" />
        </button>
        <span className="font-display font-bold text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">
          {getTranslation(lang, 'numberPuzzleTitle')}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            {hasMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button 
            onClick={initializeBoard}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            <RotateCcw className="w-5 h-5 text-indigo-300" />
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{getTranslation(lang, 'difficulty')}</p>
          <p className="font-bold text-indigo-300 text-sm md:text-base">
            {difficulty === 'Easy' ? getTranslation(lang, 'easy') : difficulty === 'Medium' ? getTranslation(lang, 'medium') : getTranslation(lang, 'hard')}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Moves</p>
          <p className="font-bold text-emerald-400 text-sm md:text-base">{moves}</p>
        </div>
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Time</p>
          <p className={`font-bold text-sm md:text-base ${timeRemaining <= 20 ? 'text-red-400 animate-pulse' : 'text-purple-400'}`}>
            {timeRemaining}s
          </p>
        </div>
      </div>

      {/* Grid Sliding Board */}
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        {!gameOver ? (
          <div 
            className={`grid gap-2 bg-white/5 p-3 rounded-3xl border border-white/10 shadow-xl max-w-[340px] aspect-square w-full ${
              size === 4 ? 'grid-cols-4' : 'grid-cols-3'
            }`}
          >
            {tiles.map((val, idx) => {
              const isValEmpty = val === 0;

              return (
                <div 
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-xl font-bold font-display select-none transition-all cursor-pointer ${
                    isValEmpty 
                      ? 'bg-transparent border border-dashed border-white/10' 
                      : 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 hover:from-indigo-500/30 border border-white/15 shadow-md hover:border-cyan-400/50 active:scale-95'
                  }`}
                >
                  {!isValEmpty && (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100">
                      {val}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 w-full shadow-2xl">
            {victory ? (
              <>
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-emerald-300" />
                </div>
                <h2 className="text-2xl font-display font-bold text-emerald-300 mb-2">{getTranslation(lang, 'levelCompleted')}</h2>
                <div className="space-y-2 mb-6">
                  <p className="text-gray-300 text-sm">Solved in <strong className="text-cyan-300">{moves}</strong> steps!</p>
                  <p className="text-sm font-semibold text-purple-300">{getTranslation(lang, 'coinsEarned', { coins: difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 30 : 60 })}</p>
                  <p className="text-sm font-semibold text-cyan-300">{getTranslation(lang, 'xpEarned', { xp: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200 })}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-display font-bold text-red-400 mb-2">{getTranslation(lang, 'gameOver')}</h2>
                <p className="text-gray-300 text-sm mb-6">Time ran out before you could sort the numbers.</p>
              </>
            )}

            <div className="flex gap-4">
              <button 
                onClick={initializeBoard}
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
          </div>
        )}
      </div>

      {/* Hint Actions */}
      {!gameOver && (
        <div className="flex gap-4 mt-4">
          <button 
            onClick={useAutoHint}
            disabled={user.coins < 10}
            className="flex-1 py-3 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 font-semibold disabled:opacity-40 disabled:hover:bg-purple-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>Peep Solution State (10 coins)</span>
          </button>
        </div>
      )}
    </div>
  );
}
