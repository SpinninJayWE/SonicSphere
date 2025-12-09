import React, { useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Music, Link as LinkIcon, List } from 'lucide-react';
import { Track } from '../types';

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
}

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
}) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUrlUpload(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-sm z-20 flex flex-col items-center">
      
      {/* Progress & Info */}
      {currentTrack && (
        <div className="w-full max-w-3xl mb-4 flex items-center justify-between text-white/90">
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="w-12 h-12 rounded-md bg-gray-800 flex-shrink-0 overflow-hidden relative border border-white/10">
              {currentTrack.coverArt ? (
                <img src={currentTrack.coverArt} alt="Art" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{currentTrack.title}</h3>
              <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>
          
          {currentTrack.theme && (
             <div className="hidden md:flex flex-col items-end">
                <span className="text-xs uppercase tracking-wider text-gray-500">Vibe</span>
                <span 
                    className="text-sm font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: currentTrack.theme.accent, color: '#000' }}
                >
                    {currentTrack.theme.mood}
                </span>
             </div>
          )}
        </div>
      )}

      {/* Controls Row */}
      <div className="w-full max-w-3xl flex items-center justify-between">
        
        {/* Left: Uploads */}
        <div className="flex items-center space-x-2">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                title="Upload Files"
            >
                <Upload size={20} />
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
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                    title="Add URL"
                >
                    <LinkIcon size={20} />
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
        <div className="flex items-center space-x-6">
          <button onClick={onPrev} className="text-white/70 hover:text-white transition transform hover:scale-110">
            <SkipBack size={24} />
          </button>
          
          <button 
            onClick={onPlayPause}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition shadow-lg shadow-white/10 transform hover:scale-105"
          >
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
          </button>
          
          <button onClick={onNext} className="text-white/70 hover:text-white transition transform hover:scale-110">
            <SkipForward size={24} />
          </button>
        </div>

        {/* Right: Volume & Playlist */}
        <div className="flex items-center space-x-4">
            <div className="flex items-center group relative">
                <button className="text-white/70 hover:text-white p-2">
                    {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
            >
                <List size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;