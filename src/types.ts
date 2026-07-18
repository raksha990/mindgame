export type GameCategory =
  | 'Memory Match'
  | 'Number Puzzle'
  | 'Sudoku'
  | 'Word Search'
  | 'IQ Quiz'
  | 'Pattern Recognition'
  | 'Math Challenge'
  | 'Color & Shape Memory'
  | 'Reaction Speed Test'
  | 'Logic Puzzles';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Game {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  icon: string;
  difficulty: Difficulty;
  isUnlocked: boolean;
  coinCost: number;
  highScore: number;
  popularity: number; // 1-100 rating
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isGuest: boolean;
  coins: number;
  xp: number;
  streak: number;
  lastLoginDate?: string;
  gamesPlayed: number;
  badges: string[]; // List of badge IDs
  scoresHistory: {
    [gameId: string]: { date: string; score: number; accuracy: number }[];
  };
  unlockedGames: string[]; // List of game IDs
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  score: number;
  avatar: string;
  rank: number;
  isCurrentUser?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface DailyChallenge {
  id: string;
  gameId: string;
  title: string;
  rewardCoins: number;
  targetScore: number;
  completed: boolean;
}

export interface AppAnnouncement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  sender: string;
}

export interface AppAnalytics {
  totalUsers: number;
  avgBrainScore: number;
  activeToday: number;
  totalCoinsDistributed: number;
  gamePlays: { [category: string]: number };
}
