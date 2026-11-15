import React, { useEffect, useState } from 'react';

// Known stock portrait IDs previously embedded in dummy/template records
const DUMMY_PORTRAIT_IDS = [
  'photo-1535713875002-d1d0cf377fde',
  'photo-1472099645785-5658abf4ff4e',
  'photo-1544005313-94ddf0286df2',
  'photo-1500648767791-00dcc994a43e',
  'photo-1534528741775-53994a69daeb',
  'photo-1494790108377-be9c29b29330',
  'photo-1599566150163-29194dcaad36',
  'photo-1570295999919-56ceb5ecca61',
  'photo-1438761681033-6461ffad8d80',
];

export const isDummyProfilePhoto = (fotoProfil?: string | null): boolean => {
  if (!fotoProfil || typeof fotoProfil !== 'string') return false;
  const trimmed = fotoProfil.trim();
  if (!trimmed) return false;
  return DUMMY_PORTRAIT_IDS.some(id => trimmed.includes(id));
};

export const hasCustomProfilePhoto = (fotoProfil?: string | null): boolean => {
  if (!fotoProfil || typeof fotoProfil !== 'string') return false;
  const trimmed = fotoProfil.trim();
  return trimmed !== '' && !isDummyProfilePhoto(trimmed);
};

export const stripDummyProfilePhoto = (fotoProfil?: string | null): string => {
  return hasCustomProfilePhoto(fotoProfil) ? (fotoProfil as string).trim() : '';
};

// Helper to get initials
export const getInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) {
    const word = words[0];
    return word.slice(0, Math.min(2, word.length)).toUpperCase();
  }
  const firstLetter = words[0].charAt(0).toUpperCase();
  const secondLetter = words[1].charAt(0).toUpperCase();
  return `${firstLetter}${secondLetter}`;
};

const GRADIENTS = [
  'from-emerald-500 to-teal-600 text-white',
  'from-indigo-500 to-violet-600 text-white',
  'from-rose-500 to-pink-600 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-sky-500 to-blue-600 text-white',
  'from-fuchsia-500 to-purple-600 text-white',
];

export const getAvatarColorClass = (name: string): string => {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[idx];
};

interface AvatarProps {
  namaLengkap: string;
  fotoProfil?: string | null;
  className?: string; // e.g. "w-8 h-8 text-[11px] font-bold"
  id?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  namaLengkap,
  fotoProfil,
  className = "w-8 h-8 text-[10px] font-bold",
  id
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [fotoProfil]);

  const hasPhoto = !imgError && hasCustomProfilePhoto(fotoProfil);
  const roundedClass = /\brounded-/.test(className) ? '' : 'rounded-full';

  if (hasPhoto) {
    return (
      <img
        id={id}
        src={fotoProfil!}
        alt={namaLengkap}
        onError={() => setImgError(true)}
        className={`${roundedClass} ${className} object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = getInitials(namaLengkap);
  const colorClass = getAvatarColorClass(namaLengkap);

  return (
    <div
      id={id}
      className={`${roundedClass} ${className} bg-gradient-to-br ${colorClass} flex items-center justify-center font-mono select-none border border-slate-200/20 dark:border-slate-800/40 shadow-xs flex-shrink-0 uppercase`}
      title={namaLengkap}
    >
      {initials}
    </div>
  );
};
