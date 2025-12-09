import React from 'react';
import { Track } from '../types';
import { X, Music, Play } from 'lucide-react';

interface PlaylistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Track[];
  currentTrackId: string | undefined;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (id: string, e: React.MouseEvent) => void;
}

const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  isOpen,
  onClose,
  playlist,
  currentTrackId,
  onSelectTrack,
  onRemoveTrack,
}) => {
  return (
    <div 
        className={`fixed top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-md border-l border-white/10 transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Playlist</h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
            <X size={20} />
        </button>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-64px)] p-2">
        {playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center px-4">
                <Music size={32} className="mb-2 opacity-50" />
                <p>No tracks added.</p>
                <p className="text-sm">Upload files or add URLs to start.</p>
            </div>
        ) : (
            <ul className="space-y-1">
                {playlist.map((track, index) => {
                    const isActive = track.id === currentTrackId;
                    return (
                        <li 
                            key={track.id}
                            className={`group flex items-center p-2 rounded-lg cursor-pointer transition ${isActive ? 'bg-indigo-900/50 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            onClick={() => onSelectTrack(index)}
                        >
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0 relative">
                                {track.coverArt ? (
                                    <img src={track.coverArt} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Music size={16} className="text-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                )}
                                {isActive && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Play size={12} fill="white" className="text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="ml-3 flex-1 min-w-0">
                                <h4 className={`text-sm font-medium truncate ${isActive ? 'text-indigo-300' : 'text-gray-200'}`}>
                                    {track.title}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id, e); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </li>
                    );
                })}
            </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistSidebar;