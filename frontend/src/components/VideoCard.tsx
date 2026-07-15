import React from 'react';
import { Play, Calendar, Bookmark, ArrowRight, Trash2 } from 'lucide-react';
import type { SynopsisData } from '../services/synopsisService';

interface VideoCardProps {
  data: SynopsisData;
  onView: (id: string) => void;
  onBookmarkToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  data,
  onView,
  onBookmarkToggle,
  onDelete
}) => {
  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden hover:border-brand-500/30 transition-all duration-300 flex flex-col justify-between">
      {/* Thumbnail / Header Area */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden shrink-0 border-b border-zinc-900">
        <img
          src={data.metadata.thumbnail}
          alt={data.metadata.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-all duration-500 opacity-80"
        />
        {/* Play hover badge */}
        <div 
          onClick={() => onView(data.id)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 transform scale-90 group-hover:scale-100 transition-all">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Floating duration tags */}
        <div className="absolute bottom-2.5 right-2.5 rounded bg-zinc-950/80 px-2 py-0.5 text-[9px] font-bold text-white tracking-widest border border-zinc-800">
          {data.metadata.duration}
        </div>

        {/* Favorite Icon */}
        {onBookmarkToggle && (
          <button
            onClick={() => onBookmarkToggle(data.id)}
            className={`absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-950/80 transition-all cursor-pointer ${
              data.saved ? 'text-yellow-400 border-yellow-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${data.saved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block truncate">
              {data.metadata.channelName}
            </span>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
              medium size
            </span>
          </div>
          <h4 
            onClick={() => onView(data.id)}
            className="text-xs font-bold text-white leading-snug tracking-tight hover:text-brand-300 cursor-pointer line-clamp-2"
          >
            {data.metadata.title}
          </h4>
        </div>

        {/* Footer actions */}
        <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-[10px] text-zinc-500">
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{data.metadata.publishDate}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onDelete && (
              <button
                onClick={() => onDelete(data.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-900 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onView(data.id)}
              className="flex items-center space-x-1 text-xs font-bold text-brand-400 group-hover:text-brand-300 transition-colors cursor-pointer"
            >
              <span>View Report</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
