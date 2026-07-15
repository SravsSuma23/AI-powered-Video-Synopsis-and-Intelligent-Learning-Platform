import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import { LayoutDashboard, PlusCircle, User as UserIcon, Shield, LogOut, Menu, ChevronLeft } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div 
      className={`hidden md:flex flex-col shrink-0 min-h-screen border-r border-white/5 bg-dark-bg/60 backdrop-blur-md transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header and Toggle Button */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        {!collapsed && (
          <span className="font-display font-black text-white text-base tracking-wider uppercase pl-2">
            Workspace
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:text-white mx-auto cursor-pointer"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-4 space-y-1.5">
        {/* Dashboard Link */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center space-x-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Workspace Hub</span>}
        </NavLink>

        {/* Generate Link */}
        <NavLink
          to="/generate"
          className={({ isActive }) =>
            `flex items-center space-x-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
            }`
          }
        >
          <PlusCircle className="h-5 w-5 shrink-0" />
          {!collapsed && <span>New Synopsis</span>}
        </NavLink>

        {/* Profile Link */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center space-x-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
            }`
          }
        >
          <UserIcon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Profile Settings</span>}
        </NavLink>

        {/* Admin Link (Conditional) */}
        {user.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center space-x-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
              }`
            }
          >
            <Shield className="h-5 w-5 shrink-0 text-purple-400" />
            {!collapsed && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* Footer / Sign Out Section */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 py-3 px-4 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 w-full transition-all cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
