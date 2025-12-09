export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  mood: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  type: 'file' | 'url';
  file?: File;
  coverArt?: string; // Base64 string or Blob URL
  theme?: Theme;
}

export interface VisualizerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface AudioAnalysisData {
  bass: number;
  mid: number;
  treble: number;
  average: number;
}

export type VisualizerMode = 'Orb' | 'Bars' | 'Cube' | 'Vinyl' | 'Tunnel' | 'Matrix';
export type ThemeMode = 'Dynamic' | 'Default' | 'Fire' | 'Ice' | 'Forest';

export interface Preset {
    id: string;
    name: string;
    visualizer: VisualizerMode;
    themeMode: ThemeMode;
}