import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Difficulty, Score, Player, GameMode, LeaderboardEntry } from './types';
import { MOTIVATIONAL_QUOTES } from './constants';
import useLocalStorage from './hooks/useLocalStorage';

import WelcomeScreen from './components/WelcomeScreen';
import GameSetupScreen from './components/GameSetupScreen';
import GameScreen from './components/GameScreen';
import FinishedScreen from './components/FinishedScreen';
import Header from './components/Header';
import MotivationalQuote from './components/MotivationalQuote';
import LeaderboardScreen from './components/LeaderboardScreen';

type PlayerProfiles = Record<string, { profilePicture: string }>;
type DailyCompletions = Record<string, string>; // PlayerName: YYYY-MM-DD

const sortScores = (scores: Score[]): Score[] => {
  return [...scores].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return (a.duration ?? Infinity) - (b.duration ?? Infinity);
  });
};


export default function App() {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [displayedGameState, setDisplayedGameState] = useState<GameState>('welcome');
  const [isExiting, setIsExiting] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [scores, setScores] = useLocalStorage<Score[]>('quran-game-scores', []);
  const [playerProfiles, setPlayerProfiles] = useLocalStorage<PlayerProfiles>('quran-game-profiles', {});
  const [dailyCompletions, setDailyCompletions] = useLocalStorage<DailyCompletions>('quran-game-daily-completions', {});
  const [isMuted, setIsMuted] = useLocalStorage<boolean>('quran-game-muted', false);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  const [gameConfig, setGameConfig] = useState<{ juz: number[], difficulty: Difficulty, numberOfQuestions: number, gameMode: GameMode } | null>(null);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [leaderboardView, setLeaderboardView] = useState<'global' | 'daily'>('global');

  const globalLeaderboard = useMemo((): LeaderboardEntry[] => {
    const playerTotals: { [name: string]: number } = {};
    scores.forEach(score => {
        playerTotals[score.name] = (playerTotals[score.name] || 0) + score.score;
    });

    return Object.entries(playerTotals)
        .map(([name, totalScore]) => ({ name, totalScore }))
        .sort((a, b) => b.totalScore - a.totalScore);
  }, [scores]);

  const dailyLeaderboard = useMemo((): LeaderboardEntry[] => {
      const today = new Date().toISOString().split('T')[0];
      const dailyScores = scores
          .filter(score => score.gameMode === 'Tantangan Harian' && score.date.startsWith(today))
          .map(score => ({ name: score.name, totalScore: score.score }));
          
      return sortScores(dailyScores as any).map(s => ({name: s.name, totalScore: s.score}));
  }, [scores]);

  useEffect(() => {
    setMotivationalQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  useEffect(() => {
    if (gameState !== displayedGameState) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setDisplayedGameState(gameState);
        setIsExiting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState, displayedGameState]);

  const handleNameSubmit = useCallback((name: string) => {
    const profile = playerProfiles[name];
    setPlayer({ name, profilePicture: profile?.profilePicture });
    setGameState('setup');
  }, [playerProfiles]);

  const handleProfilePictureUpdate = useCallback((name: string, newPicture: string) => {
    setPlayerProfiles(prev => ({
        ...prev,
        [name]: { profilePicture: newPicture }
    }));
    setPlayer(prev => (prev && prev.name === name ? { ...prev, profilePicture: newPicture } : prev));
  }, [setPlayerProfiles]);

  const handleGameStart = useCallback((juz: number[], difficulty: Difficulty, numberOfQuestions: number, gameMode: GameMode) => {
    setGameConfig({ juz, difficulty, numberOfQuestions, gameMode });
    setCurrentScore(0);
    setGameStartTime(Date.now());
    setMotivationalQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    setGameState('playing');
  }, []);

  const handleGameEnd = useCallback((score: number) => {
    setCurrentScore(score);
    const duration = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;

    if (player && gameConfig) {
      const newScore: Score = {
        name: player.name,
        score,
        date: new Date().toISOString(),
        juz: gameConfig.juz,
        difficulty: gameConfig.difficulty,
        numberOfQuestions: gameConfig.numberOfQuestions,
        gameMode: gameConfig.gameMode,
        duration,
      };
      
      setScores(prevScores => sortScores([...prevScores, newScore]));

      if (gameConfig.gameMode === 'Tantangan Harian') {
        const todayStr = new Date().toISOString().split('T')[0];
        setDailyCompletions(prev => ({ ...prev, [player.name]: todayStr }));
      }
    }
    setGameState('finished');
  }, [player, gameConfig, setScores, gameStartTime, setDailyCompletions]);

  const handlePlayAgain = useCallback(() => {
    setGameConfig(null);
    setCurrentScore(0);
    setGameStartTime(null);
    setMotivationalQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    setGameState('setup');
  }, []);

  const handleShowLeaderboard = useCallback(() => {
    setGameState('leaderboard');
  }, []);

  const handleBackToWelcome = useCallback(() => {
    setGameState('welcome');
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
  }, [setIsMuted]);
  
  const renderContent = () => {
    switch (displayedGameState) {
      case 'welcome':
        return <WelcomeScreen onNameSubmit={handleNameSubmit} onShowLeaderboard={handleShowLeaderboard} isMuted={isMuted} />;
      case 'setup':
        return player && <GameSetupScreen player={player} onStartGame={handleGameStart} onBack={handleBackToWelcome} globalLeaderboard={globalLeaderboard} playerProfiles={playerProfiles} onProfilePictureUpdate={handleProfilePictureUpdate} dailyCompletions={dailyCompletions} isMuted={isMuted} />;
      case 'playing':
        return gameConfig && <GameScreen {...gameConfig} onGameEnd={handleGameEnd} motivationalQuote={motivationalQuote} isMuted={isMuted} />;
      case 'finished':
        return player && gameConfig && <FinishedScreen scores={scores} currentPlayerScore={currentScore} onPlayAgain={handlePlayAgain} playerName={player.name} globalLeaderboard={globalLeaderboard} dailyLeaderboard={dailyLeaderboard} gameMode={gameConfig.gameMode} isMuted={isMuted} />;
      case 'leaderboard':
        return <LeaderboardScreen globalLeaderboard={globalLeaderboard} dailyLeaderboard={dailyLeaderboard} onBack={handleBackToWelcome} currentPlayer={player} playerProfiles={playerProfiles} view={leaderboardView} setView={setLeaderboardView} isMuted={isMuted}/>;
      default:
        return <WelcomeScreen onNameSubmit={handleNameSubmit} onShowLeaderboard={handleShowLeaderboard} isMuted={isMuted} />;
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased">
      <Header isMuted={isMuted} onMuteToggle={handleMuteToggle} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col items-center">
        {gameState !== 'welcome' && gameState !== 'leaderboard' && gameState !== 'playing' && <MotivationalQuote quote={motivationalQuote} />}
        <div className={`w-full max-w-4xl mt-8 ${isExiting ? 'animate-fade-out' : ''}`}>
            {renderContent()}
        </div>
      </main>
    </div>
  );
}