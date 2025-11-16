import React, { useState, useMemo } from 'react';
import { Player, Difficulty, GameMode, LeaderboardEntry } from '../types';
import { JUZ_COUNT, DIFFICULTIES, DEFAULT_AVATAR_SVG } from '../constants';
import ProfileHeader from './ProfileHeader';
import { useSound } from '../hooks/useSound';
import { BUTTON_CLICK_SOUND } from '../sounds';

type PlayerProfiles = Record<string, { profilePicture: string }>;
type DailyCompletions = Record<string, string>;

interface GameSetupScreenProps {
  player: Player;
  onStartGame: (juz: number[], difficulty: Difficulty, numberOfQuestions: number, gameMode: GameMode) => void;
  onBack: () => void;
  globalLeaderboard: LeaderboardEntry[];
  playerProfiles: PlayerProfiles;
  onProfilePictureUpdate: (name: string, newPicture: string) => void;
  dailyCompletions: DailyCompletions;
  isMuted: boolean;
}

const getDailyChallengeConfig = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    return {
        juz: [(dayOfYear % 30) + 1],
        difficulty: 'Sedang' as Difficulty,
        numberOfQuestions: 10,
    };
};

const GameSetupScreen: React.FC<GameSetupScreenProps> = ({ player, onStartGame, onBack, globalLeaderboard, playerProfiles, onProfilePictureUpdate, dailyCompletions, isMuted }) => {
  const [selectedJuz, setSelectedJuz] = useState<number[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('Pilihan Ganda');
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(false);
  
  const questionOptions = [5, 10, 30];
  const quickSelectOptions = [5, 10, 15, 20, 25, 30];
  const playClickSound = useSound(BUTTON_CLICK_SOUND, isMuted);

  const topPlayers = globalLeaderboard.slice(0, 5);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const hasCompletedDaily = dailyCompletions[player.name] === todayStr;

  const handleJuzToggle = (juz: number) => {
    playClickSound();
    setSelectedJuz(prev =>
      prev.includes(juz) ? prev.filter(j => j !== juz) : [...prev, juz]
    );
  };
  
  const handleQuickSelect = (count: number) => {
    playClickSound();
    const newSelection = Array.from({ length: count }, (_, i) => i + 1);
    setSelectedJuz(newSelection);
  };

  const handleClearSelection = () => {
    playClickSound();
    setSelectedJuz([]);
  };

  const handleStart = async () => {
    playClickSound();
    if ((selectedGameMode === 'Tantangan Harian' && !hasCompletedDaily) || (selectedJuz.length > 0 && selectedDifficulty && numberOfQuestions)) {
      setIsCheckingApiKey(true);
      try {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
        const config = selectedGameMode === 'Tantangan Harian' ? getDailyChallengeConfig() : { juz: selectedJuz.sort((a,b) => a-b), difficulty: selectedDifficulty!, numberOfQuestions: numberOfQuestions! };
        onStartGame(config.juz, config.difficulty, config.numberOfQuestions, selectedGameMode);
      } catch (error) {
        console.error("Error during API key selection:", error);
      } finally {
        setIsCheckingApiKey(false);
      }
    }
  };

  const handleModeSelect = (mode: GameMode) => {
    playClickSound();
    setSelectedGameMode(mode);
    if (mode === 'Tantangan Harian') {
        const { juz, difficulty, numberOfQuestions } = getDailyChallengeConfig();
        setSelectedJuz(juz);
        setSelectedDifficulty(difficulty);
        setNumberOfQuestions(numberOfQuestions);
    } else {
        setSelectedJuz([]);
        setSelectedDifficulty(null);
        setNumberOfQuestions(null);
    }
  }

  const handleDifficultySelect = (level: Difficulty) => {
    playClickSound();
    setSelectedDifficulty(level);
  }

  const handleNumQuestionsSelect = (num: number) => {
    playClickSound();
    setNumberOfQuestions(num);
  }

  const handleBackClick = () => {
    playClickSound();
    onBack();
  }
  
  const isDailyChallenge = selectedGameMode === 'Tantangan Harian';
  const isStartDisabled = (isDailyChallenge && hasCompletedDaily) || 
                          (!isDailyChallenge && (selectedJuz.length === 0 || !selectedDifficulty || !numberOfQuestions)) || 
                          isCheckingApiKey;

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full animate-fade-in">
      <div className="flex-1 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <ProfileHeader player={player} onProfilePictureUpdate={onProfilePictureUpdate} isMuted={isMuted} />
        
        <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">1. Pilih Jenis Permainan</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['Pilihan Ganda', 'Tebak Surah', 'Isi Ayat', 'Tantangan Harian'] as GameMode[]).map(mode => (
                <button
                    key={mode}
                    onClick={() => handleModeSelect(mode)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold border-2 transition-all duration-200 active:scale-95 text-center ${
                    selectedGameMode === mode
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-slate-100 border-slate-200 hover:border-teal-400'
                    }`}
                >
                    {mode}
                </button>
                ))}
            </div>
             {isDailyChallenge && (
                <div className="mt-3 p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-sm text-center">
                    Tantangan hari ini: {getDailyChallengeConfig().numberOfQuestions} soal {getDailyChallengeConfig().difficulty} dari Juz {getDailyChallengeConfig().juz[0]}.
                </div>
            )}
        </div>

        <fieldset disabled={isDailyChallenge} className="disabled:opacity-50 transition-opacity">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">2. Pilih Juz</h3>
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <span className="text-sm font-semibold mr-2 text-slate-600">Pilih Cepat:</span>
                {quickSelectOptions.map(num => (
                  <button
                    key={num}
                    onClick={() => handleQuickSelect(num)}
                    className="px-3 py-1 text-sm rounded-full bg-slate-200 text-slate-700 hover:bg-teal-100 hover:text-teal-800 transition-all transform active:scale-95"
                  >
                    {num} Juz
                  </button>
                ))}
                {selectedJuz.length > 0 && !isDailyChallenge && (
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-all transform active:scale-95"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                {Array.from({ length: JUZ_COUNT }, (_, i) => i + 1).map(juz => (
                  <button
                    key={juz}
                    onClick={() => handleJuzToggle(juz)}
                    className={`p-2 rounded-lg font-bold text-center border-2 transition-all duration-200 active:scale-95 ${
                      selectedJuz.includes(juz)
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-slate-100 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {juz}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">3. Pilih Tingkat Kesulitan</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {DIFFICULTIES.map(level => (
                  <button
                    key={level}
                    onClick={() => handleDifficultySelect(level)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold border-2 transition-all duration-200 active:scale-95 ${
                      selectedDifficulty === level
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-slate-100 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-3">4. Pilih Jumlah Soal</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {questionOptions.map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumQuestionsSelect(num)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold border-2 transition-all duration-200 active:scale-95 ${
                      numberOfQuestions === num
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-slate-100 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {num} Soal
                  </button>
                ))}
              </div>
            </div>
        </fieldset>
        
        <button
          onClick={handleStart}
          disabled={isStartDisabled}
          className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-transform transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isCheckingApiKey ? 'Memeriksa...' : (hasCompletedDaily && isDailyChallenge) ? 'Tantangan Harian Selesai' : 'Mulai Permainan'}
        </button>

        <button
          onClick={handleBackClick}
          className="w-full mt-3 bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 transition-colors transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          Ganti Nama
        </button>
      </div>

      <div className="w-full md:w-80 lg:w-96">
        <div className="bg-white p-6 rounded-xl shadow-lg h-full border border-slate-200">
          <h3 className="font-bold text-xl mb-4 text-center text-teal-600">Peringkat Teratas Global</h3>
          {topPlayers.length > 0 ? (
            <ol className="space-y-3">
              {topPlayers.map((entry, index) => (
                <li 
                  key={entry.name}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    entry.name === player.name ? 'bg-teal-100 border border-teal-200' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-bold text-slate-500 w-6 text-center">{index + 1}.</span>
                    <img src={playerProfiles[entry.name]?.profilePicture || DEFAULT_AVATAR_SVG} alt={entry.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">
                      {entry.name}
                      {entry.name === player.name && (
                        <span className="ml-2 text-xs font-bold text-white bg-teal-500 px-2 py-0.5 rounded-full">Anda</span>
                      )}
                    </span>
                  </div>
                  <span className="font-bold text-teal-500 flex-shrink-0">{entry.totalScore}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-center text-slate-500 pt-4">Belum ada skor tercatat. Jadilah yang pertama!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSetupScreen;
