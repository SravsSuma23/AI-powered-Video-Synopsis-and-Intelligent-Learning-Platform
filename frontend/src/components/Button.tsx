import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-bold transition-all rounded-xl cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-lg shadow-brand-500/10 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]',
    secondary: 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/80',
    outline: 'border border-brand-500/20 bg-brand-500/5 text-brand-300 hover:bg-brand-500/20 hover:text-white',
    danger: 'bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500/20'
  };

  const sizes = {
    sm: 'py-1.5 px-3.5 text-xs',
    md: 'py-2.5 px-5 text-sm',
    lg: 'py-3.5 px-7 text-base'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      ) : icon ? (
        <span className="mr-1.5">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
