import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import { User as UserIcon, Shield, ShieldCheck, Key, ArrowLeft, LogOut, CreditCard, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    setName(currentUser.name);
    setEmail(currentUser.email);
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!name || !email) {
      setError('Name and Email fields are required.');
      return;
    }

    setLoading(true);
    try {
      const updated = await authService.updateProfile(name, email);
      setUser(updated);
      setSuccess('Workspace profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updatePassword(currentPassword, newPassword);
      setSuccess(response.message || 'Security password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col space-y-8 animate-fade-in">
      
      {/* Return to Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer mr-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 py-2 px-4 rounded-xl border border-red-500/30 bg-red-950/10 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Hero Title */}
      <div>
        <h1 className="font-display text-3xl font-extrabold text-white tracking-tight margin-0">
          Account Profile
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Review your active usage metrics, upgrade subscription slots, and control workspace credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Account Card Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main User Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6 text-center">
            {/* Avatar Mock */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-400 border border-brand-500/20 font-black text-2xl tracking-wider">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
            </div>

            <div className="inline-flex items-center space-x-1.5 rounded-full border border-purple-500/30 bg-purple-500/5 px-3 py-1 text-xs font-semibold text-purple-300">
              <Shield className="h-3.5 w-3.5" />
              <span>{user.role} Account</span>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 text-left space-y-2 text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="font-mono text-white text-[10px]">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Database Index:</span>
                <span className="text-white font-medium">Active (Local DB)</span>
              </div>
            </div>
          </div>

          {/* Subscription Slots Upgrade */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-zinc-950 p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-center space-x-2 text-purple-300">
              <CreditCard className="h-5 w-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Plan Details</h3>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-black text-white">Professional Trial</div>
              <div className="text-xs text-zinc-500">Free Sandbox Development slots</div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-normal">
              You are using a fully enabled internship testing environment. Unlimited mock requests and complete administrative control metrics are activated.
            </p>

            <button 
              disabled
              className="w-full py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold opacity-60 cursor-not-allowed"
            >
              Subscription Tier: Sandbox
            </button>
          </div>
        </div>

        {/* Right Cards: Profile Editor Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Feedback widgets */}
          {error && (
            <div className="flex items-start space-x-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-fade-in">
              <UserIcon className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start space-x-2.5 rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-400 animate-fade-in">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form 1: General Details */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-zinc-900 pb-3">
              <UserIcon className="h-5 w-5 text-brand-400" />
              <span>Profile Settings</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="profName">
                  Full Name
                </label>
                <input
                  id="profName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="profEmail">
                  Email Address
                </label>
                <input
                  id="profEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="col-span-2 flex items-center justify-center space-x-1.5 ml-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-xs font-bold text-white shadow hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Form 2: Password Security Updates */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-zinc-900 pb-3">
              <Key className="h-5 w-5 text-brand-400" />
              <span>Password & Security</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="currPass">
                    Current Password
                  </label>
                  <input
                    id="currPass"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="newPass">
                    New Password
                  </label>
                  <input
                    id="newPass"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="confPass">
                    Confirm New Password
                  </label>
                  <input
                    id="confPass"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center space-x-1.5 ml-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-xs font-bold text-white shadow hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Updating...' : 'Update Workspace Password'}</span>
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
