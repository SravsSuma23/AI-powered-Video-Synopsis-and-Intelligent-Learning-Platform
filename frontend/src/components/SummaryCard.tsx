import React from 'react';

interface SummaryCardProps {
  title: string;
  category?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  accent?: 'purple' | 'blue' | 'green' | 'yellow';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  category,
  icon,
  children,
  accent = 'purple'
}) => {
  const accentClasses = {
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-300',
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-300',
    green: 'border-green-500/20 bg-green-500/5 text-green-300',
    yellow: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-300'
  };

  return (
    <div className={`rounded-2xl border p-6 space-y-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.005] ${accentClasses[accent]}`}>
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2.5">
          {icon && <div className="shrink-0 text-current">{icon}</div>}
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
        </div>
        {category && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400">
            {category}
          </span>
        )}
      </div>
      <div className="text-xs text-zinc-300 leading-relaxed font-sans">
        {children}
      </div>
    </div>
  );
};

export default SummaryCard;
