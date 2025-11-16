import React from 'react';
import { LeaderboardEntry, Player } from '../types';
import { DEFAULT_AVATAR_SVG } from '../constants';
import { useSound } from '../hooks/useSound';
import { BUTTON_CLICK_SOUND } from '../sounds';

type PlayerProfiles = Record<string, { profilePicture: string }>;
type LeaderboardView = 'global' | 'daily';

interface LeaderboardScreenProps {
  globalLeaderboard: LeaderboardEntry[];
  dailyLeaderboard: LeaderboardEntry[];
  onBack: () => void;
  currentPlayer: Player | null;
  playerProfiles: PlayerProfiles;
  view: LeaderboardView;
  setView: (view: LeaderboardView) => void;
  isMuted: boolean;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ globalLeaderboard, dailyLeaderboard, onBack, currentPlayer, playerProfiles, view, setView, isMuted }) => {
  const leaderboard = view === 'global' ? globalLeaderboard : dailyLeaderboard;
  const topPlayers = leaderboard.slice(0, 50);
  const playClickSound = useSound(BUTTON_CLICK_SOUND, isMuted);

  const handleBackClick = () => {
    playClickSound();
    onBack();
  };
  
  const handleViewChange = (newView: LeaderboardView) => {
    playClickSound();
    setView(newView);
  }

  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in w-full">
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl border border-slate-200">
            <h3 className="text-2xl font-bold mb-4 text-center text-teal-600">Papan Peringkat</h3>
            <div className="flex justify-center mb-6 bg-slate-200 p-1 rounded-lg">
                <button
                    onClick={() => handleViewChange('global')}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${view === 'global' ? 'bg-white text-teal-600 shadow' : 'text-slate-600 hover:bg-slate-300/50'}`}
                >
                    Global
                </button>
                <button
                    onClick={() => handleViewChange('daily')}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${view === 'daily' ? 'bg-white text-teal-600 shadow' : 'text-slate-600 hover:bg-slate-300/50'}`}
                >
                    Tantangan Harian
                </button>
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            <th className="p-3 font-semibold rounded-tl-lg">Peringkat</th>
                            <th className="p-3 font-semibold">Nama</th>
                            <th className="p-3 font-semibold text-right rounded-tr-lg">Skor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topPlayers.map((entry, index) => {
                            const isCurrentUser = currentPlayer && entry.name === currentPlayer.name;
                            const isTopThree = index < 3;
                            let rowClass = 'border-b border-slate-200';

                            if (isCurrentUser) {
                                rowClass += ' bg-teal-50 text-teal-900 font-semibold';
                            } else if (isTopThree && view === 'global') {
                                rowClass += ' bg-amber-50';
                            } else {
                                rowClass += ' hover:bg-slate-100/50';
                            }

                            return (
                                <tr key={entry.name} className={rowClass}>
                                    <td className="p-3 font-bold text-slate-500 w-16">{index + 1}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={playerProfiles[entry.name]?.profilePicture || DEFAULT_AVATAR_SVG}
                                                alt={entry.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <span className={isTopThree ? 'font-bold' : ''}>{entry.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-semibold">{entry.totalScore}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {leaderboard.length === 0 && (
                    <p className="text-center p-8 text-slate-500">
                        {view === 'daily' ? "Belum ada yang menyelesaikan tantangan hari ini. Jadilah yang pertama!" : "Belum ada skor tercatat."}
                    </p>
                 )}
            </div>
             <div className="mt-6 text-center">
                <button
                    onClick={handleBackClick}
                    className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-transform transform hover:scale-105 active:scale-95"
                >
                    Kembali
                </button>
            </div>
        </div>
    </div>
  );
};

export default LeaderboardScreen;
