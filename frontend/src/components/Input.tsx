import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  hint,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute top-3 left-3 text-zinc-500 flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={id}
          ref={ref}
          className={`w-full rounded-xl border bg-zinc-950/60 py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-zinc-800 focus:border-brand-500'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-400 font-medium pt-0.5">
          ⚠️ {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[10px] text-zinc-500 leading-tight">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
