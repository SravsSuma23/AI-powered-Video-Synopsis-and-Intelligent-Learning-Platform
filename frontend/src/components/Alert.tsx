import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  closable?: boolean;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  children,
  closable = false,
  className = ''
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />,
    warning: <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />,
    info: <Info className="h-5 w-5 shrink-0 mt-0.5" />
  };

  return (
    <div className={`flex items-start justify-between rounded-xl border p-4 text-xs leading-normal animate-fade-in ${styles[type]} ${className}`}>
      <div className="flex items-start space-x-2.5">
        {icons[type]}
        <span>{children}</span>
      </div>
      {closable && (
        <button
          onClick={() => setVisible(false)}
          className="p-0.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all shrink-0 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
