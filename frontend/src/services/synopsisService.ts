import api from './api';
import axios from 'axios';

export interface VideoMetadata {
  id: string;
  youtubeId: string;
  title: string;
  channelName: string;
  duration: string;
  publishDate: string;
  thumbnail: string;
  youtubeUrl: string;
  views?: string;
}

export interface Chapter {
  timestamp: string;
  title: string;
  summary: string;
}

export interface KeyInsight {
  title: string;
  description: string;
}

export interface TopicBreakdown {
  topic: string;
  percentage: number;
  description: string;
}

export interface SynopsisData {
  id: string;
  metadata: VideoMetadata;
  executiveSummary: string;
  chapters: Chapter[];
  insights: KeyInsight[];
  actionItems: string[];
  topics: TopicBreakdown[];
  conclusion: string;
  keywords: string[];
  sentiment: {
    label: string;
    score: number; // 0 to 100
    explanation: string;
  };
  createdAt: string;
  saved: boolean;
  outputFormat?: 'web' | 'pdf' | 'ppt';

  // New Educational and Study Guide Fields
  introduction?: string;
  detailedExplanation?: string;
  keyConcepts?: Array<{ concept: string; explanation: string }>;
  importantDefinitions?: Array<{ term: string; definition: string }>;
  examples?: Array<{ example: string; description: string }>;
  practicalApplications?: Array<{ application: string; description: string }>;
  keyTakeaways?: string[];
  quickRevisionNotes?: string;
  faq?: Array<{ question: string; answer: string }>;
  interviewQuestions?: Array<{ question: string; answer: string }>;
  examPreparationNotes?: string[];
  theme?: string;
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedReadTime?: string;
  estimatedRevisionTime?: string;
  contentQualityScore?: number;
  importantFormulas?: Array<{ formula: string; explanation: string }>;
  mcqs?: Array<{ question: string; options: string[]; correctAnswer: string }>;
  resumeProjectSummary?: {
    projectTitle: string;
    technologiesUsed: string[];
    keyFeatures: string[];
    resumeBulletPoints: string[];
  } | null;

  // Gemini Hierarchical Study Material additions
  learningObjectives?: string[];
  majorConcepts?: Array<{
    concept: string;
    explanation: string;
    subtopics?: Array<{ title: string; explanation: string }>;
    definitions?: Array<{ term: string; definition: string }>;
    examples?: Array<{ example: string; description: string }>;
    formulas?: Array<{ formula: string; explanation: string }>;
    workflows?: Array<{ step: string; description: string }>;
  }>;
  generatedStudyMaterial?: any;
  transcript?: string;
  vivaQuestions?: Array<{ question: string; answer: string }>;
  shortAnswerQuestions?: Array<{ question: string; answer: string; marks: number }>;
  longAnswerQuestions?: Array<{ question: string; answer: string; marks: number }>;
  practiceQuestions?: Array<{ question: string; hint: string }>;
}

const IS_DEMO_MODE = false;

// Helper to extract YouTube ID
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();
  
  // 1. YouTube Shorts Match
  // e.g. https://www.youtube.com/shorts/abcd1234 or youtube.com/shorts/abcd1234
  const shortsReg = /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/i;
  const shortsMatch = cleanUrl.match(shortsReg);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1].slice(0, 11);
  }
  
  // 2. Standard watch URL Match
  // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or youtube.com/watch?v=dQw4w9WgXcQ
  const watchReg = /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/i;
  const watchMatch = cleanUrl.match(watchReg);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1].slice(0, 11);
  }
  
  // 3. Shortened youtu.be URL Match
  // e.g. https://youtu.be/dQw4w9WgXcQ or youtu.be/dQw4w9WgXcQ
  const shortenReg = /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/i;
  const shortenMatch = cleanUrl.match(shortenReg);
  if (shortenMatch && shortenMatch[1]) {
    return shortenMatch[1].slice(0, 11);
  }
  
  // 4. Fallback: Check standard embed / generic regex for other possible formats
  const genericReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const genericMatch = cleanUrl.match(genericReg);
  if (genericMatch && genericMatch[2] && genericMatch[2].length === 11) {
    return genericMatch[2];
  }
  
  return null;
}

