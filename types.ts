export type Difficulty = 'Mudah' | 'Sedang' | 'Susah';
export type GameMode = 'Pilihan Ganda' | 'Tebak Surah' | 'Isi Ayat' | 'Tantangan Harian';

export type GameState = 'welcome' | 'setup' | 'playing' | 'finished' | 'leaderboard';

export interface Player {
  name: string;
  profilePicture?: string;
}

export interface Score {
  name: string;
  score: number;
  date: string;
  juz: number[];
  difficulty: Difficulty;
  numberOfQuestions: number;
  gameMode: GameMode;
  duration?: number; // Duration in seconds
}

export interface StoredScores {
  version: number;
  data: Score[];
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  reference: string;
}

export interface LeaderboardEntry {
  name: string;
  totalScore: number;
}