import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AudioVisualizer from './components/AudioVisualizer';
import PlayerControls from './components/PlayerControls';
import PlaylistSidebar from './components/PlaylistSidebar';
import { Track, Theme } from './types';
import { DEFAULT_THEME, SAMPLE_RATE, DEFAULT_COVER_ART } from './constants';
import { extractAlbumArt } from './utils/audioUtils';
import { analyzeAlbumArt } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null); // For React render triggers

  // Refs for data persistence
  const currentThemeRef = useRef<Theme>(DEFAULT_THEME);
  // Force re-render for theme updates
  const [, setTick] = useState(0); 

  // Initialize Audio Context on user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new Ctx();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = SAMPLE_RATE;
      setAnalyserNode(analyserRef.current);

      audioRef.current = new Audio();
      // Important: Add to DOM to ensure stable behavior in some browsers
      document.body.appendChild(audioRef.current);
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Handle track ending
      audioRef.current.addEventListener('ended', handleTrackEnd);
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const handleTrackEnd = () => {
     handleNext();
  };

  const handleNext = useCallback(() => {
    setPlaylist(prev => {
        if (prev.length === 0) return prev;
        setCurrentTrackIndex(curr => {
            const next = (curr + 1) % prev.length;
            return next;
        });
        return prev;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setPlaylist(prev => {
        if (prev.length === 0) return prev;
        setCurrentTrackIndex(curr => {
            const next = curr === 0 ? prev.length - 1 : curr - 1;
            return next;
        });
        return prev;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && document.body.contains(audioRef.current)) {
        document.body.removeChild(audioRef.current);
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Track Loading Logic
  useEffect(() => {
    const loadTrack = async () => {
      if (currentTrackIndex === -1 || !playlist[currentTrackIndex] || !audioRef.current) return;
      
      const track = playlist[currentTrackIndex];
      const audio = audioRef.current;
      
      // Update Audio Source and Handle CORS
      if (track.type === 'file' && track.file) {
        // Local files (blobs) should not have crossOrigin set to anonymous or they might be treated as tainted
        audio.removeAttribute('crossOrigin');
        audio.src = URL.createObjectURL(track.file);
      } else {
        // Remote URLs need anonymous CORS to allow audio analysis
        audio.crossOrigin = "anonymous";
        audio.src = track.url;
      }
      
      if (isPlaying) {
        audio.play().catch(e => console.error("Playback failed:", e));
      }

      // Analyze Art for Theme if not already done
      if (!track.theme) {
         let artToAnalyze = track.coverArt;
         
         if (artToAnalyze) {
             console.log("Analyzing album art with Gemini...");
             const theme = await analyzeAlbumArt(artToAnalyze);
             if (theme) {
                 updateTrackTheme(track.id, theme);
                 currentThemeRef.current = theme;
             } else {
                 currentThemeRef.current = DEFAULT_THEME;
             }
         } else {
             currentThemeRef.current = DEFAULT_THEME;
         }
         setTick(t => t + 1); // Force re-render of Visualizer with new theme
      } else {
          currentThemeRef.current = track.theme;
          setTick(t => t + 1);
      }
    };

    loadTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex, playlist.length]); 

  const updateTrackTheme = (id: string, theme: Theme) => {
      setPlaylist(prev => prev.map(t => t.id === id ? { ...t, theme } : t));
  };

  const togglePlay = () => {
    initAudio();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play error", e));
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    initAudio();

    const newTracks: Track[] = [];
    const files: File[] = Array.from(e.target.files);

    for (const file of files) {
        let coverArt = undefined;
        try {
            coverArt = await extractAlbumArt(file);
        } catch(err) {
            console.warn("Failed to extract art", err);
        }

        const nameParts = file.name.replace(/\.[^/.]+$/, "").split('-');
        const artist = nameParts.length > 1 ? nameParts[0].trim() : 'Unknown Artist';
        const title = nameParts.length > 1 ? nameParts.slice(1).join('-').trim() : nameParts[0].trim();

        newTracks.push({
            id: uuidv4(),
            title,
            artist,
            url: '',
            type: 'file',
            file,
            coverArt: coverArt || undefined
        });
    }

    setPlaylist(prev => {
        const updated = [...prev, ...newTracks];
        if (prev.length === 0) {
            setCurrentTrackIndex(0);
            setIsPlaying(true);
        }
        return updated;
    });
  };

  const handleUrlUpload = (url: string) => {
      initAudio();
      const newTrack: Track = {
          id: uuidv4(),
          title: 'Stream URL',
          artist: 'Online Source',
          url,
          type: 'url',
          coverArt: DEFAULT_COVER_ART
      };
      
      setPlaylist(prev => {
          const updated = [...prev, newTrack];
          if (prev.length === 0) {
              setCurrentTrackIndex(0);
              setIsPlaying(true);
          }
          return updated;
      });
  };

  const removeTrack = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPlaylist(prev => {
          const idxToRemove = prev.findIndex(t => t.id === id);
          if (idxToRemove === -1) return prev;
          
          const newPlaylist = prev.filter(t => t.id !== id);
          
          if (currentTrackIndex === idxToRemove) {
              if (newPlaylist.length === 0) {
                  setCurrentTrackIndex(-1);
                  setIsPlaying(false);
                  if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.src = "";
                  }
              } else {
                  setCurrentTrackIndex(idxToRemove % newPlaylist.length);
              }
          } else if (currentTrackIndex > idxToRemove) {
              setCurrentTrackIndex(currentTrackIndex - 1);
          }
          
          return newPlaylist;
      });
  };

  const currentTrack = currentTrackIndex >= 0 ? playlist[currentTrackIndex] : null;

  return (
    <div className="w-full h-screen relative overflow-hidden text-white">
      {/* 3D Visualizer Background */}
      <AudioVisualizer 
        analyser={analyserNode} 
        theme={currentThemeRef.current}
      />

      {/* Intro Overlay if no audio context */}
      {(!audioContextRef.current && playlist.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
            <div className="text-center p-8 border border-white/20 rounded-2xl bg-black/40 shadow-2xl max-w-md">
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">
                    SonicSphere
                </h1>
                <p className="text-gray-300 mb-6">
                    Immersive 3D Audio Visualizer powered by Gemini AI.
                    <br/>
                    Upload music to begin the experience.
                </p>
                <div className="space-y-4">
                     <label className="block w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-full transition transform hover:scale-105">
                        <input type="file" multiple accept="audio/*" onChange={handleFileUpload} className="hidden" />
                        Upload Music Files
                     </label>
                </div>
            </div>
        </div>
      )}

      {/* Playlist Sidebar */}
      <PlaylistSidebar 
        isOpen={isPlaylistOpen} 
        onClose={() => setIsPlaylistOpen(false)}
        playlist={playlist}
        currentTrackId={currentTrack?.id}
        onSelectTrack={(index) => {
            setCurrentTrackIndex(index);
            setIsPlaying(true);
        }}
        onRemoveTrack={removeTrack}
      />

      {/* Player Controls */}
      <PlayerControls 
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        currentTrack={currentTrack}
        volume={volume}
        onVolumeChange={setVolume}
        onFileUpload={handleFileUpload}
        onUrlUpload={handleUrlUpload}
        togglePlaylist={() => setIsPlaylistOpen(!isPlaylistOpen)}
      />
    </div>
  );
};

export default App;