// Preset detailed mock summaries for high-quality demo
const DEMO_SUMMARIES: Record<string, Omit<SynopsisData, 'id' | 'createdAt' | 'saved'>> = {
  react19: {
    metadata: {
      id: 'vid_react19',
      youtubeId: '8pDquaF545o',
      title: 'React 19 Core Features & Updates: A Developer\'s Handbook',
      channelName: 'JS Mastery & Tech Academy',
      duration: '18:45',
      publishDate: '2026-04-12',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
      youtubeUrl: 'https://www.youtube.com/watch?v=8pDquaF545o',
      views: '245,600'
    },
    executiveSummary: 'This video provides a deep-dive technical overview of React 19, highlighting key features designed to simplify state management and UI interactions. The primary focus is on Server Components, actions, the new `use` hook, and the revolutionary React Compiler (React Forget) which automates component memoization, significantly boosting performance without manual intervention.',
    introduction: 'This study handbook serves as a comprehensive reference guide for React 19. It introduces the React Compiler, Server Actions, Form Action APIs, asset loading optimizations, and the `use()` hook for loading resources during rendering.',
    detailedExplanation: `# React 19 Core Features Tutorial Deep Dive

## 1. The React Compiler (React Forget)
React 19 introduces the React Compiler, a build-time compiler that automatically optimizes component rendering. Historically, developers had to manually wrap functions and dependencies in \`useMemo\` and \`useCallback\` to prevent unnecessary component re-renders. 

The compiler uses static analysis to understand javascript dependency trees and automatically injects cache validation keys.

### Benefits of Compiler Automation
1. **Zero Boilerplate:** Remove manual hooks.
2. **Predictable Re-renders:** Component rendering behaves consistently.
3. **No Dependency Bugs:** Eliminates bugs caused by incomplete dependency arrays.

## 2. Server Actions & Forms
React 19 natively links Form elements with Server Actions. You can now pass an asynchronous function directly to the \`action\` prop of a \`form\`. React manages transition states, loading triggers, and errors automatically.

## 3. The \`use()\` hook API
The new \`use()\` API allows developers to read promises or context during the render cycle. Unlike standard hooks, \`use()\` can be called conditionally or inside loops.`,
    chapters: [
      { timestamp: '00:00', title: 'Introduction to React 19', summary: 'Introduction to the release notes, focusing on developer productivity, ecosystem alignment, and runtime efficiency.' },
      { timestamp: '02:15', title: 'The React Compiler', summary: 'Detailed exploration of the React Compiler (React Forget), showing how it automatically memoizes hooks and values, eliminating the need for `useMemo` and `useCallback`.' },
      { timestamp: '06:40', title: 'Server Components Deep Dive', summary: 'Explains the architectural differences between Client and Server Components, detailing data fetching and initial page load optimizations.' },
      { timestamp: '11:10', title: 'Server Actions & Form Handling', summary: 'Introduction to the new standard for handling form submissions, data validation, and asynchronous transitions directly on the server.' },
      { timestamp: '15:20', title: 'The New use Hook & Document Metadata', summary: 'Demonstrates fetching data in render using the new `use` API, alongside built-in support for document head elements (title, meta, link).' }
    ],
    insights: [
      { title: 'Compiler Automation', description: 'The React Compiler converts standard JavaScript into optimized code, rendering hand-coded memoization obsolete.' },
      { title: 'Form Actions Paradigm Shift', description: 'Form actions eliminate boilerplates for loading states, error states, and optimistic updates, shifting focus to pure server-side endpoints.' },
      { title: 'Asynchronous State Transition Support', description: 'React 19 introduces native support for async functions in transitions, letting applications show pending indicators automatically during slow updates.' }
    ],
    actionItems: [
      "Audit existing codebases for manual useMemo and useCallback uses to prepare for React Compiler integration.",
      "Explore migrating heavy client data fetching routines to React Server Components (RSC).",
      "Adopt Form Actions to simplify authentication and settings UI controllers."
    ],
    topics: [
      { topic: 'React Compiler & Performance', percentage: 35, description: 'Automated rendering optimization and compilation techniques.' },
      { topic: 'Server Architecture (RSC)', percentage: 30, description: 'Server-side rendering, streaming, and component hybrid layouts.' },
      { topic: 'State and Action APIs', percentage: 25, description: 'Form states, pending transitions, and new hook specifications.' },
      { topic: 'SEO & Document Integration', percentage: 10, description: 'Native support for titles, metadata, and asset loading tags.' }
    ],
    conclusion: 'React 19 represents a monumental shift towards zero-cost optimizations and unified server-client programming models. Developers should prioritize learning Server Actions and preparing their build steps for the React Compiler.',
    keywords: ['React 19', 'React Compiler', 'Server Components', 'Server Actions', 'Web Development', 'JavaScript'],
    sentiment: {
      label: 'Analytical',
      score: 92,
      explanation: 'Highly structured and precise tech documentation style, maintaining an objective, educative tone throughout.'
    },
    learningObjectives: [
      "Understand React 19's architectural shift towards automatic optimization via the React Compiler.",
      "Implement asynchronous operations seamlessly with Server Actions and Form Action states.",
      "Fetch assets and resources during rendering using the new use() hook API."
    ],
    majorConcepts: [
      {
        concept: "React Compiler (React Forget)",
        explanation: "A build-time tool that automatically memoizes components, hooks, and dependency arrays. It eliminates the need for developers to manually write useMemo or useCallback, reducing boilerplate and preventing rendering bugs.",
        subtopics: [
          { title: "Automatic Memoization", explanation: "React Compiler compiles standard JavaScript React code, inserts memoization checks dynamically at the AST level, and avoids extra re-renders on unchanged sub-trees." }
        ],
        definitions: [
          { term: "React Forget", definition: "The internal project name for the React Compiler that automates optimization." }
        ],
        examples: [
          { example: "Manual vs Automated rendering code", description: "Removing 'useMemo(() => compute(val), [val])'; the compiler detects the stable compute output and caches it automatically." }
        ],
        formulas: [
          { formula: "Optimization_Ratio = Hand_Memo_Lines / Auto_Memo_Lines", explanation: "Measures developer code reduction by automating hook boundaries." }
        ],
        workflows: [
          { step: "Source Input Parse", description: "The compiler parses JSX files into Abstract Syntax Trees." },
          { step: "Dependency Graph Verification", description: "Examines reactive values and props to trace change bounds." },
          { step: "Optimized Output generation", description: "Outputs JavaScript bundle injected with cache lookup gates." }
        ]
      },
      {
        concept: "Server Actions & Transitions",
        explanation: "A new paradigm enabling client components to invoke asynchronous functions directly on the server. Integrates state transitions, loading states, error boundaries, and optimistic updates directly with forms.",
        subtopics: [
          { title: "Form Action attribute", explanation: "Allows passing a client or server function directly into the <form action={action}> tag, automatically capturing inputs via FormData." }
        ],
        definitions: [
          { term: "Server Actions", definition: "Asynchronous functions declared with the 'use server' directive that can be triggered from client-side forms." }
        ],
        examples: [
          { example: "Form Submission Action", description: "A simple async submit function that calls DB operations, with automatic loading spinners using useFormStatus." }
        ],
        formulas: [],
        workflows: [
          { step: "Client Form Event", description: "User clicks submit on a form with an action callback." },
          { step: "RPC Call Serialization", description: "Vite/Next framework serializes form data and sends a POST request to the server." },
          { step: "Server Execution & Mutate", description: "The server action updates database state and revalidates cached layouts." }
        ]
      }
    ],
    importantDefinitions: [
      { term: "React Forget", definition: "The internal project name for the React Compiler that automates optimization." },
      { term: "Server Actions", definition: "Asynchronous functions declared with the 'use server' directive that can be triggered from client-side forms." }
    ],
    examples: [
      { example: "Manual vs Automated rendering code", description: "Removing 'useMemo(() => compute(val), [val])'; the compiler detects the stable compute output and caches it automatically." },
      { example: "Form Submission Action", description: "A simple async submit function that calls DB operations, with automatic loading spinners using useFormStatus." }
    ],
    importantFormulas: [
      { formula: "Optimization_Ratio = Hand_Memo_Lines / Auto_Memo_Lines", explanation: "Measures developer code reduction by automating hook boundaries." }
    ],
    practicalApplications: [
      { application: "Performance Tuning", description: "Applying compiler optimizations to codebases with hundreds of nested components to reduce frame drops." }
    ],
    quickRevisionNotes: `# React 19 Cheat Sheet
- **React Compiler:** Automatically memoizes components. Remove manual useMemo/useCallback.
- **Server Actions:** Pass functions directly to forms via \`<form action={asyncFn}>\`.
- **use() hook:** Dynamically resolve promises in render blocks conditionally.`,
    faq: [
      { question: "Is useMemo completely dead in React 19?", answer: "Yes, once the React Compiler is enabled, manual memoization hooks are fully handled at build time." }
    ],
    interviewQuestions: [
      { question: "Explain the use() hook in React 19 and how it differs from traditional hooks.", answer: "The use() hook resolves promises and context during rendering and can be called conditionally, unlike other hooks that must follow strict rules of hooks (no conditional checks, no loop executions)." }
    ],
    examPreparationNotes: [
      "Prepare to describe how Server Actions differ from REST endpoints.",
      "Be ready to trace re-render cycles before and after compiler application."
    ],
    theme: "Technology",
    difficultyLevel: "Intermediate",
    estimatedReadTime: "10 mins",
    estimatedRevisionTime: "3 mins",
    contentQualityScore: 98,
    mcqs: [
      { question: "Which feature in React 19 automates hook memoization?", options: ["React Forget (Compiler)", "Server Actions", "use hook", "Form Action"], correctAnswer: "React Forget (Compiler)" },
      { question: "Can the new use() hook be called inside conditional statements?", options: ["Yes", "No", "Only in server components", "Only in development modes"], correctAnswer: "Yes" }
    ],
    resumeProjectSummary: {
      projectTitle: "React 19 Enterprise Form Handler",
      technologiesUsed: ["React 19", "Vite", "TypeScript"],
      keyFeatures: ["Refactored memoization pipelines to utilize React Compiler", "Integrated Server Actions for real-time contact validation"],
      resumeBulletPoints: [
        "Reduced codebase size by 15% by removing manual memoization hooks, leveraging React 19 Compiler.",
        "Created custom async form status indicators handling background state validation with zero boilerplate."
      ]
    }
  },
  ai_keynote: {
    metadata: {
      id: 'vid_aikey',
      youtubeId: 'yR73Vz57C5w',
      title: 'State of Artificial Intelligence 2026: Agentic Workflows & Multi-Agent Systems',
      channelName: 'Global AI Summit',
      duration: '42:10',
      publishDate: '2026-03-05',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
      youtubeUrl: 'https://www.youtube.com/watch?v=yR73Vz57C5w',
      views: '512,000'
    },
    executiveSummary: 'This keynote address surveys the transition of Artificial Intelligence from simple conversational chatbots to autonomous agentic workflows. By chaining specialized AI models, companies are deploying collaborative multi-agent ecosystems capable of handling complex software development, market research, and customer support with human-like cognitive depth.',
    introduction: 'This handbook analyzes State of AI 2026. Focuses on agentic loop patterns, supervisor structures, multi-agent coordination, and establishing execution boundaries.',
    detailedExplanation: `# Agentic Systems & Multi-Agent Design (Keynote Analysis)

## 1. Chatbots vs Agentic Workflows
The traditional paradigm of conversational prompt-response AI has hit a ceiling. 2026 marks the maturity of **Agentic AI**, which refers to systems that run in programmatic loops. Instead of generating text once, the agent:
- Plans a series of steps.
- Calls external tools and evaluates outputs.
- Reflects on outcomes and corrects errors before showing the user.

## 2. Multi-Agent Team Topologies
For complex tasks, a single agentic model hits memory boundaries. Multi-agent designs group models into specialized roles.
- **Supervisor Topology:** One model directs tasks to workers and verifies submissions.
- **Chained Topology:** Output of one specialized model flows directly into the next.`,
    chapters: [
      { timestamp: '00:00', title: 'Opening Remarks & The Agentic Paradigm', summary: 'Introduction to AI maturity, defining "Agentic AI" as systems that exhibit planning, tool usage, and iterative reflection.' },
      { timestamp: '10:15', title: 'Architecting Multi-Agent Networks', summary: 'How to structure agent networks using supervisor models, peer-to-peer delegation, and hierarchical routing systems.' },
      { timestamp: '22:30', title: 'Real-World Case Studies in enterprise', summary: 'Demonstrations of automated software coding, financial audit analysis, and healthcare diagnostic support systems.' },
      { timestamp: '34:00', title: 'Ethical Guardrails & System Alignment', summary: 'Addressing token consumption costs, model drift, and establishing safety bounds for self-improving agents.' }
    ],
    insights: [
      { title: 'Chatbots are Obsolete', description: 'Conversational prompts are being replaced by programmatic loops, allowing models to evaluate their own output and retry failed steps.' },
      { title: 'The Rise of Specialized Teams', description: 'Single generalist models are outperformed by a swarm of specialized, collaborative agent nodes running dedicated tasks.' },
      { title: 'High Orchestration ROI', description: 'While agentic loops consume more API tokens, the resulting accuracy and ability to solve open-ended tasks is 5x higher.' }
    ],
    actionItems: [
      "Evaluate business workflows for cognitive bottlenecks (e.g. data triage) that can be delegated to Multi-Agent platforms.",
      "Incorporate vector embeddings and semantic indexes to provide agent nodes with unified organizational context.",
      "Establish strict budget caps and dry-run boundaries for autonomous tool integrations."
    ],
    topics: [
      { topic: 'Agentic Infrastructure', percentage: 40, description: 'Cognitive loop architectures, planning systems, and self-reflection mechanics.' },
      { topic: 'Enterprise Integrations', percentage: 30, description: 'Business software development, automated support systems, and audit logs.' },
      { topic: 'Cost & Efficiency Metrics', percentage: 15, description: 'Token budgeting, LLM cache optimizations, and latency profiles.' },
      { topic: 'Safety & Guardrails', percentage: 15, description: 'System trust, boundary enforcement, and human-in-the-loop triggers.' }
    ],
    conclusion: 'AI has shifted from "assistants that write" to "agents that act". Organizations that build scalable agent infrastructure today will gain massive productivity compounding advantages.',
    keywords: ['Agentic AI', 'Multi-Agent', 'Enterprise AI', 'System Design', 'Ethical AI', 'Technology Keynote'],
    sentiment: {
      label: 'Inspirational',
      score: 88,
      explanation: 'Energizing, visionary delivery emphasizing human-AI partnership, balanced with deep engineering realism.'
    },
    learningObjectives: [
      "Differentiate between simple chatbot agents and autonomous multi-agent environments.",
      "Analyze architectural strategies for supervisor models and peer-to-peer agent delegation.",
      "Examine ROI and token consumption metrics associated with agentic loops."
    ],
    majorConcepts: [
      {
        concept: "Agentic Loop Workflows",
        explanation: "Systems where the LLM executes in an iterative loop of planning, tool execution, and reflection, rather than generating a single prompt response.",
        subtopics: [
          { title: "Iterative Reflection", explanation: "Allowing the agent to review its own execution logs, catch exceptions, and rerun code blocks." }
        ],
        definitions: [
          { term: "Agentic AI", definition: "AI systems capable of setting goals, using external APIs/tools, and reflecting on results asynchronously." }
        ],
        examples: [
          { example: "Self-correcting code generator", description: "An agent runs a script, gets a syntax error, reads the stack trace, modifies the script, and successfully runs it on the second try." }
        ],
        formulas: [
          { formula: "Accuracy_Gain = Loop_Iterations * Reflections", explanation: "Models the reliability growth of output relative to iteration depth." }
        ],
        workflows: [
          { step: "Goal Ingestion", description: "Ingest user prompt and draft a sequential task checklist." },
          { step: "Tool Execution & Observation", description: "Invoke system commands or APIs and read outputs." },
          { step: "Output Reflection", description: "Evaluate results against goal constraints and revise plan if errors occur." }
        ]
      }
    ],
    importantDefinitions: [
      { term: "Agentic AI", definition: "AI systems capable of setting goals, using external APIs/tools, and reflecting on results asynchronously." }
    ],
    examples: [
      { example: "Self-correcting code generator", description: "An agent runs a script, gets a syntax error, reads the stack trace, modifies the script, and successfully runs it on the second try." }
    ],
    importantFormulas: [
      { formula: "Accuracy_Gain = Loop_Iterations * Reflections", explanation: "Models the reliability growth of output relative to iteration depth." }
    ],
    practicalApplications: [
      { application: "Automated Software Audits", description: "Deploying multi-agent networks to inspect code repositories for security flaws." }
    ],
    quickRevisionNotes: `# Agentic AI Sheet
- **Core Loop:** Plan -> Execute -> Reflect -> Correct.
- **Supervisor Topology:** Central controller coordinates worker agents.
- **Token Efficiency:** Loops cost more tokens but yield 5x better accuracy on logic tasks.`,
    faq: [
      { question: "What is the biggest challenge of Agentic AI?", answer: "Cost management and infinite loops. Infinite looping can deplete token budgets if limits are not capped." }
    ],
    interviewQuestions: [
      { question: "How do you manage state in multi-agent routing configurations?", answer: "We use a centralized state graph (like in LangGraph) where each worker writes updates to a shared thread, which the supervisor evaluates before routing." }
    ],
    examPreparationNotes: [
      "Explain when to choose a multi-agent framework over a single agent prompt.",
      "Define the difference between peer-to-peer delegation and hierarchical supervisors."
    ],
    theme: "AI/ML",
    difficultyLevel: "Advanced",
    estimatedReadTime: "15 mins",
    estimatedRevisionTime: "5 mins",
    contentQualityScore: 96,
    mcqs: [
      { question: "Which layout delegates work through a central controller?", options: ["Supervisor Topology", "Chained Topology", "Peer to peer Topology", "None of the above"], correctAnswer: "Supervisor Topology" }
    ],
    resumeProjectSummary: null
  }
};

