import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, Sparkles, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError('Please enter your email address to request a reset link.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setSuccessMsg(response.message || 'A password reset link has been dispatched to your email address.');
    } catch (err: any) {
      setError(err.message || 'Error occurred while executing password recovery workflow.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header Block */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 group mb-4">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 group-hover:bg-brand-500/20 transition-all">
              <YoutubeIcon className="h-5 w-5 text-red-500" />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-brand-300" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Video Synopsis <span className="text-brand-400">AI</span>
            </span>
          </Link>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Provide your email to generate a simulation password recovery link.
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 flex items-start space-x-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-start space-x-2.5 rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-400 animate-fade-in">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-5 w-5 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 py-3 px-4 text-sm font-bold text-white shadow-lg hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span>Request Recovery Link</span>
              )}
            </button>
          </form>

          <div className="mt-6 flex justify-between items-center text-xs">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Login</span>
            </button>
            
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
              Create a Free Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
