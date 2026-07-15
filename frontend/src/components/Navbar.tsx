import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import { Sparkles, History, Shield, LogOut, Menu, X, PlusCircle } from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Sync user state on route change or storage change
    setUser(authService.getCurrentUser());
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-dark-bg/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 transition-all group-hover:scale-105 group-hover:bg-brand-500/20">
              <YoutubeIcon className="h-5 w-5 text-red-500 transition-transform group-hover:rotate-12" />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-brand-300 animate-pulse" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white transition-all group-hover:text-brand-300">
              Video Synopsis <span className="bg-gradient-to-r from-brand-400 to-purple-300 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/dashboard')
                      ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/generate"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/generate')
                      ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>New Synopsis</span>
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/admin')
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-zinc-800"></div>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{user.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-brand-400 font-bold">
                      {user.role}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-sm font-bold text-white shadow-inner">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 border border-transparent hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
                <a href="#objectives" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Objectives</a>
                
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg glow-purple hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-zinc-800 cursor-pointer"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-lg px-4 py-4 space-y-3">
          {user ? (
            <>
              <div className="flex items-center space-x-3 px-3 py-2 border-b border-zinc-800 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-sm font-bold text-white">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-brand-400">{user.email} | <span className="font-bold capitalize">{user.role}</span></div>
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
              >
                <History className="h-4 w-4 text-brand-400" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/generate"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
              >
                <PlusCircle className="h-4 w-4 text-brand-400" />
                <span>New Synopsis</span>
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                >
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <>
              <a
                href="#features"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#objectives"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Objectives
              </a>
              <div className="h-px bg-zinc-800 my-2"></div>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="block text-center rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 px-4 py-2.5 text-base font-medium text-white shadow-lg shadow-purple-500/10 hover:opacity-90 transition-all"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
