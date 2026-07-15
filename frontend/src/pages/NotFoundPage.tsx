import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-grow flex items-center justify-center py-24 px-4 text-center relative overflow-hidden">
      {/* Visual glowing highlight orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-brand-500/5 blur-[80px] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10 animate-fade-in">
        {/* Animated logo header */}
        <div className="flex justify-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20">
            <YoutubeIcon className="h-6 w-6 text-red-500" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-brand-300 animate-pulse" />
          </div>
        </div>

        {/* 404 Visual Indicator */}
        <div className="space-y-2">
          <div className="font-display text-7xl sm:text-8xl font-black tracking-tight bg-gradient-to-r from-brand-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            404
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Pipeline Route Unresolved
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            The requested workspace directory or segment does not exist or has been archived during simulation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-950/20 py-2.5 px-5 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 py-2.5 px-5 text-xs font-bold text-white shadow-lg glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
