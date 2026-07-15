import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface ProgressStep {
  id: number;
  name: string;
  description: string;
  status: 'upcoming' | 'current' | 'complete';
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  className = ''
}) => {
  return (
    <div className={`space-y-6 w-full ${className}`}>
      {steps.map((step, idx) => (
        <div key={step.id} className="relative flex items-start group">
          {/* Connecting line */}
          {idx !== steps.length - 1 && (
            <div className="absolute top-7 left-3.5 -ml-px h-full w-0.5 bg-zinc-800" />
          )}

          {/* Bullet Step Icon */}
          <div className="flex h-7 w-7 items-center justify-center shrink-0">
            {step.status === 'complete' ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
            ) : step.status === 'current' ? (
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-brand-500 bg-brand-500/10 text-brand-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-600 font-mono text-[10px] font-bold">
                {step.id}
              </div>
            )}
          </div>

          {/* Description Block */}
          <div className="ml-4 min-w-0 flex-grow pb-5">
            <span className={`text-xs font-bold block ${
              step.status === 'complete' ? 'text-green-400' : step.status === 'current' ? 'text-brand-300' : 'text-zinc-500'
            }`}>
              {step.name}
            </span>
            <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">
              {step.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressTracker;
