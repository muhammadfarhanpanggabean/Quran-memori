import React, { useRef, ChangeEvent } from 'react';
import { Player } from '../types';
import { DEFAULT_AVATAR_SVG } from '../constants';
import { useSound } from '../hooks/useSound';
import { BUTTON_CLICK_SOUND } from '../sounds';

interface ProfileHeaderProps {
  player: Player;
  onProfilePictureUpdate: (name: string, newPicture: string) => void;
  isMuted: boolean;
}

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);


const ProfileHeader: React.FC<ProfileHeaderProps> = ({ player, onProfilePictureUpdate, isMuted }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const playClickSound = useSound(BUTTON_CLICK_SOUND, isMuted);

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const img = new Image();
            img.src = loadEvent.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_DIMENSION = 96;
                let { width, height } = img;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, width, height);
                // Use JPEG for better compression, crucial for localStorage
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9); 
                onProfilePictureUpdate(player.name, dataUrl);
            };
        };
        reader.readAsDataURL(file);
    };

    const handleEditClick = () => {
        playClickSound();
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative group cursor-pointer" onClick={handleEditClick} title="Ganti foto profil">
                <img 
                    src={player.profilePicture || DEFAULT_AVATAR_SVG} 
                    alt="Foto Profil" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-transform group-hover:scale-105 group-active:scale-95 duration-150" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity">
                    <EditIcon className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
                </div>
            </div>
            <div className="text-center sm:text-left">
                 <h2 className="text-2xl font-bold">
                    Assalamu'alaikum, <span className="text-teal-500">{player.name}</span>!
                </h2>
                <p className="text-slate-600">Siapkan hafalan terbaikmu.</p>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg" 
                onChange={handleImageChange}
            />
        </div>
    );
};

export default ProfileHeader;
