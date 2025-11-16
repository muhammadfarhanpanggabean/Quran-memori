import React from 'react';
import { Score, LeaderboardEntry, GameMode } from '../types';
import { useSound } from '../hooks/useSound';
import { BUTTON_CLICK_SOUND } from '../sounds';

interface FinishedScreenProps {
  scores: Score[];
  currentPlayerScore: number;
  onPlayAgain: () => void;
  playerName: string;
  globalLeaderboard: LeaderboardEntry[];
  dailyLeaderboard: LeaderboardEntry[];
  gameMode: GameMode;
  isMuted: boolean;
}

const formatDuration = (seconds: number | undefined | null): string => {
  if (seconds === undefined || seconds === null) {
    return '-';
  }
  if (seconds < 0) return '0d';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}d`;
  }
  return `${remainingSeconds}d`;
};

const FinishedScreen: React.FC<FinishedScreenProps> = ({ scores, currentPlayerScore, onPlayAgain, playerName, globalLeaderboard, dailyLeaderboard, gameMode, isMuted }) => {
  const playerHistory = scores.filter(score => score.name === playerName).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const playerGlobalRankData = globalLeaderboard.find(p => p.name === playerName);
  const globalRank = playerGlobalRankData ? globalLeaderboard.indexOf(playerGlobalRankData) + 1 : -1;
  const totalScore = playerGlobalRankData ? playerGlobalRankData.totalScore : currentPlayerScore;
  
  const playerDailyRankData = dailyLeaderboard.find(p => p.name === playerName);
  const dailyRank = playerDailyRankData ? dailyLeaderboard.indexOf(playerDailyRankData) + 1 : -1;

  const playClickSound = useSound(BUTTON_CLICK_SOUND, isMuted);

  const handlePlayAgainClick = () => {
    playClickSound();
    onPlayAgain();
  };


  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center w-full max-w-md border border-slate-200">
            <h2 className="text-3xl font-bold text-teal-500 mb-2">Permainan Selesai!</h2>
            <p className="text-slate-600 mb-2">Skor Sesi Ini:</p>
            <p className="text-6xl font-bold text-slate-800 mb-4">{currentPlayerScore}</p>
             {gameMode === 'Tantangan Harian' ? (
                <>
                {dailyRank > 0 && (
                    <p className="text-xl text-slate-600 mb-4">
                        Peringkat Harian: <span className="font-bold text-teal-600">#{dailyRank}</span>
                    </p>
                )}
                </>
             ) : (
                <>
                <p className="text-xl text-slate-600 mb-4">
                  Total Skor: <span className="font-bold text-slate-800">{totalScore}</span>
                </p>
                {globalRank > 0 && (
                  <p className="text-lg text-slate-600 mb-6">
                    Peringkat Global Anda: <span className="font-bold text-teal-600">#{globalRank}</span>
                  </p>
                )}
                </>
             )}
            <button
                onClick={handlePlayAgainClick}
                className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-transform transform hover:scale-105 active:scale-95"
            >
                Main Lagi
            </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl border border-slate-200">
            <h3 className="text-2xl font-bold mb-4 text-center">Riwayat Permainan Anda</h3>
             <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            <th className="p-3 font-semibold">Tanggal</th>
                            <th className="p-3 font-semibold">Juz</th>
                            <th className="p-3 font-semibold">Tingkat</th>
                            <th className="p-3 font-semibold">Jenis</th>
                            <th className="p-3 font-semibold">Jml. Soal</th>
                            <th className="p-3 font-semibold">Durasi</th>
                            <th className="p-3 font-semibold text-right">Skor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {playerHistory.map((score) => (
                            <tr key={`${score.name}-${score.date}`} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="p-3">{new Date(score.date).toLocaleDateString('id-ID')}</td>
                                <td className="p-3">{score.juz.join(', ')}</td>
                                <td className="p-3">{score.difficulty}</td>
                                <td className="p-3">{score.gameMode || 'Pilihan Ganda'}</td>
                                <td className="p-3">{score.numberOfQuestions || 5}</td>
                                <td className="p-3">{formatDuration(score.duration)}</td>
                                <td className="p-3 text-right font-semibold">{score.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {playerHistory.length === 0 && <p className="text-center p-4 text-slate-500">Belum ada riwayat permainan.</p>}
            </div>
        </div>
    </div>
  );
};

export default FinishedScreen;
