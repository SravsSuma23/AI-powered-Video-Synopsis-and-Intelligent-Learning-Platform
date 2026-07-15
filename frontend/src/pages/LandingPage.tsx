import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, FileText, Cpu, BookOpen, Clock } from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen py-10">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center">
        {/* Glow Tagline */}
        <div className="mx-auto max-w-fit flex items-center space-x-1.5 rounded-full border border-brand-500/30 bg-brand-500/5 px-3 py-1.5 text-xs font-semibold text-brand-300 backdrop-blur-md mb-8 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          <span>AI-Powered YouTube Summarization Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Read Any YouTube Video In{' '}
          <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Seconds, Not Hours
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Skip the fluff. Extract metadata, retrieve transcripts, convert spoken speech to text using Whisper AI, and generate high-fidelity structured summaries instantly.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
          <Link
            to="/generate"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl glow-purple hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Zap className="h-5 w-5 fill-current" />
            <span>Generate Synopsis Now</span>
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 border border-zinc-800 px-8 py-4 text-base font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all"
          >
            <span>Sign In</span>
          </Link>
        </div>

        {/* Floating Mock Preview Card */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-md glow-purple/5 animate-float">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden">
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 px-4 py-3">
              <div className="flex space-x-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <div className="rounded-md bg-zinc-900/80 px-4 py-1 text-xs text-zinc-500 border border-zinc-800/30">
                https://youtube-synopsis-ai.vercel.app/dashboard
              </div>
              <div className="w-10" />
            </div>
            {/* App Mock Graphic */}
            <div className="grid grid-cols-1 md:grid-cols-3 h-auto sm:h-[400px] text-left text-xs text-zinc-400 font-sans">
              
              {/* Left sidebar Mock */}
              <div className="border-r border-zinc-900 bg-zinc-950/70 p-4 space-y-4 hidden md:block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  📁 Workspace Library
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 py-2 px-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse shrink-0" />
                    <span className="truncate">React 19 Deep Dive</span>
                  </div>
                  <div className="flex items-center space-x-2 py-2 px-3 rounded-lg bg-zinc-900/30 border border-zinc-850 hover:bg-zinc-900/50 hover:text-white transition-all">
                    <span className="h-2 w-2 rounded-full bg-zinc-600 shrink-0" />
                    <span className="truncate">Next.js 16 Server Actions</span>
                  </div>
                  <div className="flex items-center space-x-2 py-2 px-3 rounded-lg bg-zinc-900/30 border border-zinc-850 hover:bg-zinc-900/50 hover:text-white transition-all">
                    <span className="h-2 w-2 rounded-full bg-zinc-600 shrink-0" />
                    <span className="truncate">AI Agent Orchestrations</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-900">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    ⚡ Usage Statistics
                  </div>
                  <div className="space-y-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-850">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Monthly Limit</span>
                      <span>85% Used</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-brand-500 to-purple-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right content Mock */}
              <div className="col-span-2 p-6 flex flex-col justify-between bg-zinc-900/10 space-y-4">
                
                {/* Header Video Title info */}
                <div className="flex items-start space-x-4">
                  <div className="relative h-14 w-24 rounded-lg bg-zinc-950 overflow-hidden shrink-0 border border-zinc-800">
                    <img 
                      src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80" 
                      alt="" 
                      className="h-full w-full object-cover opacity-80"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-bold text-white tracking-widest">
                      18:45
                    </span>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">
                      JS Mastery Academy • 2.4M subscribers
                    </span>
                    <h4 className="font-bold text-white leading-tight tracking-tight text-xs sm:text-sm truncate">
                      React 19 Core Features & Updates: A Developer's Handbook
                    </h4>
                    <span className="inline-block text-[9px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                      😊 Analytical • 98% Sentiment
                    </span>
                  </div>
                </div>
                
                <div className="h-px bg-zinc-900" />
                
                {/* Executive Summary panel */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    📝 Executive Synopsis Preview
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-3">
                    React 19 introduces a revolutionary compiler that automates state dependencies, completely removing the need for manual useMemo and useCallback hooks. Additionally, the new "use" hook simplifies asynchronous promise resolution, while Server Components offer native optimizations for data fetching.
                  </p>
                </div>
                
                {/* Simulated Download button clusters */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900">
                  <div className="py-1 px-3.5 rounded-lg bg-gradient-to-r from-brand-500 to-purple-600 text-[10px] font-bold text-white shadow-lg">
                    📥 Download PDF
                  </div>
                  <div className="py-1 px-3.5 rounded-lg border border-zinc-800 bg-zinc-900 text-[10px] font-bold text-zinc-300">
                    📊 Download PPT
                  </div>
                  <div className="py-1 px-2.5 rounded-lg border border-zinc-850 bg-zinc-950/20 text-[10px] font-bold text-zinc-400">
                    📋 Copy Text
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-900 bg-zinc-950/20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Everything You Need to Streamline Video Learning
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg">
            We integrated leading-edge NLP workflows and high-fidelity parsing models to make summarizing professional content extremely simple.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-brand-500/40 hover:bg-zinc-900/50 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 mb-6 group-hover:scale-110 transition-transform">
              <YoutubeIcon className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart YouTube Retrieval</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Input any valid youtube.com or youtu.be URL. Our system validates access, fetches full video tags, thumbnails, and channel metadata instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-brand-500/40 hover:bg-zinc-900/50 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Speech-to-Text via Whisper AI</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              If the YouTube video does not provide native transcript captions, our speech processor converts the audio directly to high-fidelity text.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-brand-500/40 hover:bg-zinc-900/50 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 mb-6 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Structured AI Summaries</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Receive a comprehensive executive synopsis, chapter summaries, key findings, sentiment analysis, custom keywords, and neat action items list.
            </p>
          </div>
        </div>
      </section>

      {/* Objectives Section */}
      <section id="objectives" className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              The Mission: Empowering Smarter Document Workflows
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Professionals and students waste hundreds of hours filtering through educational videos, corporate webinars, and recorded meetings just to gather simple milestones. Video Synopsis AI solves this problem by providing standardized, quick-reading documents.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-500/20 text-brand-300 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Save 90% of Consumption Time</h4>
                  <p className="text-xs text-zinc-400">Read a structured 2-minute synopsis instead of watching a 45-minute video.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-500/20 text-brand-300 mt-1">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Better Corporate Retention</h4>
                  <p className="text-xs text-zinc-400">Convert long webinars and tech tutorials directly into searchable, readable meeting logs.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-500/20 text-brand-300 mt-1">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Downloadable synopsis Reports</h4>
                  <p className="text-xs text-zinc-400">Instantly export summaries as PDF or PPT to share with team members and partners.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphic Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-center">
                <div className="text-3xl font-extrabold text-brand-400 mb-1">10x</div>
                <div className="text-xs text-zinc-400 font-medium">Faster Video Digestion</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-center">
                <div className="text-3xl font-extrabold text-purple-400 mb-1">Whisper</div>
                <div className="text-xs text-zinc-400 font-medium">Audio Processing Engine</div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-center">
                <div className="text-3xl font-extrabold text-indigo-400 mb-1">100%</div>
                <div className="text-xs text-zinc-400 font-medium">Accurate Extracted Meta</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-center">
                <div className="text-3xl font-extrabold text-pink-400 mb-1">PDF/TXT</div>
                <div className="text-xs text-zinc-400 font-medium">Download Ready Reports</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-zinc-900 bg-zinc-950/40 rounded-3xl mb-12">
        <div className="text-center mb-10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400">Delivering Performance</h3>
          <h4 className="font-display text-2xl font-bold text-white mt-1">Our Technology Stack</h4>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-65 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-white">REACT.JS</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Frontend Framework</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-white">TAILWIND CSS</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Interface Styling</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-white">GROQ LLAMA-3</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Summarization Core</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-white">WHISPER AI</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Speech Transcription</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-white">NODE / EXPRESS</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Backend REST API</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full max-w-6xl px-4 sm:px-6 lg:px-8 mb-12 text-center rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-900/30 to-purple-950/20 p-8 sm:p-16 overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-brand-500/10 blur-[90px] -z-10" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-500/10 blur-[90px] -z-10" />
        
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Ready to Elevate Your Productivity?
        </h2>
        <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Create an account in 5 seconds. Get instant access to our YouTube summary generator and start saving precious learning time today.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center space-x-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Get Started Free</span>
        </Link>
      </section>
      
    </div>
  );
};

export default LandingPage;
