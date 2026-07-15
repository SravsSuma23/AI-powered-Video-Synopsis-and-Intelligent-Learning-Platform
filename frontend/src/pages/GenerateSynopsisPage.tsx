import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { synopsisService, getYouTubeId } from '../services/synopsisService';
import { Sparkles, Sliders, CheckCircle2, Loader2, ArrowLeft, Globe, FileText } from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface LoadingStep {
  label: string;
  status: 'pending' | 'loading' | 'done';
}

const GenerateSynopsisPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [outputFormat, setOutputFormat] = useState<'PDF' | 'PPT'>('PDF');

  const [language, setLanguage] = useState('English');
  const [includeSentiment, setIncludeSentiment] = useState(true);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Processing States
  const [processing, setProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { label: 'Validating YouTube URL format & permissions', status: 'pending' },
    { label: 'Connecting to YouTube API and retrieving metadata', status: 'pending' },
    { label: 'Extracting audio & pulling CC captions transcript', status: 'pending' },
    { label: 'Sanitizing text datasets & structuring token payloads', status: 'pending' },
    { label: 'Feeding token chunks into Groq AI Summarizer', status: 'pending' },
    { label: 'Generating chapter markers & sentiment analytics', status: 'pending' },
    { label: 'Compiling structured Synopsis Document', status: 'pending' }
  ]);

  const validateUrl = (value: string) => {
    if (!value) {
      setValidationError('YouTube URL cannot be blank.');
      return false;
    }
    const id = getYouTubeId(value);
    if (!id) {
      setValidationError('Invalid YouTube URL format. Enter standard watch links (e.g. youtube.com/watch?v=X or youtu.be/X). Private/restricted videos or unsupported durations will trigger errors.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (validationError) {
      const id = getYouTubeId(val);
      if (id) setValidationError(null);
    }
  };

  const executeProcessingStages = (id: string) => {
    console.log('Initiating AI Ingestion Pipeline for Video ID:', id);
    let currentStep = 0;
    setCurrentProgress(5);
    
    // Set first step as active
    setLoadingSteps(prev => 
      prev.map((step, idx) => idx === 0 ? { ...step, status: 'loading' } : step)
    );

    const stepIntervals = [800, 1000, 1200, 800, 1500, 1000, 800]; // Speed of each stage simulation
    
    const runNextStep = () => {
      if (currentStep >= loadingSteps.length) {
        return;
      }

      setTimeout(() => {
        // Mark current as done
        setLoadingSteps(prev => 
          prev.map((step, idx) => idx === currentStep ? { ...step, status: 'done' } : step)
        );

        // Calculate progress percentage
        const progressChunk = Math.ceil(100 / loadingSteps.length);
        setCurrentProgress(prev => Math.min(prev + progressChunk, 100));

        currentStep++;

        if (currentStep < loadingSteps.length) {
          // Mark next as loading
          setLoadingSteps(prev => 
            prev.map((step, idx) => idx === currentStep ? { ...step, status: 'loading' } : step)
          );
          runNextStep();
        }
      }, stepIntervals[currentStep]);
    };

    runNextStep();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) return;

    setProcessing(true);
    const youtubeId = getYouTubeId(url) || '';
    
    // Start loader UI
    executeProcessingStages(youtubeId);
    const startTime = Date.now();

    try {
      // Trigger service API
      const result = await synopsisService.generateSynopsis(url, {
        summaryLength,
        includeSentiment,
        outputFormat: outputFormat.toLowerCase() as 'web' | 'pdf' | 'ppt'
      });

      // Navigate immediately if API took longer than simulation time (7200ms)
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 7200 - elapsed);

      setTimeout(() => {
        navigate(`/synopsis/${result.id}`);
      }, remainingTime);
      
    } catch (err: any) {
      setProcessing(false);
      setValidationError(err.message || 'An error occurred during video analysis. Please check your network and try again.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col justify-center">
      
      {/* Return to Dashboard */}
      {!processing && (
        <button
          onClick={() => navigate('/dashboard')}
          className="mr-auto mb-6 flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>
      )}

      {/* Main Container Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-md">
        
        {!processing ? (
          
          /* Form View */
          <div className="space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center space-x-2 text-brand-400 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Summarizer Engine</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Synthesize YouTube Content
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Enter any valid YouTube video URL to generate a comprehensive, chapter-wise executive synopsis report.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="url">
                  YouTube Video Link
                </label>
                <div className="relative">
                  <YoutubeIcon className="absolute top-3.5 left-4 h-6 w-6 text-red-500" />
                  <input
                    id="url"
                    type="text"
                    value={url}
                    onChange={handleUrlChange}
                    onBlur={() => validateUrl(url)}
                    placeholder="https://www.youtube.com/watch?v=8pDquaF545o"
                    className={`w-full rounded-xl border bg-zinc-950/60 py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                      validationError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-zinc-800 focus:border-brand-500 focus:ring-brand-500'
                    }`}
                  />
                </div>
                {validationError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 text-xs text-red-400 font-semibold leading-relaxed animate-fade-in">
                    ⚠️ {validationError}
                  </div>
                )}
              </div>

              {/* Advanced Panel */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-6 space-y-6">
                <div className="flex items-center space-x-2 text-zinc-300 pb-2 border-b border-zinc-900">
                  <Sliders className="h-4.5 w-4.5 text-brand-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Configure Summary Settings</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option 1: Summary Length */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Target Synopsis Size
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['short', 'medium', 'long'] as const).map((len) => (
                        <button
                          key={len}
                          type="button"
                          onClick={() => setSummaryLength(len)}
                          className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all cursor-pointer ${
                            summaryLength === len
                              ? 'border-brand-500 bg-brand-500/10 text-white'
                              : 'border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 2: Output Format Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Output Format Selector</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['PDF', 'PPT'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setOutputFormat(fmt)}
                          className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            outputFormat === fmt
                              ? 'border-brand-500 bg-brand-500/10 text-white'
                              : 'border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 3: Language Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Target Translation Language</span>
                    </span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-xs text-white focus:border-brand-500 focus:outline-none cursor-pointer transition-all"
                    >
                      <option value="English">English (United States)</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="French">French (Français)</option>
                      <option value="German">German (Deutsch)</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                    </select>
                  </div>

                  {/* Option 4: NLP Toggles */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSentiment}
                        onChange={(e) => setIncludeSentiment(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="text-xs font-semibold text-zinc-300">
                        Extract Sentiment & Tonality
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeKeywords}
                        onChange={(e) => setIncludeKeywords(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="text-xs font-semibold text-zinc-300">
                        Automate Keywords Tag Indexing
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 py-4 text-base font-bold text-white shadow-xl glow-purple hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <Sparkles className="h-5 w-5" />
                <span>Trigger AI Summarization Loop</span>
              </button>
            </form>

            {/* Quick Demo Assist */}
            <div className="border-t border-zinc-800/80 pt-6">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-3">
                💡 Sandbox Practice Links (Copy & paste to try)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setUrl('https://www.youtube.com/watch?v=8pDquaF545o')}
                  className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:border-brand-500/30 hover:bg-zinc-950/80 transition-all cursor-pointer flex items-center space-x-3"
                >
                  <div className="h-8 w-12 shrink-0 bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center rounded font-extrabold text-[10px]">
                    React
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-zinc-300 truncate">React 19 Tech Deep Dive</div>
                    <div className="text-[10px] text-zinc-500">Preset demo summary loaded</div>
                  </div>
                </div>

                <div 
                  onClick={() => setUrl('https://www.youtube.com/watch?v=yR73Vz57C5w')}
                  className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:border-brand-500/30 hover:bg-zinc-950/80 transition-all cursor-pointer flex items-center space-x-3"
                >
                  <div className="h-8 w-12 shrink-0 bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center rounded font-extrabold text-[10px]">
                    AI Key
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-zinc-300 truncate">AI Agentic Workflows</div>
                    <div className="text-[10px] text-zinc-500">Preset demo summary loaded</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        ) : (
          
          /* Futuristic Loading Screen View */
          <div className="space-y-8 py-4 animate-fade-in">
            {/* Upper Header and progress bar */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 animate-spin">
                <Loader2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-white">Synthesizing Synopsis</h2>
                <p className="text-xs text-zinc-400 mt-1">Our models are processing the video signals. Please remain active.</p>
              </div>

              {/* Progress Container */}
              <div className="space-y-2 max-w-md mx-auto pt-2">
                <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-900 overflow-hidden relative">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Progress Profile</span>
                  <span className="text-brand-400">{currentProgress}%</span>
                </div>
              </div>
            </div>

            {/* Readout logs terminal */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-3 font-mono text-[11px] leading-relaxed shadow-inner">
              {loadingSteps.map((step, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start space-x-3 transition-opacity duration-300 ${
                    step.status === 'pending' ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {step.status === 'done' && (
                      <CheckCircle2 className="h-4.5 w-4.5 text-green-400" />
                    )}
                    {step.status === 'loading' && (
                      <Loader2 className="h-4.5 w-4.5 text-brand-400 animate-spin" />
                    )}
                    {step.status === 'pending' && (
                      <div className="h-4.5 w-4.5 rounded-full border border-zinc-800" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className={`font-bold ${
                      step.status === 'done' ? 'text-green-400' : step.status === 'loading' ? 'text-brand-300' : 'text-zinc-500'
                    }`}>
                      Stage {idx + 1}: {step.label}
                    </span>
                    {step.status === 'loading' && (
                      <span className="text-[10px] text-zinc-500 block animate-pulse">Running AI pipeline subprocess...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-zinc-500 text-center uppercase tracking-wide">
              ⌛ Summary generation usually completes within 5-10 seconds for demo pipelines.
            </div>
          </div>

        )}

      </div>
    </div>
  );
};

export default GenerateSynopsisPage;
