import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Music, Link as LinkIcon, List, Settings, Palette } from 'lucide-react';
import { Track, VisualizerMode, ThemeMode } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTrack: Track | null;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlUpload: (url: string) => void;
  togglePlaylist: () => void;
  
  visualizerMode: VisualizerMode;
  onVisualizerChange: (mode: VisualizerMode) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentTrack,
  volume,
  onVolumeChange,
  onFileUpload,
  onUrlUpload,
  togglePlaylist,
  visualizerMode,
  onVisualizerChange,
  themeMode,
  onThemeChange,
  currentTime,
  duration,
  onSeek
}) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for smooth seeking
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  useEffect(() => {
    if (!isDragging) {
        setDragValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDragValue(parseFloat(e.target.value));
  };
  
  const handleSeekCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
      setIsDragging(false);
      onSeek(dragValue);
  };
  
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setDragValue(val);
  };
  
  const handleRangePointerDown = () => setIsDragging(true);
  const handleRangePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(false);
      onSeek(dragValue);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUrlUpload(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const visualizerOptions: VisualizerMode[] = ['Orb', 'Bars', 'Cube', 'Vinyl'];
  const themeOptions: ThemeMode[] = ['Dynamic', 'Default', 'Fire', 'Ice', 'Forest'];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent backdrop-blur-md z-20 flex flex-col items-center border-t border-white/5">
      
      {/* Track Info Top Row (Mobile/Desktop) */}
      {currentTrack && (
        <div className="w-full max-w-4xl mb-2 flex items-center justify-between text-white/90">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-gray-800 flex-shrink-0 overflow-hidden relative border border-white/10 shadow-lg">
              {currentTrack.coverArt ? (
                <img src={currentTrack.coverArt} alt="Art" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base md:text-lg truncate leading-tight">{currentTrack.title}</h3>
              <p className="text-xs md:text-sm text-gray-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end">
             {themeMode === 'Dynamic' && currentTrack.theme ? (
                <>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Vibe</span>
                    <span 
                        className="text-xs font-bold px-2 py-0.5 rounded-full shadow-sm"
                        style={{ backgroundColor: currentTrack.theme.accent, color: '#000' }}
                    >
                        {currentTrack.theme.mood}
                    </span>
                </>
             ) : (
                <span className="text-xs font-semibold text-gray-400 px-2 py-0.5 border border-white/20 rounded-full">
                    {themeMode}
                </span>
             )}
          </div>
        </div>
      )}

      {/* Progress Bar Row */}
      <div className="w-full max-w-4xl flex items-center gap-3 mb-4 group">
          <span className="text-xs text-gray-400 w-8 text-right font-mono">{formatTime(isDragging ? dragValue : currentTime)}</span>
          <div className="flex-1 h-6 flex items-center relative">
             {/* Custom Range Input */}
             <input
                type="range"
                min="0"
                max={duration || 100}
                value={dragValue}
                onChange={handleRangeChange}
                onMouseDown={handleRangePointerDown}
                onTouchStart={handleRangePointerDown}
                onMouseUp={handleRangePointerUp}
                onTouchEnd={handleRangePointerUp}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-1.5 transition-all z-10"
                style={{
                    backgroundImage: `linear-gradient(to right, #6366f1 ${(dragValue / (duration || 1)) * 100}%, #374151 ${(dragValue / (duration || 1)) * 100}%)`
                }}
             />
          </div>
          <span className="text-xs text-gray-400 w-8 font-mono">{formatTime(duration)}</span>
      </div>

      {/* Controls Row */}
      <div className="w-full max-w-4xl flex items-center justify-between relative">
        
        {/* Left: Uploads */}
        <div className="flex items-center space-x-2">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
                title="Upload Files"
            >
                <Upload size={18} />
            </button>
            <input
                type="file"
                multiple
                accept="audio/*"
                className="hidden"
                ref={fileInputRef}
                onChange={onFileUpload}
            />
            
            <div className="relative">
                <button
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
                    title="Add URL"
                >
                    <LinkIcon size={18} />
                </button>
                {showUrlInput && (
                    <form 
                        onSubmit={handleUrlSubmit}
                        className="absolute bottom-12 left-0 w-64 bg-gray-900 border border-gray-700 p-2 rounded-lg shadow-xl flex gap-2"
                    >
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="Paste MP3 URL..."
                            className="flex-1 bg-black/50 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-indigo-500"
                            autoFocus
                        />
                        <button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded">
                            Add
                        </button>
                    </form>
                )}
            </div>
        </div>

        {/* Center: Playback */}
        <div className="flex items-center space-x-6 md:space-x-10 absolute left-1/2 transform -translate-x-1/2">
          <button onClick={onPrev} className="text-white/70 hover:text-white transition transform hover:scale-110 active:scale-95">
            <SkipBack size={24} />
          </button>
          
          <button 
            onClick={onPlayPause}
            className="w-12 h-12 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition shadow-lg shadow-white/10 transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
          </button>
          
          <button onClick={onNext} className="text-white/70 hover:text-white transition transform hover:scale-110 active:scale-95">
            <SkipForward size={24} />
          </button>
        </div>

        {/* Right: Settings & Volume */}
        <div className="flex items-center space-x-2 md:space-x-4">
             {/* Settings Popover */}
             <div className="relative">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-full transition ${showSettings ? 'text-white bg-white/10' : 'text-white/60 hover:text-white'}`}
                >
                    <Settings size={18} />
                </button>
                {showSettings && (
                    <div className="absolute bottom-12 right-0 w-64 bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 z-50">
                        <div>
                            <div className="flex items-center text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <Settings size={12} className="mr-1" />
                                Visualizer
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {visualizerOptions.map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => onVisualizerChange(mode)}
                                        className={`px-3 py-2 text-xs rounded-md transition ${visualizerMode === mode ? 'bg-indigo-600 text-white font-medium' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-px bg-white/10"></div>
                        <div>
                            <div className="flex items-center text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <Palette size={12} className="mr-1" />
                                Theme
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {themeOptions.map(tMode => (
                                    <button
                                        key={tMode}
                                        onClick={() => onThemeChange(tMode)}
                                        className={`px-3 py-2 text-xs rounded-md transition ${themeMode === tMode ? 'bg-purple-600 text-white font-medium' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        {tMode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center group relative">
                <button className="text-white/60 hover:text-white p-2">
                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="hidden group-hover:block absolute bottom-10 -right-6 w-32 p-3 bg-gray-900 rounded-lg shadow-xl border border-gray-800 -rotate-90 origin-bottom-left">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
            </div>
            
            <button 
                onClick={togglePlaylist}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
            >
                <List size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;