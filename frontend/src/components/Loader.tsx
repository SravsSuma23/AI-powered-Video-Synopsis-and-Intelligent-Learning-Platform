import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  label = 'Processing...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 p-6 ${className}`}>
      <div className="relative">
        <Loader2 className={`animate-spin text-brand-400 shrink-0 ${
          size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-10 w-10' : 'h-16 w-16'
        }`} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full rounded-full bg-brand-500/5 blur-xl pointer-events-none" />
      </div>
      {label && (
        <span className="text-zinc-400 text-xs font-semibold tracking-wide animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

export default Loader;