// Procedural fallback synopsis for any other random video URL
const generateRandomSynopsis = (url: string, id: string): Omit<SynopsisData, 'id' | 'createdAt' | 'saved'> => {
  return {
    metadata: {
      id: `vid_${id}`,
      youtubeId: id,
      title: `AI-Generated Video Synthesis: Deep Learning Analysis (${id})`,
      channelName: 'TechVanguard Network',
      duration: '24:15',
      publishDate: new Date().toISOString().split('T')[0],
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      youtubeUrl: url,
      views: '12,500'
    },
    executiveSummary: 'This document presents an automatically generated synopsis of the submitted YouTube video. The AI analyzer parsed the transcript to distill primary educational paradigms, engineering principles, and actionable strategies discussed by the speaker. Key takeaways indicate an emphasis on rapid prototyping, cloud-native scalability, and cross-functional user experiences.',
    introduction: 'This fallback synopsis analyzes the provided video. It breaks down design principles, rapid prototyping methodologies, and scalable server structures.',
    detailedExplanation: `# Video Analysis: Foundational Principles

## 1. System Engineering Basics
The speaker reviews basic software architecture patterns. Special emphasis is given to decoupled systems and rapid iteration cycles.

## 2. Practical Optimizations
To support production traffic, setups must use caching strategies and type validation.`,
    chapters: [
      { timestamp: '00:00', title: 'Contextual Baseline & Background', summary: 'Establishing the core problem domain and reviewing historical precedents in the industry.' },
      { timestamp: '05:30', title: 'Core Methodology & Frameworks', summary: 'An analysis of the practical strategies, architectures, and design choices recommended by the channel.' },
      { timestamp: '14:20', title: 'Implementation Hurdles & Trade-offs', summary: 'Discussing limitations, potential failure modes, cost implications, and integration constraints.' },
      { timestamp: '20:00', title: 'Future Horizons & Summary', summary: 'Forecasting evolution in the space and providing a neat consolidation of actionable recommendations.' }
    ],
    insights: [
      { title: 'Modular Architecture First', description: 'Decoupling services prevents blast-radius failures and enables parallel engineering sprints.' },
      { title: 'Iterative Data Validation', description: 'Early sanitation and structured payloads reduce runtime exceptions by up to 45%.' },
      { title: 'Feedback Loops Matter', description: 'Successful implementation relies heavily on monitoring telemetry and continuous user feedback cycles.' }
    ],
    actionItems: [
      "Review current structural designs to verify they align with the speaker's recommendations.",
      "Conduct stress testing on integration APIs to document failure recovery behaviors.",
      "Implement user behavioral analytics to map and improve critical interaction paths."
    ],
    topics: [
      { topic: 'Core Concepts & Paradigms', percentage: 45, description: 'Theoretical pillars and foundational explanations.' },
      { topic: 'Practical Implementation', percentage: 35, description: 'Step-by-step instructions, code snippets, and structural designs.' },
      { topic: 'Optimizations & Tradeoffs', percentage: 20, description: 'Resource limits, performance profiles, and roadmap decisions.' }
    ],
    conclusion: 'The video outlines a robust framework for understanding contemporary software practices. Incorporating these insights will accelerate deployment speeds while keeping tech debt low.',
    keywords: ['AI Analytics', 'System Design', 'Best Practices', 'Software Engineering', 'Innovation'],
    sentiment: {
      label: 'Informative',
      score: 85,
      explanation: 'Maintains a highly clear, structured, and informative tone, focusing purely on logical extraction.'
    },
    learningObjectives: [
      "Develop an initial baseline for rapid prototyping and cloud deployment.",
      "Understand key modular architectures to prevent blast-radius system failures."
    ],
    majorConcepts: [
      {
        concept: "Modular Architecture & Prototyping",
        explanation: "Decoupling services allows independent development, scale, and hot-swappable deployments.",
        subtopics: [
          { title: "Blast Radius Isolation", explanation: "Structuring services such that database crashes in one service don't block the API of another service." }
        ],
        definitions: [
          { term: "Rapid Prototyping", definition: "A methodology oriented around fast builds and early integrations over high early polish." }
        ],
        examples: [
          { example: "Deploying a sandbox workspace", description: "Establishing a mock database and test API within 10 minutes to test service messaging." }
        ],
        formulas: [],
        workflows: [
          { step: "Service Initialization", description: "Create independent project files and config configurations." },
          { step: "API Binding", description: "Expose endpoints and document interaction parameters." }
        ]
      }
    ],
    importantDefinitions: [
      { term: "Rapid Prototyping", definition: "A methodology oriented around fast builds and early integrations over high early polish." }
    ],
    examples: [
      { example: "Deploying a sandbox workspace", description: "Establishing a mock database and test API within 10 minutes to test service messaging." }
    ],
    importantFormulas: [],
    practicalApplications: [
      { application: "Software Integration", description: "Configuring development playgrounds before releasing to production environments." }
    ],
    quickRevisionNotes: `# Quick Notes
- **Modular designs:** Decouple services to isolate database crashes.
- **Telemetry logging:** Gather early logs to trace runtime failures.`,
    faq: [
      { question: "What is rapid prototyping?", answer: "A development style focused on constructing raw models quickly to test system integration before detailing specific logic." }
    ],
    interviewQuestions: [
      { question: "Why is blast-radius mapping important?", answer: "It prevents database errors in secondary services from breaking primary customer-facing UI APIs." }
    ],
    examPreparationNotes: [
      "Be prepared to explain when to use modular layouts over monolithic setups.",
      "Recall the percentage speedups associated with early data validations."
    ],
    theme: "General",
    difficultyLevel: "Intermediate",
    estimatedReadTime: "6 mins",
    estimatedRevisionTime: "2 mins",
    contentQualityScore: 88,
    mcqs: [
      { question: "What is the primary core objective analyzed in this video study handbook?", options: ["Mastering the key concepts and practical workflows", "Deploying horizontal cluster modules", "Scaling database latency pools", "None of the above"], correctAnswer: "Mastering the key concepts and practical workflows" }
    ],
    resumeProjectSummary: null
  };
};

