import { Theme } from './types';

export const DEFAULT_THEME: Theme = {
  primary: '#4f46e5', // Indigo 600
  secondary: '#a855f7', // Purple 500
  accent: '#ec4899', // Pink 500
  mood: 'Default',
};

export const SAMPLE_RATE = 2048; // FFT Size
export const SMOOTHING_TIME_CONSTANT = 0.8;

// Fallback image when no album art is found
export const DEFAULT_COVER_ART = 'https://picsum.photos/400/400';

export const THEME_PRESETS: Record<string, Theme> = {
    Default: DEFAULT_THEME,
    Fire: {
        primary: '#dc2626', // Red 600
        secondary: '#ea580c', // Orange 600
        accent: '#facc15', // Yellow 400
        mood: 'Fiery'
    },
    Ice: {
        primary: '#0ea5e9', // Sky 500
        secondary: '#22d3ee', // Cyan 400
        accent: '#e0f2fe', // Sky 100
        mood: 'Icy'
    },
    Forest: {
        primary: '#166534', // Green 800
        secondary: '#22c55e', // Green 500
        accent: '#bef264', // Lime 300
        mood: 'Natural'
    }
};