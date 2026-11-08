import { useTranslation } from 'react-i18next';
import { codingEditorFontFamily, codingEditorTheme, configureCodingEditor } from '../../utils/codingEditorTheme';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Play,
  CheckCircle,
  Clock,
  Cpu,
  ArrowLeft,
  Code2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Terminal,
  BookOpen,
  ChevronDown,
  ChevronUp,
  History,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/errorUtils';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import type { ApiResponse, OjProblemDetailResponse, OjWebSocketMessage, OjProblemSubmission, PageResponse } from '../../types';
import { Judge0MaintenanceModal } from '../../components/Judge0MaintenanceModal';

const LANGUAGES = [
  { id: 71, name: 'Python 3', monacoName: 'python', extension: 'py', defaultCode: 'import sys\n\ndef solve():\n    # Read data from stdin\n    # line = sys.stdin.readline()\n    print("Hello World")\n\nif __name__ == "__main__":\n    solve()' },
  { id: 54, name: 'C++ (GCC)', monacoName: 'cpp', extension: 'cpp', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read data from stdin\n    // int n;\n    // cin >> n;\n    cout << "Hello World" << endl;\n    return 0;\n}' },
  { id: 62, name: 'Java (OpenJDK)', monacoName: 'java', extension: 'java', defaultCode: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Read data from stdin\n        // Scanner scanner = new Scanner(System.in);\n        System.out.println("Hello World");\n    }\n}' },
  { id: 50, name: 'C (GCC)', monacoName: 'c', extension: 'c', defaultCode: '#include <stdio.h>\n\nint main() {\n    // Read data from stdin\n    // int n;\n    // scanf("%d", &n);\n    printf("Hello World\\n");\n    return 0;\n}' }
];

const detectLanguage = (code: string): number => {
  if (code.includes('#include') && code.includes('cin >>')) return 54; // C++
  if (code.includes('#include') && code.includes('printf')) return 50; // C
  if (code.includes('import java') || code.includes('class Main') || code.includes('public class')) return 62; // Java
  if (code.includes('def ') || code.includes('import ') || code.includes('print(')) return 71; // Python
  return 71; // Default
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

const ProblemWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribe, isConnected } = useWebSocket();

  const problemIdNum = Number(problemId);

  // States
  const [problem, setProblem] = useState<OjProblemDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Maintenance Modal states
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Editor states
  const [selectedLanguageId, setSelectedLanguageId] = useState(71); // Python default
  const [sourceCodes, setSourceCodes] = useState<Record<number, string>>({});

  // Submission & Realtime Verdict states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<OjWebSocketMessage | null>(null);
  const [testcases, setTestcases] = useState<OjWebSocketMessage[]>([]);
  const [leftTab, setLeftTab] = useState<'description' | 'results' | 'submissions'>('description');
  const [expandedTestcases, setExpandedTestcases] = useState<Record<number, boolean>>({});

  // Submission History states
  const [submissions, setSubmissions] = useState<OjProblemSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionPage, setSubmissionPage] = useState(0);
  const [submissionTotalPages, setSubmissionTotalPages] = useState(1);
  const [submissionTotalElements, setSubmissionTotalElements] = useState(0);

  const toggleTestcaseExpand = (index: number) => {
    setExpandedTestcases(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Keep ref of active submission id to avoid stale closures in websocket callback
  const activeSubIdRef = useRef<number | null>(null);

  const selectedLanguage = useMemo(() => {
    return LANGUAGES.find(l => l.id === selectedLanguageId) || LANGUAGES[0];
  }, [selectedLanguageId]);

  // Fetch problem details
  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problemId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await api.get<ApiResponse<OjProblemDetailResponse>>(`/online-judge/problems/${problemId}`);
        const data = res.data.result;
        setProblem(data);

        // Populate source codes
        const initialCodes: Record<number, string> = {};
        LANGUAGES.forEach(lang => {
          initialCodes[lang.id] = lang.defaultCode;
        });

        if (data.latestSourceCode) {
          const detectedId = detectLanguage(data.latestSourceCode);
          setSelectedLanguageId(detectedId);
          initialCodes[detectedId] = data.latestSourceCode;
        }

        setSourceCodes(initialCodes);
      } catch (error: any) {
        console.error('Failed to fetch problem:', error);
        setErrorMsg(getErrorMessage(error, 'Failed to load problem. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };
    fetchProblemDetails();
  }, [problemId]);

  // Fetch submission history
  const fetchSubmissions = async (page = 0) => {
    if (!problemIdNum) return;
    setLoadingSubmissions(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<OjProblemSubmission>>>(
        `/online-judge/problems/${problemIdNum}/submissions`,
        {
          params: {
            page,
            size: 10
          }
        }
      );
      const data = res.data.result;
      setSubmissions(data.content || []);
      setSubmissionPage(data.page);
      setSubmissionTotalPages(data.totalPages);
      setSubmissionTotalElements(data.totalElements);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (leftTab === 'submissions') {
      fetchSubmissions(submissionPage);
    }
  }, [leftTab, submissionPage]);

  // Reset page when problemId changes
  useEffect(() => {
    setSubmissionPage(0);
  }, [problemIdNum]);

  // Listen to WebSocket submissions topic for realtime verdict feedback
  useEffect(() => {
    if (!user?.id) return;

    const topic = `/topic/submissions/${user.id}`;
    console.log(`Subscribing to topic: ${topic}`);

    const subscription = subscribe(topic, (message) => {
      try {
        const data: OjWebSocketMessage = JSON.parse(message.body);
        console.log('Received WebSocket verdict update:', data);

        // Check if message corresponds to the active submission
        if (data.submissionId === activeSubIdRef.current) {
          setVerdict(data);

          // Append or update testcase details if present
          if (data.testcaseId !== null) {
            setTestcases(prev => {
              const exists = prev.some(t => t.testcaseId === data.testcaseId);
              let updated;
              if (exists) {
                updated = prev.map(t => t.testcaseId === data.testcaseId ? data : t);
              } else {
                updated = [...prev, data];
              }
              return updated.sort((a, b) => (a.testcaseId || 0) - (b.testcaseId || 0));
            });
          }

          const finished = data.overallVerdict &&
                           data.overallVerdict !== 'PENDING' &&
                           data.overallVerdict !== 'PROCESSING';

          if (finished) {
            setIsSubmitting(false);
            // If accepted, update local problem status
            if (data.overallVerdict === 'ACCEPTED') {
              setProblem(prev => prev ? { ...prev, isAccepted: true } : null);
            }
            // Refresh submission history
            fetchSubmissions(0);
          }
        }
      } catch (err) {
        console.error('Failed to parse WS submission msg:', err);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user?.id, subscribe]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSourceCodes(prev => ({
        ...prev,
        [selectedLanguageId]: value
      }));
    }
  };

  const handleResetCode = () => {
    if (window.confirm('Are you sure you want to reset the default code for this language?')) {
      setSourceCodes(prev => ({
        ...prev,
        [selectedLanguageId]: selectedLanguage.defaultCode
      }));
    }
  };

  const handleSubmit = async () => {
    const code = sourceCodes[selectedLanguageId];
    if (!code?.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setVerdict(null);
    setTestcases([]);
    setExpandedTestcases({});
    setLeftTab('results');

    try {
      const payload = {
        problemId: problemIdNum,
        languageId: selectedLanguageId,
        sourceCode: code,
        lessonId: null,
        contestId: null
      };

      const res = await api.post<ApiResponse<{ submissionId: number; status: string; message: string }>>(
        '/online-judge/submissions',
        payload
      );

      const subId = res.data.result.submissionId;
      activeSubIdRef.current = subId;

      // Pre-populate verdict as PENDING
      setVerdict({
        submissionId: subId,
        testcaseId: null,
        testcaseVerdict: null,
        overallVerdict: 'PENDING',
        executionTimeMs: null,
        memoryUsedKb: null,
        totalTestcases: 0,
        processedTestcases: 0,
        input: null,
        expectedOutput: null,
        actualOutput: null,
        compileOutput: null
      });

    } catch (err: any) {
      console.error('Failed to submit code:', err);
      const errMsg = getErrorMessage(err, 'An error occurred while submitting code.');
      setSubmitError(errMsg);
      setMaintenanceModalOpen(true);
      setIsSubmitting(false);
    }
  };

  const getVerdictBadgeClass = (overall: string | null) => {
    if (!overall) return 'bg-code-elevated text-code-muted border-code-border border';
    switch (overall) {
      case 'ACCEPTED':
        return 'text-code-success bg-code-success-surface border-code-success-border border ';
      case 'WRONG_ANSWER':
        return 'text-code-error bg-code-error-surface border-code-error-border border';
      case 'TIME_LIMIT_EXCEEDED':
      case 'MEMORY_LIMIT_EXCEEDED':
        return 'text-code-warning bg-code-warning-surface border-code-warning-border border';
      case 'COMPILATION_ERROR':
        return 'text-code-accent bg-code-accent-surface border-code-accent border';
      case 'PENDING':
      case 'PROCESSING':
        return 'text-code-accent bg-code-accent-surface border-code-accent border ';
      default:
        return 'text-code-error bg-code-error-surface border-code-error-border border';
    }
  };

  const getVerdictLabel = (overall: string | null) => {
    if (!overall) return 'Not Submitted';
    switch (overall) {
      case 'ACCEPTED':
        return 'Accepted';
      case 'WRONG_ANSWER':
        return 'Wrong Answer';
      case 'TIME_LIMIT_EXCEEDED':
        return 'Time Limit Exceeded';
      case 'MEMORY_LIMIT_EXCEEDED':
        return 'Memory Limit Exceeded';
      case 'COMPILATION_ERROR':
        return 'Compilation Error';
      case 'RUNTIME_ERROR':
        return 'Runtime Error';
      case 'INTERNAL_ERROR':
        return 'System Error';
      case 'PENDING':
        return 'Pending...';
      case 'PROCESSING':
        return 'Processing...';
      default:
        return overall;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'text-code-success bg-code-success-surface border-code-success-border border';
      case 'MEDIUM':
        return 'text-code-warning bg-code-warning-surface border-code-warning-border border';
      case 'HARD':
        return 'text-code-error bg-code-error-surface border-code-error-border border';
      default:
        return 'text-code-muted bg-code-bg border-code-border border';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-code-bg">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-10 w-10 animate-spin text-code-accent" />
          <span className="text-sm font-semibold text-code-muted">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !problem) {
    return (
      <div className="mx-auto max-w-md text-center py-20 px-4 min-h-[70vh] flex flex-col justify-center items-center">
        <AlertTriangle className="h-12 w-12 text-code-error mb-4" />
        <h3 className="text-lg font-medium text-code-text mb-2">An error occurred</h3>
        <p className="text-sm text-code-muted mb-6">{errorMsg || 'Failed to load problem.'}</p>
        <button
          onClick={() => navigate('/oj/practice')}
          className="px-4 py-2 bg-code-accent text-code-bg rounded-sm text-xs font-medium hover:bg-code-accent-hover transition-all "
        >
          Back to Problems
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row coding-workspace w-full overflow-hidden bg-code-bg text-left">

      {/* LEFT PANEL: Problem description / Testcases (50% width on large screens) */}
      <div className="w-full lg:w-1/2 flex flex-col h-1/2 lg:h-full border-r border-code-border bg-code-panel">
        {/* Navigation back and title */}
        <div className="px-5 py-3.5 border-b border-code-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              aria-label={t('coding.back_problems')}
              onClick={() => navigate(-1)}
              className="p-1 rounded-sm hover:bg-code-elevated text-code-muted transition-colors"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <h2 className="text-sm font-medium text-code-text line-clamp-1">
                {problem.title}
              </h2>
              <div className="flex items-center space-x-2 mt-0.5">
                {problem.difficulty && (
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty === 'EASY' ? 'Easy' : problem.difficulty === 'MEDIUM' ? 'Medium' : 'Hard'}
                  </span>
                )}
                {problem.isAccepted && (
                  <span className="flex items-center space-x-0.5 text-[10px] font-medium text-code-success">
                    <CheckCircle className="h-3 w-3 fill-code-success-surface" />
                    <span>Solved</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="coding-problem-tabs flex items-center justify-between border-b border-code-border shrink-0 bg-code-panel/80 select-none px-4">
          <div className="coding-tabs flex space-x-1">
            <button
              onClick={() => setLeftTab('description')}
              className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2   ${
                leftTab === 'description'
                  ? 'border-code-accent text-code-accent border'
                  : 'border-transparent text-code-muted hover:text-code-muted'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setLeftTab('results')}
              className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2   flex items-center space-x-1.5 ${
                leftTab === 'results'
                  ? 'border-code-accent text-code-accent border'
                  : 'border-transparent text-code-muted hover:text-code-muted'
              }`}
            >
              <span>Results</span>
              {isSubmitting && (
                <span className="h-1.5 w-1.5 rounded-sm bg-code-accent animate-ping" />
              )}
            </button>
            <button
              onClick={() => setLeftTab('submissions')}
              className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2   flex items-center space-x-1.5 ${
                leftTab === 'submissions'
                  ? 'border-code-accent text-code-accent border'
                  : 'border-transparent text-code-muted hover:text-code-muted'
              }`}
            >
              <span>Submissions</span>
            </button>
          </div>

          {/* Connection status */}
          <div className="flex items-center space-x-1.5 shrink-0 select-none text-[10px] font-medium text-code-muted">
            <div className={`w-1.5 h-1.5 rounded-sm ${isConnected ? 'bg-code-success' : 'bg-code-error animate-pulse'}`} />
            <span className="">{isConnected ? 'Sync Active' : 'Offline'}</span>
          </div>
        </div>

        {/* Scrollable Problem Info or Testcase Results */}
        <div className="flex-grow overflow-y-auto p-5 md:p-6">
          {leftTab === 'description' ? (
            <div className="space-y-6">
              {/* Tags */}
              {problem.tags && problem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {problem.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-sm bg-code-elevated text-code-muted text-[10px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {problem.description && (
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xs font-medium text-code-text flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-code-accent" />
                    <span>Problem Statement</span>
                  </h3>
                  <p className="text-sm text-code-muted whitespace-pre-wrap leading-relaxed mt-2 font-normal font-coding">
                    {problem.description}
                  </p>
                </div>
              )}

              {/* Input Format */}
              {problem.inputDescription && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-code-text ">
                    Input
                  </h4>
                  <p className="text-sm text-code-muted leading-relaxed font-normal font-coding">
                    {problem.inputDescription}
                  </p>
                </div>
              )}

              {/* Output Format */}
              {problem.outputDescription && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-code-text ">
                    Output
                  </h4>
                  <p className="text-sm text-code-muted leading-relaxed font-normal font-coding">
                    {problem.outputDescription}
                  </p>
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-code-text ">
                    Constraints
                  </h4>
                  <pre className="p-3 rounded-sm bg-code-bg/80 text-xs font-coding border-code-border leading-relaxed text-code-muted overflow-x-auto whitespace-pre-wrap border">
                    {problem.constraints}
                  </pre>
                </div>
              )}

              {/* Examples */}
              {(problem.exampleInput || problem.exampleOutput) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {problem.exampleInput && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-code-text ">
                        Example Input
                      </h4>
                      <pre className="p-3.5 rounded-sm bg-code-bg text-code-text text-xs font-coding border-code-border leading-relaxed overflow-x-auto whitespace-pre border">
                        <code>{problem.exampleInput}</code>
                      </pre>
                    </div>
                  )}
                  {problem.exampleOutput && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-code-text ">
                        Example Output
                      </h4>
                      <pre className="p-3.5 rounded-sm bg-code-bg text-code-text text-xs font-coding border-code-border leading-relaxed overflow-x-auto whitespace-pre border">
                        <code>{problem.exampleOutput}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Hint */}
              {problem.hint && (
                <div className="bg-code-warning-surface border-code-warning-border rounded-sm p-4 space-y-1 border">
                  <h4 className="text-xs font-medium text-code-warning flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Hints</span>
                  </h4>
                  <p className="text-xs text-code-muted leading-relaxed font-normal font-coding">
                    {problem.hint}
                  </p>
                </div>
              )}
            </div>
          ) : leftTab === 'results' ? (
            <div className="space-y-4">
              {verdict ? (
                <div className="space-y-5 pb-4">
                  {/* Result summary card */}
                  <div className={`border p-6 rounded-sm flex flex-col items-center justify-center text-center gap-4 ${getVerdictBadgeClass(verdict.overallVerdict)}`}>
                    <div className="space-y-2 w-full max-w-md">
                      <span className="text-[10px]  font-medium  opacity-60">Verdict</span>
                      <h4 className="text-xl md:text-2xl font-medium tracking-tight ">
                        {getVerdictLabel(verdict.overallVerdict)}
                      </h4>

                      {/* Testcase Progress Bar */}
                      {verdict.totalTestcases > 0 && (
                        <div className="pt-2 space-y-2">
                          <div className="text-sm font-semibold opacity-90">
                            Judged: <span className="text-lg font-medium">{verdict.processedTestcases}</span> / <span className="text-lg font-medium">{verdict.totalTestcases}</span> testcases
                          </div>
                          <div className="w-full bg-code-elevated h-3 rounded-sm overflow-hidden ">
                            <div
                              className={`h-full transition-all duration-300 rounded-sm ${
                                verdict.overallVerdict === 'ACCEPTED' ? 'bg-code-success' :
                                verdict.overallVerdict === 'WRONG_ANSWER' ? 'bg-code-error' :
                                'bg-code-accent'
                              }`}
                              style={{ width: `${(verdict.processedTestcases / verdict.totalTestcases) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata (time/memory) */}
                    {(verdict.executionTimeMs !== null || verdict.memoryUsedKb !== null) && (
                      <div className="flex items-center space-x-6 shrink-0 text-xs font-medium bg-code-panel/80 px-4 py-2 rounded-sm border-code-border font-coding border">
                        {verdict.executionTimeMs !== null && (
                          <div className="flex items-center space-x-1.5 text-code-muted">
                            <Clock className="h-4 w-4" />
                            <span>{verdict.executionTimeMs} ms</span>
                          </div>
                        )}
                        {verdict.memoryUsedKb !== null && (
                          <div className="flex items-center space-x-1.5 text-code-muted">
                            <Cpu className="h-4 w-4" />
                            <span>{(verdict.memoryUsedKb / 1024).toFixed(1)} MB</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Compilation Error logs if exists */}
                  {verdict.overallVerdict === 'COMPILATION_ERROR' && verdict.compileOutput && (
                    <div className="space-y-1.5 text-left font-coding">
                      <h5 className="text-[10px] font-medium text-code-error ">Compilation Logs:</h5>
                      <pre className="p-3.5 rounded-sm bg-code-error-surface border-code-error-border text-code-error font-coding text-xs overflow-x-auto whitespace-pre leading-relaxed select-text border">
                        <code>{verdict.compileOutput}</code>
                      </pre>
                    </div>
                  )}

                  {/* List of Testcase Results (Step-by-Step) */}
                  {testcases.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h5 className="text-[10px] font-medium text-code-muted font-coding">
                        Testcase Details ({testcases.length})
                      </h5>
                      <div className="grid grid-cols-1 gap-3">
                        {testcases.map((tc, idx) => {
                          const isFailed = tc.testcaseVerdict !== 'ACCEPTED';
                          const isExpanded = !!expandedTestcases[idx];
                          return (
                            <div
                              key={tc.testcaseId ?? idx}
                              className={`border rounded-sm overflow-hidden bg-code-panel transition-all ${
                                tc.testcaseVerdict === 'ACCEPTED'
                                  ? 'border-code-border border'
                                  : 'border-code-error-border border'
                              }`}
                            >
                              {/* Testcase Header Card - Click to toggle expansion */}
                              <div
                                onClick={() => toggleTestcaseExpand(idx)}
                                className="px-4 py-3 bg-code-panel/80 border-b border-code-border flex items-center justify-between text-xs font-coding cursor-pointer hover:bg-code-elevated/80 transition-colors select-none"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={`h-2 w-2 rounded-sm ${tc.testcaseVerdict === 'ACCEPTED' ? 'bg-code-success' : 'bg-code-error'}`} />
                                  <span className="font-medium text-code-muted">
                                    Testcase #{idx + 1}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-sm text-[9px] font-medium border ${getVerdictBadgeClass(tc.testcaseVerdict)}`}>
                                    {getVerdictLabel(tc.testcaseVerdict)}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-3 text-code-muted font-medium text-[10px]">
                                  {tc.executionTimeMs !== null && (
                                    <span>{tc.executionTimeMs} ms</span>
                                  )}
                                  {tc.memoryUsedKb !== null && (
                                    <span>{(tc.memoryUsedKb / 1024).toFixed(2)} MB</span>
                                  )}
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-code-muted" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-code-muted" />
                                  )}
                                </div>
                              </div>

                              {/* Testcase Inputs and Outputs - Collapsible */}
                              {isExpanded && tc.input !== null && (
                                <div className="p-4 space-y-3 font-coding text-[11px] leading-relaxed border-t border-code-border bg-code-bg">
                                  <div className="space-y-1">
                                    <span className="text-code-muted font-medium block text-[9px] ">Input:</span>
                                    <pre className="p-2.5 rounded-sm bg-code-bg/80 text-code-muted overflow-x-auto whitespace-pre max-h-24 leading-normal">{tc.input}</pre>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <span className="text-code-muted font-medium block text-[9px] ">Actual Output:</span>
                                      <pre className={`p-2.5 rounded-sm overflow-x-auto whitespace-pre max-h-24 leading-normal border ${
                                        isFailed
                                          ? 'bg-code-error-surface border-code-error-border text-code-error border'
                                          : 'bg-code-bg/80 border-transparent text-code-muted'
                                      }`}>{tc.actualOutput ?? 'N/A'}</pre>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-code-muted font-medium block text-[9px] ">Expected Output:</span>
                                      <pre className="p-2.5 rounded-sm bg-code-success-surface text-code-success border-code-success-border overflow-x-auto whitespace-pre max-h-24 leading-normal border">{tc.expectedOutput ?? 'N/A'}</pre>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-code-muted py-12 font-coding">
                  <Terminal className="h-8 w-8 text-code-text mb-2 opacity-50" />
                  <p className="text-xs">Write code and click "Submit" to compile and run tests.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 font-coding text-left">
              {loadingSubmissions ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-code-accent" />
                  <span className="text-xs text-code-muted font-semibold">Loading submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-code-muted py-12 space-y-2.5">
                  <div className="p-3 bg-code-elevated rounded-sm">
                    <History className="h-6 w-6 text-code-muted" />
                  </div>
                  <p className="text-xs font-semibold text-code-muted">You have no submissions for this problem.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-sm border-code-border bg-code-panel/80 border">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-code-border bg-code-panel/80 text-code-muted text-[10px] font-medium select-none">
                          <th className="px-4 py-3">Verdict</th>
                          <th className="px-4 py-3">Language</th>
                          <th className="px-4 py-3">Execution Time</th>
                          <th className="px-4 py-3">Memory</th>
                          <th className="px-4 py-3 text-right">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-code-border divide-code-border font-medium">
                        {submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-code-elevated transition-colors">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-medium border ${getVerdictBadgeClass(sub.verdict)}`}>
                                {getVerdictLabel(sub.verdict)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-code-muted font-coding text-[11px]">
                              {sub.language}
                            </td>
                            <td className="px-4 py-3 text-code-muted font-coding text-[11px]">
                              {sub.executionTimeMs} ms
                            </td>
                            <td className="px-4 py-3 text-code-muted font-coding text-[11px]">
                              {(sub.memoryUsedKb / 1024).toFixed(2)} MB
                            </td>
                            <td className="px-4 py-3 text-right text-code-muted font-coding text-[10px]">
                              <div className="flex items-center justify-end space-x-1.5">
                                <Calendar className="h-3 w-3 opacity-60" />
                                <span>{formatDate(sub.submittedAt)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {submissionTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-code-border pt-4 mt-2">
                      <span className="text-[11px] text-code-muted font-semibold select-none">
                        Page {submissionPage + 1} of {submissionTotalPages} ({submissionTotalElements} submissions)
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSubmissionPage(prev => Math.max(0, prev - 1))}
                          disabled={submissionPage === 0 || loadingSubmissions}
                          className="p-1.5 rounded-sm border-code-border hover:bg-code-elevated disabled:opacity-40 disabled:hover:bg-transparent transition-colors border "
                        >
                          <ChevronLeft className="h-3.5 w-3.5 text-code-muted" />
                        </button>
                        <button
                          onClick={() => setSubmissionPage(prev => Math.min(submissionTotalPages - 1, prev + 1))}
                          disabled={submissionPage === submissionTotalPages - 1 || loadingSubmissions}
                          className="p-1.5 rounded-sm border-code-border hover:bg-code-elevated disabled:opacity-40 disabled:hover:bg-transparent transition-colors border "
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-code-muted" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Editor (100% height on desktop now!) */}
      <div className="w-full lg:w-1/2 flex flex-col h-1/2 lg:h-full bg-code-bg overflow-hidden">

        {/* Editor controls bar */}
        <div className="px-4 py-2 border-b border-code-border bg-code-bg flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-code-muted">
              <Code2 className="h-4 w-4 text-code-accent" />
              <span className="text-[10px] font-medium  ">Editor</span>
            </div>

            {/* Language Selector */}
            <select
              aria-label={t('coding.programming_language')}
              value={selectedLanguageId}
              onChange={(e) => setSelectedLanguageId(Number(e.target.value))}
              disabled={isSubmitting}
              className="px-2.5 py-1 text-xs font-medium rounded-sm border-code-border bg-code-panel text-code-muted focus:outline-none focus:ring-1 focus:ring-code-accent border"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* Reset code */}
            <button
              onClick={handleResetCode}
              disabled={isSubmitting}
              title="Reset code template"
              className="p-1.5 text-code-muted hover:text-code-text bg-code-panel hover:bg-code-elevated border-code-border rounded-sm transition-colors disabled:opacity-40 border"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            {/* Run / Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-code-accent hover:bg-code-accent-hover text-code-bg rounded-sm text-xs font-medium disabled:opacity-50 transition-all "
            >
              {isSubmitting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor Panel */}
        <div className="flex-grow bg-code-bg relative">
          <Editor
            height="100%"
            language={selectedLanguage.monacoName}
            value={sourceCodes[selectedLanguageId] || ''}
            onChange={handleEditorChange}
            theme={codingEditorTheme}
            beforeMount={configureCodingEditor}
            loading={
              <div className="absolute inset-0 flex items-center justify-center bg-code-bg/80">
                <RefreshCw className="h-6 w-6 animate-spin text-code-muted" />
              </div>
            }
            options={{
              fontSize: 14,
              fontFamily: codingEditorFontFamily,
              tabSize: 4,
              automaticLayout: true,
              minimap: { enabled: false },
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              },
              lineNumbers: 'on',
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 }
            }}
          />
        </div>

      </div>

      <Judge0MaintenanceModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        errorMessage={submitError}
        codeToCopy={sourceCodes[selectedLanguageId]}
      />

    </div>
  );
};

export default ProblemWorkspace;
