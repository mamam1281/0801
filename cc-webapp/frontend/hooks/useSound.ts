import { useRef, useEffect } from 'react';

export interface SoundOptions {
  volume?: number;
  loop?: boolean;
}

export interface SoundControls {
  playSound: (soundName: string, options?: SoundOptions) => void;
  stopSound: () => void;
  pauseSound: () => void;
}

export function useSound(): SoundControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (soundName: string, options: SoundOptions = {}) => {
    const sounds: Record<string, string> = {
      spin: "/sounds/spin.mp3",
      win: "/sounds/win.mp3",
      lose: "/sounds/lose.mp3",
      click: "/sounds/click.mp3",
      common: "/sounds/common.mp3",
      rare: "/sounds/rare.mp3",
      epic: "/sounds/epic.mp3",
      legendary: "/sounds/legendary.mp3"
    };

    if (sounds[soundName] && typeof window !== "undefined") {
      const audio = new Audio(sounds[soundName]);
      audio.volume = options.volume || 0.5;
      audio.loop = options.loop || false;
      audioRef.current = audio;
      
      audio.play().catch(() => {
        // Silent fail for browsers that block autoplay
        console.warn('Audio playback was prevented');
      });
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const pauseSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { playSound, stopSound, pauseSound };
}
