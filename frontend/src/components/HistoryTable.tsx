import React from 'react';
import { Play, Calendar, Bookmark, Trash2 } from 'lucide-react';
import type { SynopsisData } from '../services/synopsisService';

interface HistoryTableProps {
  data: SynopsisData[];
  onView: (id: string) => void;
  onBookmarkToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  data,
  onView,
  onBookmarkToggle,
  onDelete
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-zinc-800 bg-zinc-900/10 text-zinc-500 text-xs font-semibold">
        No records found matching your active filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full rounded-2xl border border-zinc-800 bg-zinc-900/30">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/40 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            <th className="py-4 px-5">Video Overview</th>
            <th className="py-4 px-5">Channel</th>
            <th className="py-4 px-5">Target Size</th>
            <th className="py-4 px-5">Compiled On</th>
            <th className="py-4 px-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80">
          {data.map((item) => (
            <tr 
              key={item.id}
              className="hover:bg-white/[0.01] transition-all group"
            >
              {/* Column 1: Video Title */}
              <td className="py-4 px-5 max-w-sm">
                <div className="flex items-center space-x-3">
                  <div className="relative h-10 w-16 shrink-0 rounded bg-zinc-950 overflow-hidden border border-zinc-800/60">
                    <img 
                      src={item.metadata.thumbnail} 
                      alt="" 
                      className="h-full w-full object-cover opacity-80"
                    />
                    <div className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.2 text-[7px] font-bold text-white tracking-widest">
                      {item.metadata.duration}
                    </div>
                  </div>
                  
                  <div className="overflow-hidden">
                    <span 
                      onClick={() => onView(item.id)}
                      className="font-bold text-white hover:text-brand-300 cursor-pointer block truncate tracking-tight text-xs"
                    >
                      {item.metadata.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                      ID: {item.id}
                    </span>
                  </div>
                </div>
              </td>

              {/* Column 2: Channel */}
              <td className="py-4 px-5 text-zinc-300 font-medium">
                {item.metadata.channelName}
              </td>

              {/* Column 3: Summary Size */}
              <td className="py-4 px-5">
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                  medium
                </span>
              </td>

              {/* Column 4: Compiled On */}
              <td className="py-4 px-5 text-zinc-400 flex items-center space-x-1.5 pt-6 border-0">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span>{item.metadata.publishDate}</span>
              </td>

              {/* Column 5: Action Options */}
              <td className="py-4 px-5 text-right">
                <div className="inline-flex items-center space-x-2.5">
                  {onBookmarkToggle && (
                    <button
                      onClick={() => onBookmarkToggle(item.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 transition-all cursor-pointer ${
                        item.saved ? 'text-yellow-400 border-yellow-500/20' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${item.saved ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  <button
                    onClick={() => onView(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 text-brand-400 hover:text-white hover:bg-brand-500/10 transition-all cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  </button>

                  {onDelete && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-900 text-zinc-600 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
