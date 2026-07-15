import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { synopsisService } from '../services/synopsisService';
import type { SynopsisData } from '../services/synopsisService';
import { assessmentService } from '../services/assessmentService';
import type { AssessmentPublic, AssessmentAttempt } from '../services/assessmentService';
import { 
  ArrowLeft, Bookmark, Download, Calendar, Clock, List, FileText, 
  Award, BarChart2, BookOpen, ExternalLink, Loader2, 
  Sparkles, Globe, ChevronDown, ChevronUp, Copy, Check, Play, Search, Briefcase,
  Send, MessageSquare, RefreshCw, Code, CheckCircle, AlertTriangle,
  X, ShieldAlert, Trophy, Timer, Target, Star, TrendingDown, TrendingUp, Zap
} from 'lucide-react';

const SynopsisViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [synopsis, setSynopsis] = useState<SynopsisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom Dashboard States
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Assessment Data States
  const [assessment, setAssessment] = useState<AssessmentPublic | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState<boolean>(true);
  const [latestPerformance, setLatestPerformance] = useState<AssessmentAttempt | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState<boolean>(false);
  
  // Answer State Collections (persisted when switching tabs)
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, boolean>>({});
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>({});
  const [saAnswers, setSaAnswers] = useState<Record<string, string>>({});
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, string>>({});
  const [caseAnswers, setCaseAnswers] = useState<Record<string, string[]>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string>>({});
  
  // Test Assessment Mode
  const [isAssessmentMode, setIsAssessmentMode] = useState<boolean>(false);
  const [testMcqAnswers, setTestMcqAnswers] = useState<Record<string, string>>({});
  const [testTfAnswers, setTestTfAnswers] = useState<Record<string, boolean>>({});
  const [testFillAnswers, setTestFillAnswers] = useState<Record<string, string>>({});
  const [testSaAnswers, setTestSaAnswers] = useState<Record<string, string>>({});
  const [testScenarioAnswers, setTestScenarioAnswers] = useState<Record<string, string>>({});
  const [testCaseAnswers, setTestCaseAnswers] = useState<Record<string, string[]>>({});
  const [testCodeAnswers, setTestCodeAnswers] = useState<Record<string, string>>({});
  
  // Submitting Indicators
  const [submittingSection, setSubmittingSection] = useState<string | null>(null);
  
  // Flashcard Indexes & Flips
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState<number>(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState<boolean>(false);
  
  // AI Chat States (existing feature)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [chatProvider, setChatProvider] = useState<'groq' | 'openai' | 'none' | null>(null);

  // PPT Export States
  const [downloadingPPT, setDownloadingPPT] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Time Tracker per section session
  const [sectionStartTimestamp, setSectionStartTimestamp] = useState<number>(Date.now());

  // Interactive UI component helpers
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);

  // ── Exam Mode States ──────────────────────────────────────────────────────
  const [examTimeLeft, setExamTimeLeft] = useState<number>(0);       // seconds remaining
  const [examStartTime, setExamStartTime] = useState<number>(0);     // epoch ms when exam started
  const [examWarningCount, setExamWarningCount] = useState<number>(0);
  const [examActiveSection, setExamActiveSection] = useState<string>('test_mcq');
  const [submittingExam, setSubmittingExam] = useState<boolean>(false);
  const [showExamConfirm, setShowExamConfirm] = useState<boolean>(false);
  const [examResults, setExamResults] = useState<any | null>(null);  // filled after submit
  const [showExamResults, setShowExamResults] = useState<boolean>(false);
  // Toast notification system
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const examTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitCalledRef = useRef(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Compute dynamic exam duration from assessment size
  const getExamDuration = useCallback((): number => {
    if (!assessment) return 20 * 60;
    const testPkg = assessment.testPackage;
    const total = (testPkg?.mcqs?.length ?? 0)
      + (testPkg?.scenarioQuestions?.length ?? 0)
      + (testPkg?.caseStudies?.length ?? 0)
      + (testPkg?.shortAnswers?.length ?? 0)
      + (testPkg?.fillBlanks?.length ?? 0)
      + (testPkg?.trueFalse?.length ?? 0)
      + (testPkg?.codingQuestions?.length ?? 0);
    if (total <= 15) return 20 * 60;   // small  → 20 min
    if (total <= 30) return 40 * 60;   // medium → 40 min
    return 60 * 60;                     // large  → 60 min
  }, [assessment]);

  // Format seconds to MM:SS
  const formatExamTimer = (secs: number): string => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const loadAssessment = async (synopsisId: string) => {
    setLoadingAssessment(true);
    try {
      const data = await assessmentService.getAssessment(synopsisId);
      setAssessment(data);
      
      // Initialize case answers arrays if empty
      const initialCases: Record<string, string[]> = {};
      const initialTestCases: Record<string, string[]> = {};
      
      const practiceCases = data.practicePackage?.caseStudies || data.caseStudies || [];
      practiceCases.forEach((c, idx) => {
        initialCases[idx] = new Array(c.questions.length).fill('');
      });
      setCaseAnswers(initialCases);

      const testCases = data.testPackage?.caseStudies || [];
      testCases.forEach((c, idx) => {
        initialTestCases[idx] = new Array(c.questions.length).fill('');
      });
      setTestCaseAnswers(initialTestCases);
    } catch (err) {
      console.error('Failed to load assessment package:', err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  const loadPerformance = async (synopsisId: string) => {
    setLoadingPerformance(true);
    try {
      const data = await assessmentService.getLatestPerformance(synopsisId);
      setLatestPerformance(data);
    } catch (err) {
      console.error('Failed to load performance report:', err);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const loadChatHistory = async (synopsisId: string) => {
    try {
      const historyData = await synopsisService.getChatHistory(synopsisId);
      if (historyData && historyData.messages && historyData.messages.length > 0) {
        const mapped = historyData.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
        setChatMessages(mapped);
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    if (id) {
      loadSynopsis(id);
      loadAssessment(id);
      loadPerformance(id);
      loadChatHistory(id);
      
      // Reset input states when loading a new video synopsis
      setMcqAnswers({});
      setTfAnswers({});
      setFillAnswers({});
      setSaAnswers({});
      setScenarioAnswers({});
      setCaseAnswers({});
      setCodeAnswers({});
      setAssignmentAnswers({});
      
      setTestMcqAnswers({});
      setTestTfAnswers({});
      setTestFillAnswers({});
      setTestSaAnswers({});
      setTestScenarioAnswers({});
      setTestCaseAnswers({});
      setTestCodeAnswers({});
      setIsAssessmentMode(false);
      
      setCurrentFlashcardIdx(0);
      setFlashcardFlipped(false);
      setChatProvider(null);
      setSearchQuery('');
      setActiveSection('overview');
      setSectionStartTimestamp(Date.now());
    }
  }, [id]);

  // Track start time on tab change
  useEffect(() => {
    setSectionStartTimestamp(Date.now());
  }, [activeSection]);

  const loadSynopsis = async (synopsisId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await synopsisService.getById(synopsisId);
      setSynopsis(data);
    } catch (err: any) {
      setError(err.message || 'Failed to locate synopsis in workspace history.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!synopsis) return;
    try {
      const updated = await synopsisService.toggleSave(synopsis.id);
      setSynopsis(updated);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleDownloadPDF = () => {
    if (synopsis) {
      synopsisService.downloadPDF(synopsis);
    }
  };

  const handleDownloadPPT = async () => {
    if (!synopsis) return;
    setDownloadingPPT(true);
    setDownloadError(null);
    try {
      await synopsisService.downloadPPT(synopsis);
    } catch (err: any) {
      console.error('Failed to export PPT presentation:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Server timeout or network connection issue. Please try again.';
      setDownloadError(errMsg);
    } finally {
      setDownloadingPPT(false);
    }
  };

  // ── Practice Section Submission Handler ─────────────────────────────────
  const handleSectionSubmit = async (section: string, answers: any) => {
    if (!assessment) return;
    setSubmittingSection(section);
    const elapsedSecs = Math.max(1, Math.round((Date.now() - sectionStartTimestamp) / 1000));
    try {
      const attempt = await assessmentService.submitSection(assessment.id, section, answers, elapsedSecs);
      setLatestPerformance(attempt);
      setChatMessages([
        {
          role: 'assistant',
          content: `Great job! I've graded your **${section.replace(/_/g, ' ').toUpperCase()}** section. Your score: **${attempt.sections[section]?.score} / ${attempt.sections[section]?.maxScore}** — Overall accuracy: **${attempt.accuracy}%**. Ask me anything about your results!`
        }
      ]);
      showToast('Section submitted and graded! Check your score below.', 'success');
    } catch (err: any) {
      console.error('Submission failed:', err);
      showToast(err.response?.data?.detail || err.message || 'Failed to submit. Please try again.', 'error');
    } finally {
      setSubmittingSection(null);
      setSectionStartTimestamp(Date.now());
    }
  };

  // ── Exam Submission Handler ───────────────────────────────────────────────
  const handleExamSubmit = async () => {
    if (!assessment || submittingExam) return;
    setShowExamConfirm(false);
    setSubmittingExam(true);
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    const timeTaken = Math.max(1, Math.round((Date.now() - examStartTime) / 1000));
    try {
      const result = await assessmentService.submitExam(assessment.id, {
        mcqAnswers: testMcqAnswers,
        fillBlankAnswers: testFillAnswers,
        trueFalseAnswers: testTfAnswers,
        scenarioAnswers: testScenarioAnswers,
        caseStudyAnswers: testCaseAnswers,
        shortAnswers: testSaAnswers,
        codingAnswers: testCodeAnswers,
        timeTaken,
        warningCount: examWarningCount,
      });
      setExamResults(result);
      setLatestPerformance(result);
      setShowExamResults(true);
      setIsAssessmentMode(false);
    } catch (err: any) {
      console.error('Exam submission failed:', err);
      showToast(err.response?.data?.detail || err.message || 'Exam submission failed. Please try again.', 'error');
    } finally {
      setSubmittingExam(false);
    }
  };

  // ── Exam Mode Effects (timer + anti-cheat) ──────────────────────────────
  useEffect(() => {
    if (!isAssessmentMode) {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
      autoSubmitCalledRef.current = false;
      return;
    }
    // Start timer
    const duration = getExamDuration();
    setExamTimeLeft(duration);
    setExamStartTime(Date.now());
    autoSubmitCalledRef.current = false;
    examTimerRef.current = setInterval(() => {
      setExamTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(examTimerRef.current!);
          if (!autoSubmitCalledRef.current) {
            autoSubmitCalledRef.current = true;
            showToast('⏰ Time is up! Auto-submitting your exam...', 'warning');
            // Delay 1s so toast shows before submit
            setTimeout(() => handleExamSubmit(), 1000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (examTimerRef.current) clearInterval(examTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssessmentMode]);

  useEffect(() => {
    if (!isAssessmentMode) return;
    const handleBlur = () => {
      setExamWarningCount(prev => {
        const next = prev + 1;
        if (next === 3) {
          showToast('⚠️ Final Warning! You have switched tabs/windows 3 times. Your exam will be monitored closely.', 'warning');
        } else if (next > 3) {
          showToast(`⚠️ Tab switch detected (${next} times). All violations are recorded.`, 'warning');
        } else {
          showToast(`⚠️ Tab switch detected (Warning ${next}/3). Stay in this window!`, 'warning');
        }
        return next;
      });
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isAssessmentMode, showToast]);

  useEffect(() => {
    if (!isAssessmentMode) return;
    const blockEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow typing inside textareas and code editors
      if (
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'INPUT' ||
        target.isContentEditable
      ) return;
      e.preventDefault();
    };
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('copy', blockEvent);
    document.addEventListener('paste', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('contextmenu', blockContextMenu);
    return () => {
      document.removeEventListener('copy', blockEvent);
      document.removeEventListener('paste', blockEvent);
      document.removeEventListener('cut', blockEvent);
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [isAssessmentMode]);

  // AI Chat Helper Call
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !id) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMessages);
    setSendingMessage(true);

    try {
      const response = await synopsisService.chat(
        id,
        userMsg,
        chatMessages
      );
      if (response.provider) {
        setChatProvider(response.provider as any);
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (err: any) {
      console.error('Failed to get chat response:', err);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: "AI service is temporarily unavailable. Please try again later." }
      ]);
      setChatProvider('none');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleQuickQuery = async (queryText: string) => {
    if (!id || sendingMessage) return;
    setChatInput('');
    
    const newMessages = [...chatMessages, { role: 'user' as const, content: queryText }];
    setChatMessages(newMessages);
    setSendingMessage(true);

    try {
      const response = await synopsisService.chat(
        id,
        queryText,
        chatMessages
      );
      if (response.provider) {
        setChatProvider(response.provider as any);
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (err: any) {
      console.error('Failed to get chat response:', err);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: "AI service is temporarily unavailable. Please try again later." }
      ]);
      setChatProvider('none');
    } finally {
      setSendingMessage(false);
    }
  };

  const timestampToSeconds = (ts: string): number => {
    const parts = ts.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const handleTimestampClick = (ts: string) => {
    if (!synopsis) return;
    const seconds = timestampToSeconds(ts);
    const videoUrl = synopsis.metadata.youtubeUrl;
    try {
      const url = new URL(videoUrl);
      url.searchParams.set('t', `${seconds}s`);
      window.open(url.toString(), '_blank');
    } catch {
      window.open(`${videoUrl}&t=${seconds}s`, '_blank');
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <>{text}</>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <mark key={i} className="bg-purple-500/30 text-purple-200 px-0.5 rounded font-medium">{part}</mark> : part
        )}
      </>
    );
  };

  // Practice tabs only — Exam mode uses its own full-screen UI
  const getAvailableSections = (): { id: string; label: string; icon: React.ComponentType<any> }[] => {
    return [
      { id: 'overview', label: 'Summary', icon: FileText },
      { id: 'notes', label: 'Study Notes', icon: BookOpen },
      { id: 'concepts', label: 'Key Concepts', icon: Sparkles },
      { id: 'flashcards', label: 'Flashcards', icon: RefreshCw },
      { id: 'mcq', label: 'MCQ Practice', icon: Award },
      { id: 'scenario', label: 'Scenario Practice', icon: Globe },
      { id: 'case_study', label: 'Case Study Practice', icon: Briefcase },
      { id: 'short_answer', label: 'Short Answer Practice', icon: List },
      { id: 'fill_blank', label: 'Fill in the Blanks Practice', icon: List },
      { id: 'true_false', label: 'True / False Practice', icon: CheckCircle },
      { id: 'coding', label: 'Coding Practice', icon: Code },
      { id: 'assignment', label: 'Assignments', icon: FileText },
      { id: 'ai_coach', label: 'AI Study Coach', icon: MessageSquare },
    ];
  };

  // Exam section navigation tabs
  const getExamSections = () => {
    if (!assessment) return [];
    const tp = assessment.testPackage;
    const secs = [
      { id: 'test_mcq', label: 'MCQs', icon: Award, count: tp?.mcqs?.length ?? 0 },
      { id: 'test_fill_blank', label: 'Fill Blanks', icon: List, count: tp?.fillBlanks?.length ?? 0 },
      { id: 'test_true_false', label: 'True/False', icon: CheckCircle, count: tp?.trueFalse?.length ?? 0 },
      { id: 'test_scenario', label: 'Scenarios', icon: Globe, count: tp?.scenarioQuestions?.length ?? 0 },
      { id: 'test_case_study', label: 'Case Studies', icon: Briefcase, count: tp?.caseStudies?.length ?? 0 },
      { id: 'test_short_answer', label: 'Short Answers', icon: FileText, count: tp?.shortAnswers?.length ?? 0 },
      { id: 'test_coding', label: 'Coding', icon: Code, count: tp?.codingQuestions?.length ?? 0 },
    ];
    return secs.filter(s => s.count > 0);
  };

  // Count total exam questions
  const getTotalExamQuestions = (): number => {
    if (!assessment?.testPackage) return 0;
    const tp = assessment.testPackage;
    return (tp.mcqs?.length ?? 0) + (tp.fillBlanks?.length ?? 0) + (tp.trueFalse?.length ?? 0)
      + (tp.scenarioQuestions?.length ?? 0) + (tp.caseStudies?.length ?? 0)
      + (tp.shortAnswers?.length ?? 0) + (tp.codingQuestions?.length ?? 0);
  };

  // Count answered questions across all exam answer states
  const getAnsweredExamCount = (): number => {
    return Object.keys(testMcqAnswers).length
      + Object.keys(testFillAnswers).length
      + Object.keys(testTfAnswers).length
      + Object.keys(testScenarioAnswers).length
      + Object.keys(testCaseAnswers).filter(k => testCaseAnswers[k]?.some(a => a.trim() !== '')).length
      + Object.keys(testSaAnswers).filter(k => testSaAnswers[k]?.trim() !== '').length
      + Object.keys(testCodeAnswers).filter(k => testCodeAnswers[k]?.trim() !== '').length;
  };

  const sectionContainsQuery = (secId: string, query: string): boolean => {
    if (!query.trim() || !synopsis) return true;
    const q = query.toLowerCase();
    
    switch (secId) {
      case 'overview':
        return (
          synopsis.executiveSummary.toLowerCase().includes(q) ||
          synopsis.conclusion.toLowerCase().includes(q)
        );
      case 'notes':
        return (
          !!synopsis.introduction?.toLowerCase().includes(q) ||
          !!synopsis.detailedExplanation?.toLowerCase().includes(q) ||
          !!synopsis.quickRevisionNotes?.toLowerCase().includes(q)
        );
      case 'concepts':
        return (
          !!synopsis.keyConcepts?.some(c => c.concept.toLowerCase().includes(q) || c.explanation.toLowerCase().includes(q)) ||
          !!synopsis.majorConcepts?.some(c => c.concept.toLowerCase().includes(q) || c.explanation.toLowerCase().includes(q))
        );
      default:
        return true;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Render content of active section
  const renderActiveSectionContent = () => {
    if (!synopsis) return null;

    if (loadingAssessment) {
      return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
          <p className="text-sm font-bold text-zinc-300">Compiling interactive assessment packages...</p>
          <p className="text-xs text-zinc-500 max-w-xs text-center font-sans">Groq AI is building flashcards, coding exercises, scenarios, and study metrics from the video transcript.</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-zinc-850 pb-3">
              <FileText className="h-5 w-5 text-brand-400" />
              <span>Video Synopsis Summary</span>
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans pt-1">
              {highlightText(synopsis.executiveSummary, searchQuery)}
            </p>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-zinc-855 pb-3">
                <BarChart2 className="h-5 w-5 text-brand-400" />
                <span>Key Subtopics Covered</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {synopsis.topics.map((t, idx) => (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-200">{highlightText(t.topic, searchQuery)}</span>
                      <span className="font-extrabold text-brand-400">{t.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-900/50 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                        style={{ width: `${t.percentage}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-tight">{highlightText(t.description, searchQuery)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2">
                System Synthesis Conclusion
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {highlightText(synopsis.conclusion, searchQuery)}
              </p>
            </div>

            {synopsis.chapters && synopsis.chapters.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-zinc-850">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Play className="h-4 w-4.5 text-brand-400" />
                  <span>Video Chapters & Interactive Timeline</span>
                </h3>
                <div className="relative border-l border-zinc-800 pl-4 ml-2 space-y-4">
                  {synopsis.chapters.map((chapter, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-6.5 top-1.5 w-4.5 h-4.5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-brand-500 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      </div>
                      
                      <button
                        onClick={() => handleTimestampClick(chapter.timestamp)}
                        className="text-left w-full bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 p-4 rounded-xl space-y-2 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                            {chapter.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-brand-500/10 border border-brand-500/25 text-brand-300 px-2 py-0.5 rounded">
                            {chapter.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                          {chapter.summary}
                        </p>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <BookOpen className="h-5 w-5 text-brand-400" />
              <span>Reference Study Notes</span>
            </h3>
            
            {synopsis.introduction && (
              <div className="bg-brand-500/5 border-l-4 border-brand-500 p-5 rounded-r-xl">
                <strong className="text-brand-305 text-xs block mb-1 font-mono uppercase tracking-widest">Introduction</strong>
                <p className="text-sm text-zinc-200 leading-relaxed italic font-sans">
                  {highlightText(synopsis.introduction, searchQuery)}
                </p>
              </div>
            )}

            <div className="bg-zinc-950/40 border border-zinc-800 p-6 rounded-xl text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-sans space-y-4">
              <strong className="text-zinc-200 text-xs block mb-2 font-mono uppercase tracking-widest border-b border-zinc-900 pb-1">Detailed Explanation Handbook</strong>
              {highlightText(synopsis.detailedExplanation || synopsis.executiveSummary, searchQuery)}
            </div>

            {synopsis.quickRevisionNotes && (
              <div className="bg-zinc-950/40 border border-zinc-800 p-6 rounded-xl text-sm text-zinc-300 leading-relaxed space-y-4 font-sans">
                <strong className="text-zinc-200 text-xs block mb-2 font-mono uppercase tracking-widest border-b border-zinc-900 pb-1">Quick Revision Sheet</strong>
                <p className="whitespace-pre-line text-xs text-zinc-400 leading-relaxed">{highlightText(synopsis.quickRevisionNotes, searchQuery)}</p>
              </div>
            )}

            {synopsis.examPreparationNotes && synopsis.examPreparationNotes.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-xl">
                <strong className="text-amber-400 text-xs block mb-2 font-mono uppercase tracking-widest">⚠️ High-Yield Exam Prep Warnings</strong>
                <ul className="space-y-2 list-disc pl-5 text-xs text-zinc-300">
                  {synopsis.examPreparationNotes.map((note, idx) => (
                    <li key={idx} className="leading-relaxed">{highlightText(note, searchQuery)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'concepts':
        const cList = synopsis.majorConcepts || synopsis.keyConcepts || [];
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-zinc-800/80 pb-3">
              <Sparkles className="h-5 w-5 text-brand-400" />
              <span>Core Theoretical Concepts</span>
            </h3>
            <div className="space-y-6">
              {cList.map((c: any, idx: number) => (
                <div 
                  key={idx} 
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 space-y-4 border-l-4 border-l-brand-500 hover:border-zinc-700 hover:bg-zinc-950/60 transition-all duration-300 animate-fade-in"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-bold bg-brand-500/10 border border-brand-500/20 text-brand-300 px-2 py-0.5 rounded">
                      Concept 0{idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {highlightText(c.concept || c.conceptName || '', searchQuery)}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {highlightText(c.explanation, searchQuery)}
                  </p>

                  {/* Subtopics */}
                  {c.subtopics && c.subtopics.length > 0 && (
                    <div className="pt-3 border-t border-zinc-900/60 space-y-2">
                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider font-mono">Subtopics</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {c.subtopics.map((st: any, sIdx: number) => (
                          <div key={sIdx} className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg">
                            <strong className="text-xs text-zinc-200 block mb-0.5">{highlightText(st.title, searchQuery)}</strong>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{highlightText(st.explanation, searchQuery)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Definitions */}
                  {c.definitions && c.definitions.length > 0 && (
                    <div className="pt-3 border-t border-zinc-900/60 space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Glossary terms</span>
                      <ul className="list-disc pl-4 text-xs text-zinc-300 space-y-1">
                        {c.definitions.map((d: any, dIdx: number) => (
                          <li key={dIdx}>
                            <strong className="text-zinc-250 font-bold">{highlightText(d.term, searchQuery)}:</strong>{' '}
                            <span className="text-zinc-400">{highlightText(d.definition, searchQuery)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {c.examples && c.examples.length > 0 && (
                    <div className="pt-3 border-t border-zinc-900/60 space-y-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Examples</span>
                      {c.examples.map((ex: any, eIdx: number) => (
                        <div key={eIdx} className="bg-emerald-500/5 border-l-2 border-emerald-500 p-3 rounded-r-lg">
                          <strong className="text-xs text-emerald-300 block mb-0.5">{highlightText(ex.example, searchQuery)}</strong>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{highlightText(ex.description, searchQuery)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulas */}
                  {c.formulas && c.formulas.length > 0 && (
                    <div className="pt-3 border-t border-zinc-900/60 space-y-2">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">Equations</span>
                      <div className="grid grid-cols-1 gap-2">
                        {c.formulas.map((form: any, fIdx: number) => (
                          <div key={fIdx} className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg flex items-center gap-3">
                            <code className="text-xs font-mono font-bold text-amber-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {form.formula}
                            </code>
                            <span className="text-[11px] text-zinc-400">{highlightText(form.explanation, searchQuery)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {synopsis.faq && synopsis.faq.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-zinc-850">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-brand-400" />
                  <span>Frequently Asked Questions (FAQ)</span>
                </h3>
                <div className="space-y-3">
                  {synopsis.faq.map((item, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div key={idx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white hover:bg-zinc-900/40 transition-colors cursor-pointer"
                        >
                          <span>{item.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="p-4 pt-0 border-t border-zinc-900/60 text-xs text-zinc-400 leading-relaxed font-sans animate-fade-in">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'flashcards':
        const cards = assessment?.flashcards || [];
        if (cards.length === 0) {
          return <div className="text-center py-20 text-zinc-500">No Flashcards generated.</div>;
        }
        const activeCard = cards[currentFlashcardIdx];
        
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <RefreshCw className="h-5 w-5 text-brand-400" />
              <span>Interactive Active Recall Flashcards</span>
            </h3>
            <p className="text-xs text-zinc-500 font-sans">Click on the card below to flip it and reveal the explanation. Use controls to navigate.</p>

            {/* Flashcard Flippable Container */}
            <div className="flex justify-center py-8">
              <div 
                onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                className="w-full max-w-md h-64 perspective-1000 cursor-pointer"
              >
                <div 
                  className={`w-full h-full duration-500 transform-style-3d relative rounded-2xl border ${
                    flashcardFlipped 
                      ? 'rotate-y-180 border-brand-500 bg-brand-950/20 shadow-lg shadow-brand-500/5' 
                      : 'border-zinc-800 bg-zinc-950/60 shadow-xl'
                  }`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest font-mono">Question / Concept</span>
                    <p className="text-sm font-bold text-white leading-relaxed">{activeCard?.question}</p>
                    <span className="text-[10px] text-zinc-550 italic font-sans pt-2">Click to flip card</span>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Answer / Definition</span>
                    <p className="text-xs font-semibold text-zinc-300 leading-relaxed font-sans">{activeCard?.answer}</p>
                    <span className="text-[10px] text-zinc-550 italic font-sans pt-2">Click to flip back</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between max-w-md mx-auto">
              <button
                onClick={() => {
                  setFlashcardFlipped(false);
                  setCurrentFlashcardIdx(prev => Math.max(0, prev - 1));
                }}
                disabled={currentFlashcardIdx === 0}
                className="py-2 px-5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl disabled:opacity-30 cursor-pointer transition-all"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-500 font-mono font-bold">
                Card {currentFlashcardIdx + 1} of {cards.length}
              </span>
              <button
                onClick={() => {
                  setFlashcardFlipped(false);
                  setCurrentFlashcardIdx(prev => Math.min(cards.length - 1, prev + 1));
                }}
                disabled={currentFlashcardIdx === cards.length - 1}
                className="py-2 px-5 bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white rounded-xl disabled:opacity-30 cursor-pointer transition-all"
              >
                Next
              </button>
            </div>
          </div>
        );

      case 'mcq':
      case 'test_mcq': {
        const isTest = activeSection === 'test_mcq';
        const mcqs = isTest 
          ? (assessment?.testPackage?.mcqs || []) 
          : (assessment?.practicePackage?.mcqs || assessment?.mcqs || []);
        
        const isSubmitted = !!latestPerformance?.sections?.[activeSection];
        const answersState = isTest ? testMcqAnswers : mcqAnswers;
        const setAnswersState = isTest ? setTestMcqAnswers : setMcqAnswers;
        
        if (mcqs.length === 0) {
          return <div className="text-center py-20 text-zinc-500">No MCQs generated.</div>;
        }

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="h-5 w-5 text-brand-400" />
                <span>{isTest ? 'Assessment MCQ Exam' : 'Interactive MCQ Practice'}</span>
              </h3>
              {isSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  Score: {latestPerformance.sections[activeSection]?.score} / {latestPerformance.sections[activeSection]?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {mcqs.map((m, idx) => {
                const selected = answersState[idx];
                const isGraded = isSubmitted;
                const gradedItem = latestPerformance?.sections?.[activeSection]?.gradedQuestions?.[idx];
                
                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-800/85 rounded-xl p-5 space-y-4">
                    <div className="text-sm font-bold text-white flex items-start space-x-2">
                      <span className="text-xs font-mono text-zinc-550 mt-0.5">Q0{idx + 1}.</span>
                      <span className="leading-relaxed">{m.question}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {m.options.map((opt, oIdx) => {
                        const isSelected = selected === opt || gradedItem?.studentAnswer === opt;
                        const isCorrect = gradedItem?.correctAnswer === opt;
                        
                        let optionClass = "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200";
                        if (isGraded) {
                          if (isCorrect) {
                            optionClass = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
                          } else if (isSelected) {
                            optionClass = "border-red-500/40 bg-red-500/10 text-red-300";
                          }
                        } else if (isSelected) {
                          optionClass = "border-brand-500 bg-brand-500/10 text-brand-300";
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => setAnswersState(prev => ({ ...prev, [idx]: opt }))}
                            disabled={isGraded}
                            className={`w-full flex items-center space-x-3 text-left p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${optionClass}`}
                          >
                            <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${
                              isGraded && isCorrect
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : isGraded && isSelected
                                ? 'bg-red-500/20 border-red-500 text-red-300'
                                : isSelected
                                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                            }`}>
                              {['A', 'B', 'C', 'D'][oIdx]}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest font-mono block">Feedback & Explanation</span>
                        <p className="text-zinc-400 font-sans leading-relaxed">{gradedItem.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit(activeSection, answersState)}
                  disabled={submittingSection === activeSection || Object.keys(answersState).length < mcqs.length}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === activeSection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Grading MCQ responses...</span>
                    </>
                  ) : (
                    <span>Submit MCQ Section</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (window.confirm("Retake this section? Previous scores will be cleared on submit.")) {
                      setAnswersState({});
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs[activeSection];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake MCQ Section
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'scenario':
      case 'test_scenario': {
        const isTest = activeSection === 'test_scenario';
        const scs = isTest 
          ? (assessment?.testPackage?.scenarioQuestions || []) 
          : (assessment?.practicePackage?.scenarioQuestions || assessment?.scenarioQuestions || []);
        
        const isSubmitted = !!latestPerformance?.sections?.[activeSection];
        const answersState = isTest ? testScenarioAnswers : scenarioAnswers;
        const setAnswersState = isTest ? setTestScenarioAnswers : setScenarioAnswers;

        if (scs.length === 0) {
          return <div className="text-center py-20 text-zinc-500">No Scenarios generated.</div>;
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Globe className="h-5 w-5 text-brand-400" />
                <span>{isTest ? 'Assessment Scenario Questions' : 'Scenario Practice Questions'}</span>
              </h3>
              {isSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  AI Score: {latestPerformance.sections[activeSection]?.score} / {latestPerformance.sections[activeSection]?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {scs.map((s, idx) => {
                const isGraded = isSubmitted;
                const gradedItem = latestPerformance?.sections?.[activeSection]?.gradedQuestions?.[idx];

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-5 border-l-4 border-l-brand-500 space-y-4">
                    <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-1">
                      <strong className="text-[10px] font-bold text-brand-400 uppercase tracking-widest font-mono">Scenario Description</strong>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{s.scenario}</p>
                    </div>

                    <div className="text-sm font-bold text-white flex items-start space-x-2">
                      <span className="text-xs font-mono text-zinc-550 mt-0.5">Q0{idx + 1}.</span>
                      <span className="leading-relaxed">{s.question}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Your Explanation</label>
                      <textarea
                        disabled={isGraded}
                        placeholder="Write your analytical solution using concept points from the video..."
                        value={answersState[idx] || ''}
                        onChange={(e) => setAnswersState(prev => ({ ...prev, [idx]: e.target.value }))}
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-4 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all h-28 leading-relaxed resize-none disabled:opacity-60"
                      />
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3 text-xs animate-fade-in">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">AI Evaluation Feedback</span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            Awarded: {gradedItem.score} / {gradedItem.maxScore}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-sans italic">"{gradedItem.feedback}"</p>
                        <div className="pt-2">
                          <strong className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block mb-1">Model Ideal Answer</strong>
                          <p className="text-zinc-555 leading-relaxed font-sans">{gradedItem.modelAnswer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit(activeSection, answersState)}
                  disabled={submittingSection === activeSection || scs.some((_, i) => !answersState[i]?.trim())}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === activeSection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>AI Evaluator grading answers...</span>
                    </>
                  ) : (
                    <span>Submit Scenario Answers</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Retake this section? Previous submissions will be cleared.")) {
                      setAnswersState({});
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs[activeSection];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake Scenario Section
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'case_study':
      case 'test_case_study': {
        const isTest = activeSection === 'test_case_study';
        const csList = isTest 
          ? (assessment?.testPackage?.caseStudies || []) 
          : (assessment?.practicePackage?.caseStudies || assessment?.caseStudies || []);
        
        const isSubmitted = !!latestPerformance?.sections?.[activeSection];
        const answersState = isTest ? testCaseAnswers : caseAnswers;
        const setAnswersState = isTest ? setTestCaseAnswers : setCaseAnswers;

        if (csList.length === 0) {
          return <div className="text-center py-20 text-zinc-500">No Case Studies generated.</div>;
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-brand-400" />
                <span>{isTest ? 'Assessment Case Studies' : 'Practice Case Studies'}</span>
              </h3>
              {isSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  AI Score: {latestPerformance.sections[activeSection]?.score} / {latestPerformance.sections[activeSection]?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {csList.map((cs, idx) => {
                const isGraded = isSubmitted;
                const gradedItem = latestPerformance?.sections?.[activeSection]?.gradedQuestions?.[idx];

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-5 border-l-4 border-l-purple-500 space-y-4 animate-fade-in">
                    <h4 className="text-base font-bold text-white font-display border-b border-zinc-900 pb-2">Case Study: {cs.title}</h4>
                    <div className="bg-zinc-900/60 p-5 rounded-lg border border-zinc-850 space-y-1">
                      <strong className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Case Context</strong>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">{cs.caseText}</p>
                    </div>

                    <div className="space-y-4">
                      {cs.questions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-2 pl-4 border-l border-zinc-800">
                          <strong className="text-xs text-zinc-200 block">Question {qIdx + 1}: {q}</strong>
                          <textarea
                            disabled={isGraded}
                            placeholder="Type your response analysis..."
                            value={answersState[idx]?.[qIdx] || ''}
                            onChange={(e) => {
                              const newAns = { ...answersState };
                              if (!newAns[idx]) {
                                newAns[idx] = new Array(cs.questions.length).fill('');
                              }
                              newAns[idx][qIdx] = e.target.value;
                              setAnswersState(newAns);
                            }}
                            className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-4 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all h-24 leading-relaxed resize-none disabled:opacity-60"
                          />
                        </div>
                      ))}
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3 text-xs">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">AI Evaluation Report</span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            Awarded: {gradedItem.score} / {gradedItem.maxScore}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-sans italic">"{gradedItem.feedback}"</p>
                        <div className="pt-2">
                          <strong className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block mb-1">Model reference notes</strong>
                          <p className="text-zinc-550 leading-relaxed font-sans whitespace-pre-line">{gradedItem.modelAnswer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit(activeSection, answersState)}
                  disabled={submittingSection === activeSection || csList.some((_, i) => !answersState[i] || answersState[i].some(ans => !ans.trim()))}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === activeSection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>AI Evaluator grading case answers...</span>
                    </>
                  ) : (
                    <span>Submit Case Study Answers</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Retake Case Study? Previous submissions will be cleared.")) {
                      const resetCases: Record<string, string[]> = {};
                      csList.forEach((c, idx) => {
                        resetCases[idx] = new Array(c.questions.length).fill('');
                      });
                      setAnswersState(resetCases);
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs[activeSection];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake Case Study Section
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'short_answer':
      case 'test_short_answer': {
        const isTest = activeSection === 'test_short_answer';
        const sas = isTest 
          ? (assessment?.testPackage?.shortAnswers || []) 
          : (assessment?.practicePackage?.shortAnswers || assessment?.shortAnswers || []);
        
        const isSubmitted = !!latestPerformance?.sections?.[activeSection];
        const answersState = isTest ? testSaAnswers : saAnswers;
        const setAnswersState = isTest ? setTestSaAnswers : setSaAnswers;

        if (sas.length === 0) {
          return <div className="text-center py-20 text-zinc-500">No Short Answers generated.</div>;
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <List className="h-5 w-5 text-brand-400" />
                <span>{isTest ? 'Assessment Short Answers' : 'Practice Short Answers'}</span>
              </h3>
              {isSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  AI Score: {latestPerformance.sections[activeSection]?.score} / {latestPerformance.sections[activeSection]?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {sas.map((s, idx) => {
                const isGraded = isSubmitted;
                const gradedItem = latestPerformance?.sections?.[activeSection]?.gradedQuestions?.[idx];

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-5 border-l-4 border-l-purple-400 space-y-3">
                    <div className="text-sm font-bold text-white flex items-start space-x-2">
                      <span className="text-xs font-mono text-zinc-550 mt-0.5">Q0{idx + 1}.</span>
                      <span className="leading-relaxed">{s.question}</span>
                    </div>

                    <div className="space-y-1">
                      <textarea
                        disabled={isGraded}
                        placeholder="Provide your detailed explanation in 80-100 words..."
                        value={answersState[idx] || ''}
                        onChange={(e) => setAnswersState(prev => ({ ...prev, [idx]: e.target.value }))}
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-4 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all h-24 leading-relaxed resize-none disabled:opacity-60"
                      />
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3 text-xs">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">AI Evaluation Feedback</span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            Awarded: {gradedItem.score} / {gradedItem.maxScore}
                          </span>
                        </div>
                        <p className="text-zinc-305 leading-relaxed font-sans italic font-medium">"{gradedItem.feedback}"</p>
                        <div className="pt-2">
                          <strong className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block mb-1">Model Ideal Answer</strong>
                          <p className="text-zinc-550 leading-relaxed font-sans">{gradedItem.modelAnswer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit(activeSection, answersState)}
                  disabled={submittingSection === activeSection || sas.some((_, i) => !answersState[i]?.trim())}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === activeSection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>AI Evaluator grading answers...</span>
                    </>
                  ) : (
                    <span>Submit Short Answers</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Retake Short Answer section? Previous submissions will be cleared.")) {
                      setAnswersState({});
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs[activeSection];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake Short Answer Section
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'fill_blank':
      case 'test_fill_blank': {
        const isTest = activeSection === 'test_fill_blank';
        const fbs = isTest 
          ? (assessment?.testPackage?.fillBlanks || []) 
          : (assessment?.practicePackage?.fillBlanks || assessment?.fillBlanks || []);
        
        const isSubmitted = !!latestPerformance?.sections?.[activeSection];
        const answersState = isTest ? testFillAnswers : fillAnswers;
        const setAnswersState = isTest ? setTestFillAnswers : setFillAnswers;

        if (fbs.length === 0) {
          return <div className="text-center py-20 text-zinc-500">No Fill in the Blanks generated.</div>;
        }

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <List className="h-5 w-5 text-brand-400" />
                <span>{isTest ? 'Assessment Fill in the Blanks' : 'Practice Fill in the Blanks'}</span>
              </h3>
              {isSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  Score: {latestPerformance.sections[activeSection]?.score} / {latestPerformance.sections[activeSection]?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {fbs.map((f, idx) => {
                const isGraded = isSubmitted;
                const gradedItem = latestPerformance?.sections?.[activeSection]?.gradedQuestions?.[idx];
                
                // Split sentence around three underscores ___
                const parts = f.sentence.split('___');

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-800/85 rounded-xl p-5 space-y-3">
                    <div className="text-sm font-semibold text-white leading-relaxed flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-zinc-550 shrink-0">0{idx + 1}.</span>
                      <span>{parts[0]}</span>
                      <input
                        type="text"
                        disabled={isGraded}
                        placeholder="..."
                        value={answersState[idx] || (isGraded ? gradedItem?.studentAnswer : '')}
                        onChange={(e) => setAnswersState(prev => ({ ...prev, [idx]: e.target.value }))}
                        className={`bg-zinc-950 border text-xs px-3 py-1 rounded-lg text-center font-bold focus:outline-none transition-all w-40 ${
                          isGraded
                            ? gradedItem?.isCorrect
                              ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5'
                              : 'border-red-500/50 text-red-400 bg-red-500/5'
                            : 'border-zinc-800 focus:border-brand-500'
                        }`}
                      />
                      <span>{parts[1]}</span>
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[9px] font-bold font-mono">CORRECT TERM:</span>
                          <strong className="text-emerald-400">{gradedItem.correctAnswer}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-550 block text-[9px] font-bold font-mono">EXPLANATION:</span>
                          <span className="text-zinc-400 font-sans">{gradedItem.feedback}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit(activeSection, answersState)}
                  disabled={submittingSection === activeSection || fbs.some((_, i) => !answersState[i]?.trim())}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === activeSection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Grading fill inputs...</span>
                    </>
                  ) : (
                    <span>Submit Fill-in-the-Blank Answers</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Retake this section? Previous scores will be cleared.")) {
                      setAnswersState({});
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs[activeSection];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake Fill Blanks
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'true_false':
      case 'test_true_false': {
        const isTest = activeSection === 'test_true_false';
        const tfs = isTest 
          ? (assessment?.testPackage?.trueFalse || []) 
          : (assessment?.practicePackage?.trueFalse || assessment?.trueFalse || []);
        
        const isSubmitted = !!latestPerformance?.sections?.[activeSection];
        const answersState = isTest ? testTfAnswers : tfAnswers;
        const setAnswersState = isTest ? setTestTfAnswers : setTfAnswers;

        if (tfs.length === 0) {
          return <div className="text-center py-20 text-zinc-500">No True / False questions generated.</div>;
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-brand-400" />
                <span>{isTest ? 'Assessment True / False' : 'Practice True / False'}</span>
              </h3>
              {isSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  Score: {latestPerformance.sections[activeSection]?.score} / {latestPerformance.sections[activeSection]?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {tfs.map((t, idx) => {
                const selected = answersState[idx];
                const isGraded = isSubmitted;
                const gradedItem = latestPerformance?.sections?.[activeSection]?.gradedQuestions?.[idx];

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-5 space-y-4 animate-fade-in">
                    <div className="text-sm font-bold text-white flex items-start space-x-2">
                      <span className="text-xs font-mono text-zinc-550 mt-0.5">Q0{idx + 1}.</span>
                      <span className="leading-relaxed">{t.statement}</span>
                    </div>

                    <div className="flex gap-4">
                      {/* True Button */}
                      <button
                        disabled={isGraded}
                        onClick={() => setAnswersState(prev => ({ ...prev, [idx]: true }))}
                        className={`px-6 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selected === true || (isGraded && gradedItem?.studentAnswer === "True")
                            ? isGraded
                              ? gradedItem?.correctAnswer === "True"
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                : 'border-red-500/50 bg-red-500/10 text-red-300'
                              : 'border-brand-500 bg-brand-500/10 text-brand-300'
                            : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        True
                      </button>

                      {/* False Button */}
                      <button
                        disabled={isGraded}
                        onClick={() => setAnswersState(prev => ({ ...prev, [idx]: false }))}
                        className={`px-6 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selected === false || (isGraded && gradedItem?.studentAnswer === "False")
                            ? isGraded
                              ? gradedItem?.correctAnswer === "False"
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                : 'border-red-500/50 bg-red-500/10 text-red-300'
                              : 'border-brand-500 bg-brand-500/10 text-brand-300'
                            : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        False
                      </button>
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest font-mono block">Feedback & Explanation</span>
                        <p className="text-zinc-400 font-sans leading-relaxed">{gradedItem.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit(activeSection, answersState)}
                  disabled={submittingSection === activeSection || tfs.some((_, i) => answersState[i] === undefined)}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === activeSection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Grading True/False options...</span>
                    </>
                  ) : (
                    <span>Submit True/False</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Retake this section? Previous scores will be cleared.")) {
                      setAnswersState({});
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs[activeSection];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake True/False Section
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'coding':
      case 'test_coding': {
        const isTest = activeSection === 'test_coding';
        const codings = isTest 
          ? (assessment?.testPackage?.codingQuestions || []) 
          : (assessment?.practicePackage?.codingQuestions || assessment?.codingQuestions || []);
        
        const isSubmitted = !!latestPerformance?.sections?.[activeSection];
        const answersState = isTest ? testCodeAnswers : codeAnswers;
        const setAnswersState = isTest ? setTestCodeAnswers : setCodeAnswers;

        if (codings.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <CheckCircle className="h-10 w-10 text-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-white">Coding Practice Not Required</h3>
              <p className="text-xs text-zinc-450 max-w-sm leading-relaxed font-sans font-medium">
                This video does not contain programming, software syntax, or algorithmic topics. Excellent job, coding practice is waived for this lecture!
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Code className="h-5 w-5 text-brand-400" />
                <span>{isTest ? 'Assessment Coding Workspace' : 'Practice Coding Workspace'}</span>
              </h3>
              {isSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  AI Grade: {latestPerformance.sections[activeSection]?.score} / {latestPerformance.sections[activeSection]?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {codings.map((c, idx) => {
                const isGraded = isSubmitted;
                const gradedItem = latestPerformance?.sections?.[activeSection]?.gradedQuestions?.[idx];

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-5 border-l-4 border-l-indigo-500 space-y-4 animate-fade-in">
                    <h4 className="text-sm font-bold text-white">{c.title}</h4>
                    <p className="text-xs text-zinc-350 leading-relaxed font-sans">{c.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono bg-zinc-950/80 p-3 rounded-lg border border-zinc-900">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-550 block">SAMPLE INPUT:</span>
                        <code>{c.sampleInput}</code>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-zinc-555 block">EXPECTED OUTPUT:</span>
                        <code>{c.sampleOutput}</code>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">Code Editor</label>
                      <textarea
                        disabled={isGraded}
                        placeholder={c.starterCode}
                        value={answersState[idx] !== undefined ? answersState[idx] : c.starterCode}
                        onChange={(e) => setAnswersState(prev => ({ ...prev, [idx]: e.target.value }))}
                        className="w-full bg-zinc-950/90 border border-zinc-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-4 font-mono text-xs text-brand-300 placeholder-zinc-700 focus:outline-none transition-all h-40 leading-relaxed resize-y disabled:opacity-60"
                      />
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3 text-xs font-sans">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">AI Code Review</span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            Score: {gradedItem.score} / {gradedItem.maxScore}
                          </span>
                        </div>
                        <p className="text-zinc-305 leading-relaxed italic">"{gradedItem.feedback}"</p>
                        
                        <div className="pt-2">
                          <strong className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block mb-1 font-mono">Reference Solution Code</strong>
                          <pre className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                            {gradedItem.modelAnswer}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit(activeSection, answersState)}
                  disabled={submittingSection === activeSection || codings.some((_, i) => !answersState[i]?.trim())}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === activeSection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>AI Compiler inspecting code logic...</span>
                    </>
                  ) : (
                    <span>Submit Code Challenge</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Retake coding challenges? Previous entries will be cleared.")) {
                      setAnswersState({});
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs[activeSection];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake Coding challenges
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'assignment': {
        const asgs = assessment?.assignments || [];
        const isAsgSubmitted = !!latestPerformance?.sections?.['assignment'];

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-brand-400" />
                <span>Hands-On Assignments Tasks</span>
              </h3>
              {isAsgSubmitted && (
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  AI Grade: {latestPerformance.sections['assignment']?.score} / {latestPerformance.sections['assignment']?.maxScore}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {asgs.map((a, idx) => {
                const isGraded = isAsgSubmitted;
                const gradedItem = latestPerformance?.sections?.['assignment']?.gradedQuestions?.[idx];

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-5 border-l-4 border-l-purple-500 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white">{a.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                        a.difficulty === 'Beginner' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
                          : a.difficulty === 'Advanced'
                          ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                      }`}>
                        {a.difficulty} Level
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{a.description}</p>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Deliverables Checklist</span>
                      <ul className="list-disc pl-5 text-xs text-zinc-350 space-y-0.5">
                        {a.deliverables.map((del, i) => (
                          <li key={i}>{del}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">Your Submission Notes / Solutions</label>
                      <textarea
                        disabled={isGraded}
                        placeholder="Detail how you implemented the deliverables. Provide configurations or code outline details..."
                        value={assignmentAnswers[idx] || ''}
                        onChange={(e) => setAssignmentAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-4 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all h-28 leading-relaxed resize-none disabled:opacity-60"
                      />
                    </div>

                    {isGraded && gradedItem && (
                      <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">AI Assignment Review</span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            Graded: {gradedItem.score} / {gradedItem.maxScore}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-sans italic">"{gradedItem.feedback}"</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isAsgSubmitted ? (
                <button
                  onClick={() => handleSectionSubmit('assignment', assignmentAnswers)}
                  disabled={submittingSection === 'assignment' || asgs.some((_, i) => !assignmentAnswers[i]?.trim())}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.01] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingSection === 'assignment' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>AI Evaluator review assignment specifications...</span>
                    </>
                  ) : (
                    <span>Submit Assignments Review</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Retake Assignment submission? Previous reviews will be cleared.")) {
                      setAssignmentAnswers({});
                      setLatestPerformance(prev => {
                        if (!prev) return null;
                        const newSecs = { ...prev.sections };
                        delete newSecs['assignment'];
                        return { ...prev, sections: newSecs };
                      });
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Retake Assignments Section
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'performance':
        if (loadingPerformance) {
          return (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            </div>
          );
        }
        if (!latestPerformance || latestPerformance.maxScore === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-amber-400 animate-pulse" />
              <h3 className="text-base font-bold text-zinc-300">No Assessment Attempts Found</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-sans font-medium">
                Complete and submit any interactive assessment section (e.g. MCQ, Short Answer, True/False) to compile your Performance Report card!
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <BarChart2 className="h-5 w-5 text-brand-400" />
              <span>Student Performance Analytics Report</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Score Circular Dial */}
              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative w-24 h-24 rounded-full border-4 border-brand-500/20 flex items-center justify-center font-display text-xl font-black text-white shrink-0 bg-brand-500/5">
                  <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-brand-500 border-b-brand-500 border-l-transparent pointer-events-none" />
                  <span>{latestPerformance.accuracy}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-400 tracking-wider uppercase font-mono block">Overall Accuracy</span>
                  <h4 className="text-sm font-bold text-white mt-1">{latestPerformance.overallScore} / {latestPerformance.maxScore} Marks</h4>
                </div>
              </div>

              {/* Time taken card */}
              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                <Clock className="h-10 w-10 text-purple-400 animate-pulse" />
                <div>
                  <span className="text-[10px] font-bold text-purple-400 tracking-wider uppercase font-mono block">Cumulative In-App Time</span>
                  <h4 className="text-lg font-bold text-white mt-1">{formatTime(latestPerformance.timeTaken)}</h4>
                </div>
              </div>

              {/* Feedback paragraph */}
              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-center space-y-2">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Study Coach Feedback</span>
                </span>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans italic">
                  "{latestPerformance.feedback}"
                </p>
              </div>
            </div>

            {/* Weak Topic Detection section (Integrated directly inside Performance tab) */}
            <div className="bg-zinc-950/20 border border-zinc-805 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-zinc-850 pb-2">
                <List className="h-4.5 w-4.5 text-brand-400" />
                <span>Weak Topic Analysis (Concept Mapping)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">{"Strong Concepts (>=70% Score)"}</span>

                  <ul className="space-y-1 list-disc pl-4 text-xs text-zinc-300 font-sans font-medium">
                    {latestPerformance.strongTopics.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                    {latestPerformance.strongTopics.length === 0 && <li className="text-zinc-550 italic list-none">None identified yet</li>}
                  </ul>
                </div>
                <div className="space-y-2 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono">Weak Concepts (&lt;70% or Incorrect answers)</span>
                  <ul className="space-y-1 list-disc pl-4 text-xs text-zinc-300 font-sans font-medium">
                    {latestPerformance.weakTopics.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                    {latestPerformance.weakTopics.length === 0 && <li className="text-zinc-550 italic list-none">None identified</li>}
                  </ul>
                </div>
              </div>

              {latestPerformance.recommendedRevisionSections && latestPerformance.recommendedRevisionSections.length > 0 && (
                <div className="bg-zinc-900/20 p-4 rounded-xl border border-zinc-850 space-y-1.5 text-xs text-zinc-400 leading-relaxed font-sans">
                  <strong className="text-zinc-200 block">Recommended Revision Sections:</strong>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {latestPerformance.recommendedRevisionSections.map((sec, i) => (
                      <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-brand-300 border border-zinc-800 font-mono">
                        Revise: {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'study_plan':
        if (loadingPerformance) {
          return (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            </div>
          );
        }
        if (!latestPerformance || !latestPerformance.studyPlan) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-amber-400 animate-pulse" />
              <h3 className="text-base font-bold text-zinc-300">No Personalized Study Plan</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-sans font-medium">
                Complete and submit any interactive assessment section (e.g. MCQ, Short Answer) to generate a customized revision roadmap and practice exercises!
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <Sparkles className="h-5 w-5 text-brand-400" />
              <span>Personalized Study & Revision Roadmap</span>
            </h3>

            <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-brand-500/20 p-6 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest font-mono block">AI Guided Roadmap Instructions</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(latestPerformance.studyPlan);
                    setCopiedPlan(true);
                    setTimeout(() => setCopiedPlan(false), 2000);
                  }}
                  className="flex items-center space-x-1.5 py-1 px-2.5 bg-zinc-900 hover:bg-zinc-805 text-zinc-450 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-zinc-800/80"
                  title="Copy study plan to clipboard"
                >
                  {copiedPlan ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Plan</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans pt-1">
                {latestPerformance.studyPlan}
              </p>
            </div>

            {/* Extra Practice questions */}
            {latestPerformance.extraPracticeQuestions && latestPerformance.extraPracticeQuestions.length > 0 && (
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-zinc-850 pb-2">
                  <Award className="h-4.5 w-4.5 text-brand-400" />
                  <span>Custom Practice Challenges (For Weak Topics)</span>
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {latestPerformance.extraPracticeQuestions.map((eq, idx) => (
                    <div key={idx} className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-5 border-l-4 border-l-amber-500 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded font-mono uppercase">
                          Target Weakness: {eq.topic}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider font-mono">
                          Type: {eq.type || 'short_answer'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-bold leading-relaxed font-display mt-2">{eq.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-10 w-10 text-brand-400 animate-spin" />
        <span className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Formatting AI study guides...</span>
      </div>
    );
  }

  if (error || !synopsis) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-6">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Synopsis Not Found</h2>
        <p className="text-zinc-400 text-sm mb-8">{error || "The synopsis requested doesn't exist in your storage."}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-xl bg-zinc-900 border border-zinc-800 px-6 py-3 text-sm font-bold text-zinc-300 hover:text-white cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Get matching tabs based on query filter
  const visibleSecs = getAvailableSections().filter(sec => 
    sectionContainsQuery(sec.id, searchQuery)
  );

  // ── Exam Results Page ─────────────────────────────────────────────────────
  if (showExamResults && examResults) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow flex flex-col space-y-6 animate-fade-in">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border animate-fade-in ${
            toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300' :
            toast.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-300' :
            toast.type === 'warning' ? 'bg-amber-900/90 border-amber-500/30 text-amber-300' :
            'bg-zinc-900/95 border-zinc-700 text-zinc-200'
          }`}>
            {toast.type === 'success' && <Check className="h-4 w-4" />}
            {toast.type === 'error' && <X className="h-4 w-4" />}
            {toast.type === 'warning' && <ShieldAlert className="h-4 w-4" />}
            {toast.type === 'info' && <Sparkles className="h-4 w-4" />}
            <span>{toast.msg}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => { setShowExamResults(false); setExamResults(null); navigate('/dashboard'); }}
            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" /><span>Back to Dashboard</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest">Exam Results Report</span>
        </div>

        {/* Score Hero */}
        <div className="rounded-3xl border border-brand-500/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#27272a" strokeWidth="10" />
              <circle cx="60" cy="60" r="54" fill="none"
                stroke={examResults.accuracy >= 70 ? '#8b5cf6' : examResults.accuracy >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="10" strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - examResults.accuracy / 100)}`}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="text-center">
              <span className="text-2xl font-black text-white">{examResults.accuracy}%</span>
              <span className="text-[9px] font-bold text-zinc-400 block">Accuracy</span>
            </div>
          </div>
          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-black text-white">Exam Results</h2>
              {examResults.accuracy >= 70
                ? <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-full">PASSED</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/15 border border-red-500/25 text-red-400 rounded-full">NEEDS IMPROVEMENT</span>}
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">{synopsis?.metadata?.title}</p>
            <div className="flex flex-wrap gap-4 pt-1">
              <div className="text-center"><span className="text-lg font-black text-white">{examResults.overallScore}</span><span className="text-zinc-500">/{examResults.maxScore}</span><p className="text-[9px] text-zinc-500 uppercase tracking-wider">Total Score</p></div>
              <div className="text-center"><span className="text-lg font-black text-white">{formatTime(examResults.timeTaken)}</span><p className="text-[9px] text-zinc-500 uppercase tracking-wider">Time Taken</p></div>
              <div className="text-center"><span className="text-lg font-black text-white">{examResults.warningCount ?? examWarningCount}</span><p className="text-[9px] text-zinc-500 uppercase tracking-wider">Tab Warnings</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left — Section breakdown + Q&A */}
          <div className="xl:col-span-2 space-y-6">
            {/* Section-wise score cards */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
                <BarChart2 className="h-4 w-4 text-brand-400" /><span>Section Performance</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['test_mcq','test_fill_blank','test_true_false','test_scenario','test_case_study','test_short_answer','test_coding'].map(sKey => {
                  const sec = examResults.sections?.[sKey];
                  if (!sec) return null;
                  const pct = sec.maxScore > 0 ? Math.round(sec.score / sec.maxScore * 100) : 0;
                  const label = sKey.replace('test_','').replace(/_/g,' ').toUpperCase();
                  return (
                    <div key={sKey} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-zinc-400">{label}</span>
                        <span className={`text-xs font-black ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{sec.score}/{sec.maxScore}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question-level Review */}
            {['test_mcq','test_fill_blank','test_true_false','test_scenario','test_case_study','test_short_answer','test_coding'].map(sKey => {
              const sec = examResults.sections?.[sKey];
              if (!sec || sec.gradedQuestions?.length === 0) return null;
              const label = sKey.replace('test_','').replace(/_/g,' ').toUpperCase();
              return (
                <div key={sKey} className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">{label} — Review</h4>
                  {sec.gradedQuestions.map((gq: any, i: number) => (
                    <div key={i} className={`rounded-xl p-4 space-y-2 border ${gq.isCorrect === false ? 'border-red-500/25 bg-red-500/5' : gq.isCorrect === true ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950/40'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white leading-relaxed"><span className="text-zinc-500 font-mono mr-1.5">Q{i+1}.</span>{gq.question}</p>
                        {gq.isCorrect !== undefined && (
                          <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${gq.isCorrect ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{gq.isCorrect ? '✓ Correct' : '✗ Wrong'}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div><span className="text-[9px] font-mono text-zinc-500 uppercase block">Your Answer</span><p className="text-zinc-300 mt-0.5 font-sans">{gq.studentAnswer || '(no answer)'}</p></div>
                        {(gq.correctAnswer || gq.modelAnswer) && (
                          <div><span className="text-[9px] font-mono text-zinc-500 uppercase block">{gq.correctAnswer ? 'Correct Answer' : 'Model Answer'}</span><p className="text-emerald-300 mt-0.5 font-sans">{gq.correctAnswer || gq.modelAnswer}</p></div>
                        )}
                      </div>
                      {gq.feedback && <p className="text-[11px] text-zinc-400 leading-relaxed font-sans italic border-t border-zinc-800 pt-2">{gq.feedback}</p>}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Weak / Strong Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-zinc-950/40 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />Strong Topics</h4>
                <ul className="space-y-1.5">{examResults.strongTopics?.map((t: string, i: number) => <li key={i} className="text-xs text-zinc-300 font-sans flex items-center gap-1.5"><Star className="h-3 w-3 text-emerald-400 shrink-0" />{t}</li>)}</ul>
              </div>
              <div className="bg-zinc-950/40 border border-red-500/20 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5"><TrendingDown className="h-4 w-4" />Weak Topics (Revise These)</h4>
                <ul className="space-y-1.5">{examResults.weakTopics?.map((t: string, i: number) => <li key={i} className="text-xs text-zinc-300 font-sans flex items-center gap-1.5"><Zap className="h-3 w-3 text-red-400 shrink-0" />{t}</li>)}</ul>
              </div>
            </div>

            {/* Study Plan */}
            {examResults.studyPlan && (
              <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-brand-500/20 p-6 rounded-2xl space-y-3">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest font-mono flex items-center gap-1"><Sparkles className="h-3 w-3" />Personalized Study Plan</span>
                <p className="text-sm text-zinc-200 leading-relaxed font-sans">{examResults.studyPlan}</p>
              </div>
            )}

            {/* Extra Practice */}
            {examResults.extraPracticeQuestions?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2"><Target className="h-4 w-4 text-amber-400" />Extra Practice for Weak Topics</h4>
                {examResults.extraPracticeQuestions.map((eq: any, i: number) => (
                  <div key={i} className="bg-zinc-950/40 border border-amber-500/15 rounded-xl p-4 border-l-4 border-l-amber-500 space-y-1">
                    <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider font-mono">{eq.topic}</span>
                    <p className="text-xs text-zinc-300 font-bold leading-relaxed">{eq.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — AI Study Coach */}
          <div className="xl:col-span-1 bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[600px] sticky top-6">
            <div className="border-b border-zinc-850 pb-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-brand-400 animate-pulse" /><span className="text-xs font-bold text-white">AI Study Coach</span></div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 scrollbar-none pb-4 text-xs">
              <div className="flex justify-start">
                <div className="bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-2xl rounded-tl-none p-3 leading-relaxed font-sans">
                  Hi! Your exam has been submitted. I've reviewed your performance — ask me anything about your mistakes, weak topics, or how to improve!
                </div>
              </div>
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed font-sans font-medium ${ isUser ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-none'}`}>{msg.content}</div>
                  </div>
                );
              })}
              {sendingMessage && (<div className="flex justify-start"><div className="bg-zinc-900 border border-zinc-800 text-zinc-550 rounded-2xl p-3 flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" /><span className="text-[10px] font-bold font-mono">Thinking...</span></div></div>)}
            </div>
            <div className="relative mt-auto border-t border-zinc-850 pt-2">
              <input type="text" placeholder="Ask about your results..." value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                disabled={sendingMessage}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-500 rounded-xl py-2 pl-3.5 pr-10 text-xs text-white placeholder-zinc-555 focus:outline-none transition-all disabled:opacity-50" />
              <button onClick={handleSendChatMessage} disabled={sendingMessage || !chatInput.trim()}
                className="absolute right-2 top-3.5 p-1 text-brand-400 hover:text-brand-300 disabled:text-zinc-600 transition-colors cursor-pointer">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam Full-Screen Overlay ──────────────────────────────────────────────
  if (isAssessmentMode) {
    const examSections = getExamSections();
    const totalQ = getTotalExamQuestions();
    const answeredQ = getAnsweredExamCount();
    const timerDanger = examTimeLeft <= 120; // last 2 minutes

    const renderExamSection = () => {
      if (!assessment?.testPackage) return null;
      const tp = assessment.testPackage;

      switch (examActiveSection) {
        case 'test_mcq': {
          const mcqs = tp.mcqs || [];
          return (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2"><Award className="h-4 w-4 text-brand-400" />Multiple Choice Questions</h3>
              {mcqs.map((m, idx) => (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="text-sm font-bold text-white flex items-start gap-2">
                    <span className="text-xs font-mono text-zinc-500 shrink-0 mt-0.5">Q{idx+1}.</span>
                    <span>{m.question}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {m.options.map((opt, oIdx) => {
                      const sel = testMcqAnswers[idx] === opt;
                      return (
                        <button key={oIdx}
                          onClick={() => setTestMcqAnswers(prev => ({ ...prev, [idx]: opt }))}
                          className={`flex items-center gap-3 text-left p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${ sel ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}`}>
                          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${ sel ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>{['A','B','C','D'][oIdx]}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        case 'test_fill_blank': {
          const fbs = tp.fillBlanks || [];
          return (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2"><List className="h-4 w-4 text-brand-400" />Fill in the Blanks</h3>
              {fbs.map((fb, idx) => (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <p className="text-sm text-zinc-200 font-bold"><span className="text-xs font-mono text-zinc-500 mr-1.5">Q{idx+1}.</span>{fb.sentence}</p>
                  <input type="text"
                    value={testFillAnswers[idx] || ''}
                    onChange={e => setTestFillAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Type your answer..."
                    className="w-full max-w-sm bg-zinc-900/60 border border-zinc-700 focus:border-brand-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all" />
                </div>
              ))}
            </div>
          );
        }
        case 'test_true_false': {
          const tfs = tp.trueFalse || [];
          return (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-400" />True / False</h3>
              {tfs.map((tf, idx) => (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <p className="text-sm font-bold text-white"><span className="text-xs font-mono text-zinc-500 mr-1.5">Q{idx+1}.</span>{tf.statement}</p>
                  <div className="flex gap-3">
                    {[true, false].map(val => {
                      const sel = testTfAnswers[idx] === val;
                      return (
                        <button key={String(val)}
                          onClick={() => setTestTfAnswers(prev => ({ ...prev, [idx]: val }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${ sel ? (val ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-red-500/20 border-red-500 text-red-300') : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                          {val ? '✓ True' : '✗ False'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        case 'test_scenario': {
          const scenarios = tp.scenarioQuestions || [];
          return (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-brand-400" />Scenario Questions</h3>
              {scenarios.map((sc, idx) => (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="bg-zinc-900/60 border-l-4 border-amber-500 p-3 rounded-r-xl">
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed"><strong className="text-amber-400">Scenario:</strong> {sc.scenario}</p>
                  </div>
                  <p className="text-sm font-bold text-white"><span className="text-xs font-mono text-zinc-500 mr-1.5">Q{idx+1}.</span>{sc.question}</p>
                  <textarea rows={4} value={testScenarioAnswers[idx] || ''}
                    onChange={e => setTestScenarioAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Write your answer here..."
                    className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-brand-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all resize-none" />
                </div>
              ))}
            </div>
          );
        }
        case 'test_case_study': {
          const cases = tp.caseStudies || [];
          return (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2"><Briefcase className="h-4 w-4 text-brand-400" />Case Studies</h3>
              {cases.map((cs, csIdx) => (
                <div key={csIdx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-brand-300">{cs.title}</h4>
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed">{cs.caseText}</p>
                  </div>
                  {cs.questions.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-2">
                      <p className="text-xs font-bold text-white">Sub-Q{qIdx+1}: {q}</p>
                      <textarea rows={3} value={testCaseAnswers[csIdx]?.[qIdx] || ''}
                        onChange={e => {
                          const newArr = [...(testCaseAnswers[csIdx] || [])];
                          newArr[qIdx] = e.target.value;
                          setTestCaseAnswers(prev => ({ ...prev, [csIdx]: newArr }));
                        }}
                        placeholder="Answer..."
                        className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-brand-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all resize-none" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }
        case 'test_short_answer': {
          const sas = tp.shortAnswers || [];
          return (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-brand-400" />Short Answer Questions</h3>
              {sas.map((sa, idx) => (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <p className="text-sm font-bold text-white"><span className="text-xs font-mono text-zinc-500 mr-1.5">Q{idx+1}.</span>{sa.question}</p>
                  <textarea rows={4} value={testSaAnswers[idx] || ''}
                    onChange={e => setTestSaAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Write your answer here..."
                    className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-brand-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all resize-none" />
                </div>
              ))}
            </div>
          );
        }
        case 'test_coding': {
          const cqs = tp.codingQuestions || [];
          return (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2"><Code className="h-4 w-4 text-brand-400" />Coding Questions</h3>
              {cqs.map((cq, idx) => (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white">{cq.title}</h4>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">{cq.description}</p>
                  {cq.starterCode && <pre className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap">{cq.starterCode}</pre>}
                  <textarea rows={10} value={testCodeAnswers[idx] || ''}
                    onChange={e => setTestCodeAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Write your code solution here..."
                    className="w-full font-mono bg-zinc-950 border border-zinc-700 focus:border-brand-500 rounded-xl py-3 px-4 text-xs text-green-400 placeholder-zinc-600 focus:outline-none transition-all resize-none" spellCheck={false} />
                </div>
              ))}
            </div>
          );
        }
        default: return null;
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden select-none">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border animate-fade-in ${
            toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300' :
            toast.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-300' :
            toast.type === 'warning' ? 'bg-amber-900/90 border-amber-500/30 text-amber-300' :
            'bg-zinc-900/95 border-zinc-700 text-zinc-200'
          }`}>
            {toast.type === 'warning' && <ShieldAlert className="h-4 w-4" />}
            {toast.type === 'success' && <Check className="h-4 w-4" />}
            {toast.type === 'error' && <X className="h-4 w-4" />}
            {toast.type === 'info' && <Sparkles className="h-4 w-4" />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Exam Confirm Modal */}
        {showExamConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full space-y-5 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" />
                <h3 className="text-base font-bold text-white">Submit Exam?</h3>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">Are you sure you want to submit the exam? You answered <strong className="text-white">{getAnsweredExamCount()}</strong> of <strong className="text-white">{getTotalExamQuestions()}</strong> questions. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExamConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-all">Continue Exam</button>
                <button onClick={handleExamSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 text-xs font-bold text-white cursor-pointer shadow-lg transition-all hover:scale-[1.02]">{submittingExam ? 'Submitting...' : 'Yes, Submit'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Exam Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-400 shrink-0" />
              <h1 className="text-sm font-black text-white truncate">Exam Assessment</h1>
            </div>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{synopsis?.metadata?.title}</p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-black transition-all ${ timerDanger ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse' : 'bg-zinc-800 border-zinc-700 text-white'}`}>
            <Timer className="h-4 w-4" />
            <span>{formatExamTimer(examTimeLeft)}</span>
          </div>

          {/* Answered Progress */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Answered</span>
            <span className="text-sm font-black text-white">{answeredQ}<span className="text-zinc-500">/{totalQ}</span></span>
          </div>

          {/* Warnings */}
          {examWarningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">{examWarningCount} Warning{examWarningCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Submit Button */}
          <button onClick={() => setShowExamConfirm(true)}
            disabled={submittingExam}
            className="shrink-0 flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-xs font-bold text-white rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50">
            {submittingExam ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Submitting...</span></> : <><Trophy className="h-4 w-4" /><span>Submit Exam</span></>}
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Section Sidebar */}
          <aside className="w-52 shrink-0 bg-zinc-900/60 border-r border-zinc-800 flex flex-col p-3 gap-1.5 overflow-y-auto scrollbar-none">
            <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-2 py-1">Sections</div>
            {examSections.map(sec => {
              const Icon = sec.icon;
              const isActive = examActiveSection === sec.id;
              return (
                <button key={sec.id} onClick={() => setExamActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${ isActive ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'}`}>
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-brand-400' : ''}`} />
                  <span className="truncate">{sec.label}</span>
                  <span className="ml-auto text-[9px] font-mono text-zinc-600">{sec.count}</span>
                </button>
              );
            })}
            <div className="mt-auto pt-3 border-t border-zinc-800 space-y-2">
              <div className="px-2 space-y-1">
                <div className="flex justify-between text-[10px]"><span className="text-zinc-500">Progress</span><span className="text-white font-bold">{answeredQ}/{totalQ}</span></div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all" style={{ width: totalQ > 0 ? `${Math.round(answeredQ/totalQ*100)}%` : '0%' }} /></div>
              </div>
            </div>
          </aside>

          {/* Question Area */}
          <main className="flex-1 overflow-y-auto p-6 scrollbar-none">
            {loadingAssessment ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
                <p className="text-sm text-zinc-400">Loading exam questions...</p>
              </div>
            ) : (
              renderExamSection()
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow flex flex-col space-y-6 animate-fade-in">
      
      {/* Control Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bookmark */}
          <button
            onClick={handleToggleSave}
            className={`flex items-center space-x-1.5 py-2 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              synopsis.saved
                ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
                : 'border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${synopsis.saved ? 'fill-brand-400 text-brand-400' : ''}`} />
            <span>{synopsis.saved ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          {(synopsis.outputFormat || 'web').toLowerCase() === 'pdf' && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-xs font-bold text-white shadow-lg glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              title="Download Printable PDF Study Guide"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          )}

          {(synopsis.outputFormat || 'web').toLowerCase() === 'ppt' && (
            <div className="flex flex-col items-end space-y-2">
              <button
                onClick={handleDownloadPPT}
                disabled={downloadingPPT}
                className={`flex items-center space-x-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                  downloadingPPT
                    ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none border border-zinc-700/50'
                    : 'bg-gradient-to-r from-brand-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] glow-purple'
                }`}
                title="Download Slides Deck Presentation"
              >
                {downloadingPPT ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating professional PPT with diagrams...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Export PPT</span>
                  </>
                )}
              </button>
              {downloadError && (
                <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg max-w-[280px] text-right">
                  ⚠️ {downloadError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title block */}
      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="relative aspect-video w-full md:w-56 shrink-0 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950">
          <img
            src={synopsis.metadata.thumbnail}
            alt={synopsis.metadata.title}
            className="h-full w-full object-cover"
          />
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-white">
            {synopsis.metadata.duration} mins
          </span>
        </div>
        <div className="space-y-2 flex-grow">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-300 rounded font-mono uppercase">
              {synopsis.theme || 'General'} Topic
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded font-mono uppercase">
              Views: {synopsis.metadata.views || 'N/A'}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white leading-tight font-display">
            {synopsis.metadata.title}
          </h1>
          <div className="text-xs text-zinc-400 font-semibold">{synopsis.metadata.channelName}</div>
          
          <div className="flex items-center space-x-4 pt-1 text-[11px] text-zinc-500 font-medium">
            <div className="flex items-center space-x-1 font-sans">
              <Calendar className="h-3.5 w-3.5" />
              <span>Published: {synopsis.metadata.publishDate}</span>
            </div>
            <a 
              href={synopsis.metadata.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-brand-400 hover:text-brand-300 transition-colors font-sans"
            >
              <span>Watch Original Video</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Ready to Assessment Card */}
      <div className="bg-gradient-to-r from-purple-950/40 to-brand-950/40 border border-brand-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-brand-300 font-bold text-sm">
            <Award className="h-4 w-4 text-brand-400" />
            <span>AI ASSESSMENT & PRACTICE SUITE</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-tight">
            Check your understanding of this lecture!
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed font-sans font-medium">
            Attempt interactive assessments (flashcards, MCQ quiz, scenarios, case studies, coding practice, and fill-in-the-blanks) to generate instant scoring and a personalized AI study guide roadmap.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAssessmentMode(true);
            setActiveSection('test_mcq');
          }}
          className="shrink-0 rounded-xl bg-brand-500 text-xs font-bold text-white px-6 py-3 shadow-lg glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-sans"
        >
          Open Assessments
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="flex justify-end bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4">
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-550" />
          <input
            type="text"
            placeholder="Search matching study text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Workspace: Left Sidebar Navigation & Center Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Sidebar Navigation Modules List */}
        <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 space-y-3 lg:sticky lg:top-6 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-none">
          <div className="flex flex-col gap-2 pb-2 border-b border-zinc-850">
            <button
              onClick={() => {
                const newMode = !isAssessmentMode;
                setIsAssessmentMode(newMode);
                setActiveSection(newMode ? 'test_mcq' : 'overview');
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center justify-center space-x-2 shadow-sm ${
                isAssessmentMode
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 border-red-500/30 text-white hover:scale-[1.01]'
                  : 'bg-gradient-to-r from-brand-500 to-purple-600 border-brand-500/30 text-white hover:scale-[1.01]'
              }`}
            >
              <Award className="h-4 w-4 shrink-0" />
              <span>{isAssessmentMode ? 'Switch to Practice Mode' : 'Take Exam Assessment'}</span>
            </button>
          </div>
          
          <div className="text-[10px] font-black uppercase text-zinc-550 tracking-wider pb-2 border-b border-zinc-850 px-2 font-mono">
            {isAssessmentMode ? 'Exam Assessment Tabs' : 'Platform Study Tabs'}
          </div>
          
          {visibleSecs.length === 0 ? (
            <div className="text-zinc-600 text-xs text-center py-6">No matching tabs found.</div>
          ) : (
            <nav className="flex flex-col space-y-1">
              {visibleSecs.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-900 text-white border-l-2 border-brand-500 pl-4 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/20'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-400' : 'text-zinc-500'}`} />
                    <span className="truncate">{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center/Right Content Panel split layout with Chat on results or stats */}
        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          <div className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 sm:p-8 min-h-[450px] shadow-sm">
            {visibleSecs.some((s) => s.id === activeSection) ? (
              <div className="animate-fade-in">
                {renderActiveSectionContent()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Sparkles className="h-8 w-8 text-zinc-600" />
                <p className="text-zinc-550 text-xs">No matching study content found for your search.</p>
              </div>
            )}
          </div>

          {/* Persistent AI Study Coach Column */}
          <div className="xl:col-span-1 bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[550px] sticky top-6">
            <div className="border-b border-zinc-850 pb-3 mb-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4.5 w-4.5 text-brand-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">AI Study Coach</span>
                </div>
                <div className="flex items-center space-x-2">
                  {chatProvider === 'groq' && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-300 rounded font-mono uppercase">
                      Powered by Groq
                    </span>
                  )}
                  {chatProvider === 'openai' && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded font-mono uppercase">
                      Powered by OpenAI
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Online</span>
                </div>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 scrollbar-none pb-4 text-xs">
              <div className="flex justify-start">
                <div className="bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-2xl rounded-tl-none p-3 leading-relaxed font-sans font-medium">
                  Hi! I am your AI Study Coach. How can I help you understand this video lecture? You can ask me questions, request custom examples, or clarify normalizations and key concepts!
                </div>
              </div>
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={idx} 
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed font-sans font-medium ${
                      isUser
                        ? 'bg-brand-500 text-white rounded-tr-none'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-zinc-800 text-zinc-550 rounded-2xl rounded-tl-none p-3 flex items-center space-x-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                    <span className="text-[10px] font-bold font-mono">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested quick buttons */}
            <div className="space-y-1 pb-2 border-t border-zinc-900 pt-2">
              <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest font-mono">Suggested queries:</span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleQuickQuery("Explain the core concepts of this video")}
                  className="text-[9px] bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700 p-1.5 rounded-lg transition-all cursor-pointer truncate max-w-full text-left"
                >
                  ❓ Explain the core concepts
                </button>
                <button
                  onClick={() => handleQuickQuery("Provide a real-life example of these concepts")}
                  className="text-[9px] bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700 p-1.5 rounded-lg transition-all cursor-pointer truncate max-w-full text-left"
                >
                  ❓ Provide a real-life example
                </button>
              </div>
            </div>

            {/* Message Input Box */}
            <div className="relative mt-auto border-t border-zinc-850 pt-2">
              <input
                type="text"
                placeholder="Ask your study coach..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                disabled={sendingMessage}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2 pl-3.5 pr-10 text-xs text-white placeholder-zinc-555 focus:outline-none transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSendChatMessage}
                disabled={sendingMessage || !chatInput.trim()}
                className="absolute right-2 top-3.5 p-1 text-brand-400 hover:text-brand-300 disabled:text-zinc-600 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SynopsisViewerPage;
