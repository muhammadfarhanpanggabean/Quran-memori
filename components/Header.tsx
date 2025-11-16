import React from 'react';
import SoundToggle from './SoundToggle';

interface HeaderProps {
    isMuted: boolean;
    onMuteToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMuted, onMuteToggle }) => {
  return (
    <header className="bg-white backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-teal-600">
          Tantangan Hafalan Quran
        </h1>
        <SoundToggle isMuted={isMuted} onToggle={onMuteToggle} />
      </div>
    </header>
  );
};

export default Header;