export const synopsisService = {
  // Submit URL and get structured summary
  async generateSynopsis(
    youtubeUrl: string,
    options?: { summaryLength?: 'short' | 'medium' | 'long'; includeSentiment?: boolean; outputFormat?: 'web' | 'pdf' | 'ppt' }
  ): Promise<SynopsisData> {
    const youtubeId = getYouTubeId(youtubeUrl);
    if (!youtubeId) {
      throw new Error('Invalid YouTube URL format. Supported formats: youtube.com/watch?v=XXXX or youtu.be/XXXX');
    }

    if (IS_DEMO_MODE) {
      return new Promise<SynopsisData>((resolve) => {
        setTimeout(() => {
          // Check for specific demo videos
          let baseData;
          if (youtubeUrl.includes('8pDquaF545o') || youtubeUrl.toLowerCase().includes('react')) {
            baseData = DEMO_SUMMARIES.react19;
          } else if (youtubeUrl.includes('yR73Vz57C5w') || youtubeUrl.toLowerCase().includes('ai') || youtubeUrl.toLowerCase().includes('agent')) {
            baseData = DEMO_SUMMARIES.ai_keynote;
          } else {
            baseData = generateRandomSynopsis(youtubeUrl, youtubeId);
          }

          const synopsis: SynopsisData = {
            ...baseData,
            id: `syn_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            saved: false
          };

          // Save to local storage history
          const history = this.getLocalHistory();
          history.unshift(synopsis);
          localStorage.setItem('synopsis_history', JSON.stringify(history));

          resolve(synopsis);
        }, 3000); // 3-second loader simulation (UX loader visual)
      });
    }

    // Real API Call
    try {
      const response = await api.post<SynopsisData>('/synopsis/generate', { youtubeUrl, ...options });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverDetail =
          (error.response?.data as { detail?: string } | undefined)?.detail ||
          (error.response?.data as { message?: string } | undefined)?.message;
        throw new Error(serverDetail || error.message || 'Failed to generate synopsis.');
      }
      throw error;
    }
  },

  // Get all previously processed summaries
  async getHistory(): Promise<SynopsisData[]> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getLocalHistory());
        }, 500);
      });
    }

    const response = await api.get<SynopsisData[]>('/synopsis/history');
    return response.data;
  },

  // Get single synopsis by ID
  async getById(id: string): Promise<SynopsisData> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const history = this.getLocalHistory();
          const item = history.find(s => s.id === id);
          if (item) {
            resolve(item);
          } else {
            reject(new Error('Synopsis not found in your database.'));
          }
        }, 300);
      });
    }

    const response = await api.get<SynopsisData>(`/synopsis/${id}`);
    return response.data;
  },

  // Toggle Save Summary
  async toggleSave(id: string): Promise<SynopsisData> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve, reject) => {
        const history = this.getLocalHistory();
        const index = history.findIndex(s => s.id === id);
        if (index !== -1) {
          history[index].saved = !history[index].saved;
          localStorage.setItem('synopsis_history', JSON.stringify(history));
          resolve(history[index]);
        } else {
          reject(new Error('Synopsis not found.'));
        }
      });
    }

    const response = await api.post<SynopsisData>(`/synopsis/${id}/save`);
    return response.data;
  },

  // Delete from history
  async deleteSynopsis(id: string): Promise<void> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve) => {
        const history = this.getLocalHistory();
        const filtered = history.filter(s => s.id !== id);
        localStorage.setItem('synopsis_history', JSON.stringify(filtered));
        resolve();
      });
    }

    await api.delete(`/synopsis/${id}`);
  },

  // Download PDF simulation or client side PDF download
  downloadPDF(synopsis: SynopsisData): void {
    // Generate styled HTML specifically structured for a beautiful print layout, then trigger window.print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to download the PDF.');
      return;
    }

    const safeTitle = synopsis.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    // Markdown formatting helper
    const formatMarkdown = (text: string | undefined): string => {
      if (!text) return '';
      let html = text;
      // Escape HTML entities to prevent breakage, except we want our formatting tags to work
      html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // Restore specific safe tags we will generate
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html = html.replace(/`(.*?)`/g, '<code>$1</code>');
      html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
      html = html.replace(/^### (.*)$/gim, '<h4>$1</h4>');
      html = html.replace(/^## (.*)$/gim, '<h3>$1</h3>');
      html = html.replace(/^# (.*)$/gim, '<h2>$1</h2>');
      
      html = html.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('<li>') || trimmed.startsWith('<h4>') || trimmed.startsWith('<h3>') || trimmed.startsWith('<h2>') || trimmed.startsWith('<strong>')) {
          return line;
        }
        return trimmed ? `<p>${trimmed}</p>` : '';
      }).join('\n');
      return html;
    };

    const difficulty = synopsis.difficultyLevel || 'Intermediate';
    const read_time = synopsis.estimatedReadTime || '10 mins';
    const rev_time = synopsis.estimatedRevisionTime || '3 mins';
    const views = synopsis.metadata.views || 'N/A';
    const duration = synopsis.metadata.duration || 'N/A';
    const quality_score = synopsis.contentQualityScore || 90;

    // Aggregation of Definitions
    let allDefs = synopsis.importantDefinitions || [];
    if (synopsis.majorConcepts && synopsis.majorConcepts.length > 0) {
      const tempDefs: Array<{ term: string; definition: string }> = [];
      synopsis.majorConcepts.forEach(c => {
        if (c.definitions) {
          c.definitions.forEach(d => {
            if (!tempDefs.some(td => td.term.toLowerCase() === d.term.toLowerCase())) {
              tempDefs.push(d);
            }
          });
        }
      });
      if (tempDefs.length > 0) allDefs = tempDefs;
    }

    // Aggregation of Formulas
    let allFormulas = synopsis.importantFormulas || [];
    if (synopsis.majorConcepts && synopsis.majorConcepts.length > 0) {
      const tempFormulas: Array<{ formula: string; explanation: string }> = [];
      synopsis.majorConcepts.forEach(c => {
        if (c.formulas) {
          c.formulas.forEach(f => {
            if (!tempFormulas.some(tf => tf.formula === f.formula)) {
              tempFormulas.push(f);
            }
          });
        }
      });
      if (tempFormulas.length > 0) allFormulas = tempFormulas;
    }

    // Aggregation of Examples
    let allExamples = synopsis.examples || [];
    if (synopsis.majorConcepts && synopsis.majorConcepts.length > 0) {
      const tempExamples: Array<{ example: string; description: string }> = [];
      synopsis.majorConcepts.forEach(c => {
        if (c.examples) {
          c.examples.forEach(e => {
            if (!tempExamples.some(te => te.example.toLowerCase() === e.example.toLowerCase())) {
              tempExamples.push(e);
            }
          });
        }
      });
      if (tempExamples.length > 0) allExamples = tempExamples;
    }

    const objectivesHTML = synopsis.learningObjectives && synopsis.learningObjectives.length > 0 ? `
      <div class="section-container">
        <h2>1. Learning Objectives</h2>
        <div class="objectives-box">
          <p>By the end of this study guide, you should be able to:</p>
          <ul>
            ${synopsis.learningObjectives.map(o => `<li>${o}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : '';

    const introductionHTML = synopsis.introduction ? `
      <div class="section-container">
        <h2>2. Course Introduction & Overview</h2>
        <div class="introduction-box">
          <p>${synopsis.introduction}</p>
        </div>
      </div>
    ` : '';

    const detailedExplanationHTML = synopsis.detailedExplanation ? `
      <div class="section-container page-break-before">
        <h2>3. Detailed Reference & Learning Notes</h2>
        <div class="markdown-content">
          ${formatMarkdown(synopsis.detailedExplanation)}
        </div>
      </div>
    ` : '';

    let majorConceptsHTML = '';
    const conceptsSource = (synopsis.majorConcepts && synopsis.majorConcepts.length > 0) 
      ? synopsis.majorConcepts 
      : (synopsis.keyConcepts || []);

    if (conceptsSource.length > 0) {
      majorConceptsHTML = `
        <div class="section-container page-break-before">
          <h2>4. Core Theoretical Pillars & Concepts</h2>
          <div class="concepts-list">
            ${conceptsSource.map((c: any, idx: number) => {
              const hasSubtopics = c.subtopics && c.subtopics.length > 0;
              const hasDefs = c.definitions && c.definitions.length > 0;
              const hasExs = c.examples && c.examples.length > 0;
              const hasForms = c.formulas && c.formulas.length > 0;
              const hasWfs = c.workflows && c.workflows.length > 0;

              return `
                <div class="concept-block">
                  <div class="concept-block-header">
                    <span class="concept-index">Concept 0${idx + 1}</span>
                    <h3 class="concept-block-title">${c.concept || c.conceptName || ''}</h3>
                  </div>
                  <p class="concept-block-desc">${c.explanation}</p>
                  
                  ${hasSubtopics ? `
                    <div class="nested-section">
                      <h4>Subtopics & Details</h4>
                      <div class="nested-grid">
                        ${c.subtopics.map((st: any) => `
                          <div class="subtopic-card">
                            <strong>${st.title}</strong>
                            <p>${st.explanation}</p>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}

                  ${hasWfs ? `
                    <div class="nested-section">
                      <h4>Process Workflow / Implementation Steps</h4>
                      <div class="workflow-timeline">
                        ${c.workflows.map((wf: any, wfIdx: number) => `
                          <div class="workflow-timeline-step">
                            <span class="wf-step-num">${wfIdx + 1}</span>
                            <div class="wf-step-content">
                              <strong>${wf.step}</strong>
                              <p>${wf.description}</p>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}

                  ${hasDefs ? `
                    <div class="nested-section">
                      <h4>Terminology & Glossary</h4>
                      <ul>
                        ${c.definitions.map((d: any) => `<li><strong>${d.term}:</strong> ${d.definition}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  ${hasExs ? `
                    <div class="nested-section">
                      <h4>Examples & Cases</h4>
                      ${c.examples.map((ex: any) => `
                        <div class="concept-example-box">
                          <strong>${ex.example}</strong>
                          <p>${ex.description}</p>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}

                  ${hasForms ? `
                    <div class="nested-section">
                      <h4>Formulas & Equations</h4>
                      <div class="concept-formulas-grid">
                        ${c.formulas.map((form: any) => `
                          <div class="concept-formula-item">
                            <code>${form.formula}</code>
                            <span>${form.explanation}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    const definitionsHTML = allDefs.length > 0 ? `
      <div class="section-container page-break-before">
        <h2>5. Terminology Glossary Index</h2>
        <table class="glossary-table">
          <thead>
            <tr>
              <th>Term / Acronym</th>
              <th>Definition & Technical Explanation</th>
            </tr>
          </thead>
          <tbody>
            ${allDefs.map(d => `
              <tr>
                <td class="glossary-term">${d.term}</td>
                <td>${d.definition}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const timelineHTML = synopsis.chapters && synopsis.chapters.length > 0 ? `
      <div class="section-container page-break-before">
        <h2>6. Video Lectures Timeline</h2>
        <div class="timeline-container">
          ${synopsis.chapters.map(c => `
            <div class="timeline-row">
              <div class="timeline-time">${c.timestamp}</div>
              <div class="timeline-content">
                <div class="timeline-title">${c.title}</div>
                <p class="timeline-text">${c.summary}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const practicalHTML = allExamples.length > 0 || (synopsis.practicalApplications && synopsis.practicalApplications.length > 0) ? `
      <div class="section-container page-break-before">
        <h2>7. Practical Applications & Real-World Cases</h2>
        
        ${allExamples.length > 0 ? `
          <h3>Aggregated Case Studies & Examples</h3>
          <div style="margin-bottom: 25px;">
            ${allExamples.map((e, idx) => `
              <div class="example-box">
                <div class="example-title">Example 0${idx + 1}: ${e.example}</div>
                <p>${e.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${synopsis.practicalApplications && synopsis.practicalApplications.length > 0 ? `
          <h3>Industry Applications</h3>
          <div class="apps-grid">
            ${synopsis.practicalApplications.map(a => `
              <div class="app-card">
                <strong>${a.application}</strong>
                <p>${a.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    ` : '';

    const formulasHTML = allFormulas.length > 0 ? `
      <div class="section-container page-break-before">
        <h2>8. Formulas Reference Index</h2>
        <div class="formulas-container">
          ${allFormulas.map(f => `
            <div class="formula-card">
              <div class="formula-eqn"><code>${f.formula}</code></div>
              <div class="formula-explanation">${f.explanation}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const mcqsHTML = synopsis.mcqs && synopsis.mcqs.length > 0 ? `
      <div class="section-container page-break-before">
        <h2>9. Self-Assessment Quiz (MCQs)</h2>
        <p style="font-size: 13px; color: #6b7280; margin-top: -10px; margin-bottom: 20px;">Evaluate your understanding of the curriculum. Answers keys are listed at the bottom.</p>
        <div class="mcq-container">
          ${synopsis.mcqs.map((m, idx) => `
            <div class="mcq-card">
              <div class="mcq-question">Q${idx + 1}. ${m.question}</div>
              <div class="mcq-options">
                ${m.options.map((opt, oIdx) => `
                  <div class="mcq-option">
                    <span class="option-marker">${['A', 'B', 'C', 'D'][oIdx]}</span>
                    <span>${opt}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="mcq-answers-box">
          <strong>MCQ Solution Guide:</strong>
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 10px; font-size: 14px;">
            ${synopsis.mcqs.map((m, idx) => `
              <div><strong>Question ${idx + 1}:</strong> ${m.correctAnswer}</div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : '';

    const examPrepHTML = (synopsis.examPreparationNotes && synopsis.examPreparationNotes.length > 0) || (synopsis.quickRevisionNotes) ? `
      <div class="section-container page-break-before">
        <h2>10. Exam Preparation & Quick Revision Guide</h2>
        
        ${synopsis.quickRevisionNotes ? `
          <div class="takeaways-list" style="margin-bottom: 25px;">
            <h3>Quick Revision Summary</h3>
            <div class="markdown-content">
              ${formatMarkdown(synopsis.quickRevisionNotes)}
            </div>
          </div>
        ` : ''}

        ${synopsis.examPreparationNotes && synopsis.examPreparationNotes.length > 0 ? `
          <div class="exam-tips-box">
            <strong>🎯 High-Yield Exam Focus Areas:</strong>
            <ul>
              ${synopsis.examPreparationNotes.map(n => `<li>${n}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    ` : '';

    const faqHTML = (synopsis.faq && synopsis.faq.length > 0) || (synopsis.interviewQuestions && synopsis.interviewQuestions.length > 0) ? `
      <div class="section-container page-break-before">
        <h2>11. Q&A, FAQs & Interview Preparation</h2>
        
        ${synopsis.faq && synopsis.faq.length > 0 ? `
          <h3>Frequently Asked Questions</h3>
          <div style="margin-bottom: 25px;">
            ${synopsis.faq.map(f => `
              <div class="qa-item">
                <div class="qa-question">Q: ${f.question}</div>
                <div class="qa-answer">${f.answer}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${synopsis.interviewQuestions && synopsis.interviewQuestions.length > 0 ? `
          <h3>Technical Interview Question Bank</h3>
          <div>
            ${synopsis.interviewQuestions.map(q => `
              <div class="qa-item border-brand-left">
                <div class="qa-question">Interview Question: ${q.question}</div>
                <div class="qa-answer"><strong>Recommended Response:</strong> ${q.answer}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    ` : '';

    const resumeHTML = synopsis.resumeProjectSummary && synopsis.resumeProjectSummary.projectTitle ? `
      <div class="section-container page-break-before">
        <h2>12. Professional Project Profile & Resume Integration</h2>
        <div class="resume-card">
          <div class="resume-project-title">Project: ${synopsis.resumeProjectSummary.projectTitle}</div>
          <div style="margin-top: 5px; font-size: 13px; color: #4b5563;">
            <strong>Technologies Used:</strong> ${synopsis.resumeProjectSummary.technologiesUsed.join(', ')}
          </div>
          
          <h4 style="margin-top: 15px; margin-bottom: 5px; font-size: 14px;">Key Features Built:</h4>
          <ul style="padding-left: 20px; font-size: 13px; margin-top: 0;">
            ${synopsis.resumeProjectSummary.keyFeatures.map(f => `<li>${f}</li>`).join('')}
          </ul>

          <h4 style="margin-top: 15px; margin-bottom: 5px; font-size: 14px;">Recommended Resume Bullet Points:</h4>
          <ul style="list-style: none; padding-left: 0; margin-top: 0; font-size: 13px;">
            ${synopsis.resumeProjectSummary.resumeBulletPoints.map(b => `
              <li style="margin-bottom: 8px; position: relative; padding-left: 15px;">
                <span style="position: absolute; left: 0; color: #6d28d9;">•</span>
                ${b}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    ` : '';

    const htmlContent = `
      <html>
        <head>
          <title>StudyGuide_${safeTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;700;800&display=swap');
            
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1f2937;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              font-size: 14px;
            }

            /* Cover Page Styling */
            .cover-page {
              height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 40px;
              box-sizing: border-box;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              page-break-after: always;
              position: relative;
              background-color: #faf5ff;
            }
            .cover-accent {
              position: absolute;
              top: 0; left: 0; right: 0;
              height: 12px;
              background: linear-gradient(90deg, #6d28d9 0%, #9333ea 100%);
              border-top-left-radius: 11px;
              border-top-right-radius: 11px;
            }
            .cover-top {
              margin-top: 40px;
            }
            .cover-subtitle {
              font-family: 'Outfit', sans-serif;
              font-size: 12px;
              font-weight: 700;
              color: #6d28d9;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .cover-title {
              font-family: 'Outfit', sans-serif;
              font-size: 30px;
              font-weight: 800;
              color: #111827;
              line-height: 1.2;
              margin-top: 15px;
              margin-bottom: 25px;
            }
            .cover-channel {
              font-size: 16px;
              font-weight: 600;
              color: #4b5563;
            }
            .cover-middle {
              margin: 40px 0;
            }
            .learning-metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .metric-card {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .metric-value {
              font-family: 'Outfit', sans-serif;
              font-size: 18px;
              font-weight: 700;
              color: #6d28d9;
            }
            .metric-label {
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              margin-top: 4px;
              font-weight: 600;
            }
            .cover-bottom {
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #6b7280;
            }

            /* Document Layout */
            .section-container {
              margin-bottom: 30px;
            }
            h2 {
              font-family: 'Outfit', sans-serif;
              font-size: 18px;
              color: #4c1d95;
              border-bottom: 2px solid #ddd6fe;
              padding-bottom: 6px;
              margin-top: 35px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            h3 {
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              color: #111827;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            h4 {
              font-family: 'Outfit', sans-serif;
              font-size: 13px;
              color: #1f2937;
              margin-top: 15px;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            p {
              margin: 0 0 12px 0;
            }

            .objectives-box {
              background-color: #f5f3ff;
              border: 1px solid #ddd6fe;
              padding: 15px 20px;
              border-radius: 8px;
            }
            .objectives-box ul {
              margin: 5px 0 0 0;
              padding-left: 20px;
            }
            .objectives-box li {
              margin-bottom: 6px;
              color: #374151;
            }

            .introduction-box {
              background-color: #f9fafb;
              border-left: 4px solid #6d28d9;
              padding: 15px;
              border-radius: 0 8px 8px 0;
              font-style: italic;
            }

            /* Hierarchical Concept Blocks */
            .concepts-list {
              display: flex;
              flex-direction: column;
              gap: 25px;
            }
            .concept-block {
              border: 1px solid #e5e7eb;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
              page-break-inside: avoid;
            }
            .concept-block-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;
              border-bottom: 1px solid #f3f4f6;
              padding-bottom: 8px;
            }
            .concept-index {
              font-family: 'Outfit', sans-serif;
              font-weight: 700;
              font-size: 11px;
              color: #ffffff;
              background: linear-gradient(90deg, #6d28d9 0%, #9333ea 100%);
              padding: 3px 8px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .concept-block-title {
              font-family: 'Outfit', sans-serif;
              font-weight: 700;
              color: #111827;
              font-size: 16px;
              margin: 0;
            }
            .concept-block-desc {
              font-size: 13.5px;
              color: #4b5563;
              line-height: 1.5;
            }
            .nested-section {
              margin-top: 15px;
              border-top: 1px dashed #e5e7eb;
              padding-top: 12px;
            }
            .nested-section h4 {
              margin-top: 0;
              color: #6d28d9;
              font-size: 12px;
              margin-bottom: 8px;
            }
            .nested-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .subtopic-card {
              background: #f9fafb;
              border: 1px solid #f3f4f6;
              padding: 10px 12px;
              border-radius: 6px;
            }
            .subtopic-card strong {
              font-size: 12.5px;
              color: #111827;
              display: block;
              margin-bottom: 4px;
            }
            .subtopic-card p {
              font-size: 11.5px;
              color: #4b5563;
              margin: 0;
            }
            
            /* Workflow timeline in concepts */
            .workflow-timeline {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .workflow-timeline-step {
              display: flex;
              gap: 12px;
            }
            .wf-step-num {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              background-color: #f3e8ff;
              border: 1px solid #d8b4fe;
              border-radius: 50%;
              color: #6d28d9;
              font-size: 11px;
              font-weight: bold;
              flex-shrink: 0;
            }
            .wf-step-content {
              font-size: 12px;
            }
            .wf-step-content strong {
              color: #111827;
            }
            .wf-step-content p {
              margin: 2px 0 0 0;
              color: #4b5563;
            }

            .concept-example-box {
              background-color: #faf5ff;
              border-left: 3px solid #c084fc;
              padding: 8px 12px;
              margin-bottom: 8px;
              border-radius: 0 4px 4px 0;
            }
            .concept-example-box strong {
              font-size: 12.5px;
              color: #7c3aed;
              display: block;
              margin-bottom: 2px;
            }
            .concept-example-box p {
              font-size: 12px;
              color: #4b5563;
              margin: 0;
            }
            .concept-formulas-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .concept-formula-item {
              background: #fffbeb;
              border: 1px solid #fef3c7;
              padding: 8px 12px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .concept-formula-item code {
              background: #fde68a;
              padding: 3px 8px;
              border-radius: 4px;
              font-family: Courier, monospace;
              font-weight: bold;
              color: #b45309;
            }
            .concept-formula-item span {
              font-size: 12px;
              color: #78350f;
            }

            /* Glossary table */
            .glossary-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 13px;
            }
            .glossary-table th, .glossary-table td {
              border: 1px solid #e5e7eb;
              padding: 10px 12px;
              text-align: left;
            }
            .glossary-table th {
              background-color: #f9fafb;
              color: #111827;
              font-weight: 600;
            }
            .glossary-term {
              font-weight: 700;
              color: #6d28d9;
              width: 30%;
            }

            /* Timeline */
            .timeline-container {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            .timeline-row {
              display: flex;
              gap: 15px;
              page-break-inside: avoid;
            }
            .timeline-time {
              font-family: 'Outfit', sans-serif;
              font-weight: 700;
              color: #6d28d9;
              background: #f5f3ff;
              border: 1px solid #ddd6fe;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              height: fit-content;
              min-width: 60px;
              text-align: center;
            }
            .timeline-content {
              flex-grow: 1;
              border-bottom: 1px dashed #e5e7eb;
              padding-bottom: 10px;
            }
            .timeline-title {
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
            }
            .timeline-text {
              font-size: 13px;
              color: #4b5563;
              margin: 0;
            }

            /* Examples & Apps */
            .example-box {
              background-color: #fcfaff;
              border-left: 4px solid #c084fc;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 0 8px 8px 0;
              page-break-inside: avoid;
            }
            .example-title {
              font-family: 'Outfit', sans-serif;
              font-weight: 700;
              color: #7c3aed;
              margin-bottom: 6px;
            }
            .apps-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .app-card {
              border: 1px dashed #c084fc;
              background: #fffbfb;
              padding: 15px;
              border-radius: 8px;
              page-break-inside: avoid;
            }

            /* Formulas */
            .formulas-container {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            .formula-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              display: flex;
              align-items: center;
              gap: 20px;
              page-break-inside: avoid;
            }
            .formula-eqn {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              font-weight: 700;
              color: #b45309;
              background: #fffbeb;
              border: 1px solid #fde68a;
              padding: 8px 15px;
              border-radius: 6px;
              min-width: 150px;
              text-align: center;
            }
            .formula-explanation {
              font-size: 13px;
              color: #4b5563;
            }

            /* MCQ Quiz */
            .mcq-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .mcq-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              background: #ffffff;
              page-break-inside: avoid;
            }
            .mcq-question {
              font-weight: 600;
              margin-bottom: 12px;
              color: #111827;
            }
            .mcq-options {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .mcq-option {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;
              color: #4b5563;
            }
            .option-marker {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              font-size: 10px;
              font-weight: 700;
              color: #374151;
            }
            .mcq-answers-box {
              margin-top: 20px;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 15px;
              border-radius: 8px;
              color: #166534;
            }

            /* Takeaways & Exam tips */
            .takeaways-list ul {
              padding-left: 20px;
              margin: 0;
            }
            .takeaways-list li {
              margin-bottom: 8px;
              color: #374151;
            }
            .exam-tips-box {
              background: #fffbeb;
              border: 1px solid #fef3c7;
              border-left: 4px solid #d97706;
              padding: 15px;
              border-radius: 0 8px 8px 0;
              color: #78350f;
              margin-top: 20px;
            }
            .exam-tips-box ul {
              margin: 5px 0 0 0;
              padding-left: 20px;
            }
            .exam-tips-box li {
              margin-bottom: 5px;
            }

            /* FAQs & QA */
            .qa-item {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .border-brand-left {
              border-left: 4px solid #6d28d9;
              background: #fcfaff;
            }
            .qa-question {
              font-family: 'Outfit', sans-serif;
              font-weight: 700;
              color: #111827;
              margin-bottom: 6px;
              font-size: 14px;
            }
            .qa-answer {
              font-size: 13px;
              color: #4b5563;
            }

            /* Resume summary */
            .resume-card {
              border: 2px dashed #6d28d9;
              background-color: #faf8ff;
              padding: 20px;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .resume-project-title {
              font-family: 'Outfit', sans-serif;
              font-size: 16px;
              font-weight: 800;
              color: #4c1d95;
            }

            /* Markdown rendering */
            .markdown-content p {
              margin-bottom: 12px;
              color: #374151;
            }
            .markdown-content li {
              margin-bottom: 6px;
              color: #374151;
            }
            .markdown-content code {
              background: #f3f4f6;
              padding: 2px 4px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 12px;
            }
            .markdown-content h3 {
              color: #6d28d9;
              font-size: 14px;
              border-bottom: 1px solid #f3f4f6;
              padding-bottom: 4px;
              margin-top: 20px;
            }
            .markdown-content h4 {
              color: #111827;
              font-size: 13px;
            }

            /* Page Break utilities */
            .page-break-before {
              page-break-before: always;
            }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          
          <!-- COVER PAGE -->
          <div class="cover-page">
            <div class="cover-accent"></div>
            
            <div class="cover-top">
              <div class="cover-subtitle">AI Video Study Handbook</div>
              <h1 class="cover-title">${synopsis.metadata.title}</h1>
              <div class="cover-channel">Lecturer/Channel: ${synopsis.metadata.channelName}</div>
            </div>

            <div class="cover-middle">
              <div class="learning-metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${difficulty}</div>
                  <div class="metric-label">Difficulty Profile</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${read_time}</div>
                  <div class="metric-label">Estimated Read Time</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${rev_time}</div>
                  <div class="metric-label">Revision Budget</div>
                </div>
              </div>
              
              <div class="learning-metrics-grid" style="margin-top: 15px;">
                <div class="metric-card">
                  <div class="metric-value">${duration} mins</div>
                  <div class="metric-label">Video Length</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${views}</div>
                  <div class="metric-label">Audience Views</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${quality_score}/100</div>
                  <div class="metric-label">Quality Index</div>
                </div>
              </div>
            </div>

            <div class="cover-bottom">
              <span>Generated on ${new Date(synopsis.createdAt).toLocaleDateString()}</span>
              <span>Prepared by Video Synopsis AI Study Assistant</span>
            </div>
          </div>

          <!-- EXECUTIVE SUMMARY -->
          <div class="section-container">
            <h2>Executive Summary & Main Intent</h2>
            <p>${synopsis.executiveSummary}</p>
            
            <h3 style="margin-top: 25px;">Key Subtopics Distribution</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${synopsis.topics.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #e5e7eb; padding-bottom: 4px; font-size: 13px;">
                  <span style="font-weight: 600;">${t.topic}</span>
                  <span style="font-weight: 700; color: #6d28d9;">${t.percentage}%</span>
                </div>
                <div style="font-size: 12px; color: #4b5563; margin-top: -3px; margin-bottom: 8px;">${t.description}</div>
              `).join('')}
            </div>
          </div>

          <!-- DYNAMIC STUDY MATERIAL MODULES -->
          ${objectivesHTML}
          ${introductionHTML}
          ${detailedExplanationHTML}
          ${majorConceptsHTML}
          ${definitionsHTML}
          ${timelineHTML}
          ${practicalHTML}
          ${formulasHTML}
          ${mcqsHTML}
          ${examPrepHTML}
          ${faqHTML}
          ${resumeHTML}

          <!-- FOOTER -->
          <div class="section-container page-break-before" style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 40px; color: #9ca3af; font-size: 11px;">
            <p><strong>Disclaimer:</strong> This handbook is generated by AI using automatic transcripts from the source YouTube video. It is designed to assist in active recall, exam revision, and curriculum structure.</p>
            <p>&copy; ${new Date().getFullYear()} Video Synopsis AI. All Rights Reserved. Prepared for Symboisys Technologies Internship.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  // Download true server-generated PPT
  async downloadPPT(synopsis: SynopsisData): Promise<void> {
    const response = await api.get(`/synopsis/export/ppt/${synopsis.id}`, {
      responseType: 'blob'
    });
    const blob = new Blob(
      [response.data],
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'video-synopsis-professional.pptx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  // Download standalone HTML package
  async downloadWeb(synopsis: SynopsisData): Promise<void> {
    const response = await api.get(`/synopsis/export/web/${synopsis.id}`, {
      responseType: 'blob'
    });
    const blob = new Blob(
      [response.data],
      { type: 'text/html' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeTitle = synopsis.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.download = `video_synopsis_${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  // Ask the AI Study Coach a question
  async chat(
    synopsisId: string,
    message: string,
    history: Array<{ role: string; content: string }>
  ): Promise<{ answer: string; sources: string[]; provider?: string }> {
    const response = await api.post<{ answer: string; sources: string[]; provider?: string }>(`/synopsis/${synopsisId}/chat`, {
      message,
      history
    });
    return response.data;
  },

  // Get previous chat messages for this synopsis
  async getChatHistory(
    synopsisId: string
  ): Promise<{ messages: Array<{ role: string; content: string; createdAt: string }> }> {
    const response = await api.get<{ messages: Array<{ role: string; content: string; createdAt: string }> }>(
      `/synopsis/${synopsisId}/chat/history`
    );
    return response.data;
  },

  // Helper local storage getter
  getLocalHistory(): SynopsisData[] {
    const data = localStorage.getItem('synopsis_history');
    if (!data) {
      // Add default mock items to history so dashboard is beautiful initially
      const initialHistory: SynopsisData[] = [
        {
          ...DEMO_SUMMARIES.react19,
          id: 'syn_react19_demo',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          saved: true
        },
        {
          ...DEMO_SUMMARIES.ai_keynote,
          id: 'syn_aikey_demo',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          saved: false
        }
      ];
      localStorage.setItem('synopsis_history', JSON.stringify(initialHistory));
      return initialHistory;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // Get Admin Usage Metrics
  getAdminMetrics(): {
    totalUsers: number;
    activeUsers: number;
    totalSummaries: number;
    avgProcessingTimeSec: number;
    tokenConsumption: number;
    recentErrors: Array<{ id: string; time: string; action: string; error: string }>;
    activityData: Array<{ date: string; count: number }>;
  } {
    const history = this.getLocalHistory();
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    
    return {
      totalUsers: Math.max(8, mockUsers.length),
      activeUsers: Math.max(3, mockUsers.length - 1),
      totalSummaries: history.length + 15, // Let's scale it slightly
      avgProcessingTimeSec: 14.5,
      tokenConsumption: (history.length + 15) * 8750, // Approx tokens per run
      recentErrors: [
        { id: 'err_1', time: '2026-05-18 10:14', action: 'Transcript Extraction', error: 'YouTube Captions API rate limit exceeded' },
        { id: 'err_2', time: '2026-05-18 09:22', action: 'Video ID Parsing', error: 'Invalid URL query sequence' },
        { id: 'err_3', time: '2026-05-17 16:45', action: 'Speech-to-Text Conversion', error: 'Whisper audio extraction payload timeout' }
      ],
      activityData: [
        { date: 'May 12', count: 4 },
        { date: 'May 13', count: 7 },
        { date: 'May 14', count: 5 },
        { date: 'May 15', count: 9 },
        { date: 'May 16', count: 12 },
        { date: 'May 17', count: 8 },
        { date: 'May 18', count: history.length }
      ]
    };
  }
};
