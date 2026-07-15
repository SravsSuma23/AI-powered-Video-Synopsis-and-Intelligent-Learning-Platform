import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/80 py-12 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20">
                <YoutubeIcon className="h-4 w-4 text-red-500" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Video Synopsis <span className="text-brand-400">AI</span>
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-xs">
              Transforming lengthy video content into beautiful, structures summaries using advanced NLP intelligence. Built for professional and educational speed-reading.
            </p>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Application</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">User Dashboard</Link>
              </li>
              <li>
                <Link to="/generate" className="text-sm text-zinc-400 hover:text-white transition-colors">Summarize Video</Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign In / Register</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Corporate</h3>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-zinc-400">Prepared For:</div>
              <div className="text-sm font-semibold text-white tracking-wide">
                Symbiosys Technologies
              </div>
              <div className="text-xs text-zinc-500">Internship Project Delivery</div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Video Synopsis AI. All rights reserved.
          </div>
          <div className="flex items-center space-x-1">
            <span>Crafted with</span>
            <Heart className="h-3 w-3 text-brand-500 fill-brand-500 animate-pulse" />
            <span>for excellence.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
