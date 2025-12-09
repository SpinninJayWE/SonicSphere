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
  coverArt?: string; // Base64 string
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