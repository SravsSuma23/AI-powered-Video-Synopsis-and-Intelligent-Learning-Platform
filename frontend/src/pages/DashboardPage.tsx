import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { synopsisService } from '../services/synopsisService';
import type { SynopsisData } from '../services/synopsisService';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import { Search, PlusCircle, Video, Clock, Bookmark, Trash2, Calendar, FileText, ChevronRight, ArrowRight, Loader } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<SynopsisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await synopsisService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching synopsis history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card navigation click
    try {
      const updated = await synopsisService.toggleSave(id);
      setHistory(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error('Failed to bookmark synopsis:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card navigation click
    if (window.confirm('Are you sure you want to remove this video synopsis from your workspace history?')) {
      try {
        await synopsisService.deleteSynopsis(id);
        setHistory(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('Failed to delete synopsis:', err);
      }
    }
  };

  // Calculations for stats
  const totalSummaries = history.length;
  const savedSummariesCount = history.filter(item => item.saved).length;
  
  const calculateHoursSaved = () => {
    let totalMinutes = 0;
    history.forEach(item => {
      const durationParts = item.metadata.duration.split(':').map(Number);
      if (durationParts.length === 2) {
        totalMinutes += durationParts[0] + durationParts[1] / 60;
      }
    });
    // Assume AI reading saves roughly 90% of duration time
    return ((totalMinutes * 0.9) / 60).toFixed(1);
  };

  const hoursSaved = calculateHoursSaved();

  // Filtering
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.metadata.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (showSavedOnly) {
      return matchesSearch && item.saved;
    }
    return matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col">
      
      {/* Upper Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight margin-0">
            Workspace Hub
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Welcome back, <span className="text-brand-300 font-semibold">{user?.name}</span>. Manage your document logs and analyze YouTube learning.
          </p>
        </div>
        <Link
          to="/generate"
          className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>New Synopsis</span>
        </Link>
      </div>

      {/* Analytics Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        
        {/* Metric 1 */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
            <Video className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalSummaries}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Processed Videos</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Clock className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{hoursSaved} hrs</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Estimated Hours Saved</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Bookmark className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{savedSummariesCount}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Saved Synopses</div>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 flex-grow flex flex-col">
        
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute top-3 left-3 h-4.5 w-4.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title, channel, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showSavedOnly
                  ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
                  : 'border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:text-white'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${showSavedOnly ? 'fill-brand-400 text-brand-400' : ''}`} />
              <span>{showSavedOnly ? 'Showing Favorites' : 'Show Favorites Only'}</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center py-20 space-y-4">
            <Loader className="h-10 w-10 text-brand-400 animate-spin" />
            <span className="text-zinc-500 text-sm">Accessing database history logs...</span>
          </div>
        ) : filteredHistory.length > 0 ? (
          
          /* Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/synopsis/${item.id}`)}
                className="group relative flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-950/40 overflow-hidden hover:border-zinc-700 hover:bg-zinc-900/20 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
              >
                {/* Thumbnail Layer */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-900 border-b border-zinc-900">
                  <img
                    src={item.metadata.thumbnail}
                    alt={item.metadata.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide">
                    {item.metadata.duration}
                  </span>
                  
                  {/* Favorite Toggle button */}
                  <button
                    onClick={(e) => handleToggleSave(item.id, e)}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-zinc-300 border border-white/5 hover:text-indigo-300 hover:bg-black/90 transition-all cursor-pointer"
                  >
                    <Bookmark className={`h-4 w-4 ${item.saved ? 'fill-indigo-400 text-indigo-400' : ''}`} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="line-clamp-2 text-sm font-bold text-white leading-snug group-hover:text-brand-300 transition-colors">
                      {item.metadata.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold">{item.metadata.channelName}</p>
                  </div>

                  <div className="border-t border-zinc-900 pt-3.5 flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{item.metadata.publishDate}</span>
                    </div>

                    <div className="flex items-center space-x-3.5">
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Delete synopsis log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center font-bold text-brand-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Read</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : (
          
          /* Empty State */
          <div className="flex-grow flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 mb-6">
              <FileText className="h-8 w-8 text-zinc-600" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">No Synopsis Logs Found</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">
              {showSavedOnly 
                ? "You haven't bookmarked any AI video summaries as favorites yet." 
                : "Your history log is currently empty. Submit a YouTube link to generate your first document synopsis!"}
            </p>

            <Link
              to="/generate"
              className="inline-flex items-center space-x-2 rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/20 px-5 py-2.5 text-sm font-semibold hover:bg-brand-500/20 hover:text-white transition-all"
            >
              <span>Process Your First Video</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        )}

      </div>
    </div>
  );
};

export default DashboardPage;
