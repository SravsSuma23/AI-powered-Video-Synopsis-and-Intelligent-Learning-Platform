import React, { useState } from 'react';
import { Download, FileText, Copy, Check, Share2, Bookmark } from 'lucide-react';
import { synopsisService } from '../services/synopsisService';
import type { SynopsisData } from '../services/synopsisService';

interface DownloadButtonsProps {
  data: SynopsisData;
  onBookmarkToggle?: () => void;
}

export const DownloadButtons: React.FC<DownloadButtonsProps> = ({
  data,
  onBookmarkToggle
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloadingPPT, setDownloadingPPT] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  const format = data.outputFormat || 'web';

  const handleDownloadPPT = async () => {
    setDownloadingPPT(true);
    setDownloadError(null);
    try {
      await synopsisService.downloadPPT(data);
    } catch (err: any) {
      console.error('Failed to export PPT presentation:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Server timeout or network connection issue. Please try again.';
      setDownloadError(errMsg);
    } finally {
      setDownloadingPPT(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `
VIDEO TITLE: ${data.metadata.title}
AUTHOR/CHANNEL: ${data.metadata.channelName}
DURATION: ${data.metadata.duration}
WATCH LINK: ${data.metadata.youtubeUrl}

EXECUTIVE SYNOPSIS:
${data.executiveSummary}

KEY TOPICS:
${data.topics.map(t => `- ${t.topic}: ${t.description}`).join('\n')}

CONCLUSION:
${data.conclusion}
    `;

    navigator.clipboard.writeText(textToCopy.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    // Dynamic share link construction matching the HashRouter syntax and preserving subfolders
    const shareUrl = `${window.location.origin}${window.location.pathname}#/synopsis/${data.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">

      {/* 2. PDF Download */}
      {format === 'pdf' && (
        <button
          onClick={() => synopsisService.downloadPDF(data)}
          className="flex items-center space-x-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-xs font-bold text-white shadow-lg hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      )}

      {/* 3. PPT Download */}
      {format === 'ppt' && (
        <div className="flex flex-col items-start gap-1">
          <button
            onClick={handleDownloadPPT}
            disabled={downloadingPPT}
            className={`flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
              downloadingPPT
                ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none border border-zinc-700/50'
                : 'bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] hover:opacity-90'
            }`}
          >
            {downloadingPPT ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating professional PPT...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Download PPT</span>
              </>
            )}
          </button>
          {downloadError && (
            <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg max-w-[280px]">
              ⚠️ {downloadError}
            </div>
          )}
        </div>
      )}

      {/* 3. Save Summary Toggle */}
      {onBookmarkToggle && (
        <button
          onClick={onBookmarkToggle}
          className={`flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            data.saved
              ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'
              : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${data.saved ? 'fill-current' : ''}`} />
          <span>{data.saved ? 'Saved in Library' : 'Save Summary'}</span>
        </button>
      )}

      {/* 4. Copy Summary */}
      <button
        onClick={handleCopy}
        className="flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-zinc-850 bg-zinc-950/20 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copy Summary</span>
          </>
        )}
      </button>

      {/* 5. Share Summary */}
      <button
        onClick={handleShare}
        className="flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-zinc-850 bg-zinc-950/20 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
      >
        {shared ? (
          <>
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-green-400">Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DownloadButtons;
