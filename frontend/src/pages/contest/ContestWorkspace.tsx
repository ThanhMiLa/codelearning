import ContestStandings from '../../components/contest/ContestStandings';
import { useTranslation } from 'react-i18next';
import { codingEditorFontFamily, codingEditorTheme, configureCodingEditor } from '../../utils/codingEditorTheme';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Play,
  CheckCircle,
  Clock,
  ArrowLeft,
  Code2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Terminal,
  BookOpen,
  Trophy,
  XCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/errorUtils';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import type { ApiResponse, ContestResponse, OjProblemDetailResponse, OjWebSocketMessage, ContestLeaderboardResponse } from '../../types';
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

const problemMarkerClass = 'inline-flex w-9 h-9 items-center justify-center rounded-sm border border-code-border bg-code-elevated text-code-text text-sm font-medium group-hover:border-code-accent';

interface SimpleContestProblem {
  id: number;
  title: string;
  orderIndex?: number;
  difficulty?: string;
  isAccepted?: boolean | null;
}

const ContestWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribe } = useWebSocket();

  const contestIdNum = Number(contestId);

  // States
  const [contest, setContest] = useState<ContestResponse | null>(null);
  const [problems, setProblems] = useState<SimpleContestProblem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [problemDetail, setProblemDetail] = useState<OjProblemDetailResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Countdown Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds

  // Editor states
  const [selectedLanguageId, setSelectedLanguageId] = useState(71); // Python default
  const [sourceCodes, setSourceCodes] = useState<Record<number, string>>({});

  // Submission & Realtime Verdict states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<OjWebSocketMessage | null>(null);

  // Maintenance Modal states
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'problems' | 'submissions' | 'ranking'>('problems');

  // User Submissions State
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Leaderboard/Ranking State
  const [leaderboardData, setLeaderboardData] = useState<ContestLeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Keep ref of active submission id to avoid stale closures in websocket callback
  const activeSubIdRef = useRef<number | null>(null);

  const selectedLanguage = useMemo(() => {
    return LANGUAGES.find(l => l.id === selectedLanguageId) || LANGUAGES[0];
  }, [selectedLanguageId]);

  // Fetch contest details & problems list & user submissions list
  const fetchContestData = async () => {
    if (!contestId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [contestRes, problemsRes] = await Promise.all([
        api.get<ApiResponse<ContestResponse>>(`/contests/${contestId}`),
        api.get<ApiResponse<any>>(`/contests/${contestId}/problems`).catch(err => {
          console.warn('GET /contests/{id}/problems failed, trying fallback list API', err);
          return { data: { result: [] } };
        })
      ]);

      const contestData = contestRes.data.result;
      setContest(contestData);

      const problemsData = problemsRes.data.result;
      const parsedProblems: SimpleContestProblem[] = Array.isArray(problemsData)
        ? problemsData
        : problemsData?.content || [];

      setProblems(parsedProblems);

      // Initialize Timer
      const end = new Date(contestData.endTime).getTime();
      const start = new Date().getTime();
      const seconds = Math.max(Math.floor((end - start) / 1000), 0);
      setTimeLeft(seconds);

    } catch (error: any) {
      console.error('Failed to load contest workspace:', error);
      setErrorMsg(getErrorMessage(error, 'Failed to load contest workspace. Make sure you are registered.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestData();
    fetchUserSubmissions();
  }, [contestId]);

  // Fetch user submissions in the contest
  const fetchUserSubmissions = async () => {
    if (!contestId) return;
    setLoadingSubmissions(true);
    try {
      const res = await api.get<ApiResponse<any>>(`/contests/${contestId}/submissions`, {
        params: { page: 0, size: 100 }
      });
      const data = res.data.result;
      setUserSubmissions(Array.isArray(data) ? data : data?.content || []);
    } catch (error) {
      console.error('Failed to fetch user submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Fetch Leaderboard
  const fetchLeaderboard = async (isSilent = false) => {
    if (!contestId) return;
    if (!isSilent) setLoadingLeaderboard(true);

    try {
      const res = await api.get<ApiResponse<ContestLeaderboardResponse>>(`/contests/${contestId}/leaderboard`);
      setLeaderboardData(res.data.result);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Fetch data when active tab changes
  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchUserSubmissions();
    } else if (activeTab === 'ranking') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  // Timer interval countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Fetch selected problem detail
  useEffect(() => {
    const fetchProblemDetail = async () => {
      if (!selectedProblemId) return;
      setLoadingDetail(true);

      setVerdict(null);
      try {
        const res = await api.get<ApiResponse<OjProblemDetailResponse>>(`/online-judge/problems/${selectedProblemId}`, {
          params: { contestId: contestIdNum }
        });
        const data = res.data.result;
        setProblemDetail(data);

        // Prepopulate editor source code
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
      } catch (err) {
        console.error('Failed to fetch problem detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchProblemDetail();
  }, [selectedProblemId]);

  // WebSocket Subscription for submissions feedback
  useEffect(() => {
    if (!user?.id) return;

    const topic = `/topic/submissions/${user.id}`;
    const subscription = subscribe(topic, (message) => {
      try {
        const data: OjWebSocketMessage = JSON.parse(message.body);
        if (data.submissionId === activeSubIdRef.current) {
          setVerdict(data);


          const finished = data.overallVerdict &&
                           data.overallVerdict !== 'PENDING' &&
                           data.overallVerdict !== 'PROCESSING';
          if (finished) {
            setIsSubmitting(false);
            if (data.overallVerdict === 'ACCEPTED' && selectedProblemId) {
              setProblems(prev =>
                prev.map(p => p.id === selectedProblemId ? { ...p, isAccepted: true } : p)
              );
            }
            // Update user submissions and leaderboard
            fetchUserSubmissions();
            if (activeTab === 'ranking') {
              fetchLeaderboard(true);
            }
          }
        }
      } catch (err) {
        console.error('WebSocket parsing error:', err);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [user?.id, subscribe, selectedProblemId, activeTab]);

  // WebSocket Subscription for Leaderboard updates
  useEffect(() => {
    if (!contestIdNum) return;

    const topic = `/topic/contests/${contestIdNum}/leaderboard`;
    const subscription = subscribe(topic, () => {
      console.log('Leaderboard updated socket signal received! Re-fetching...');
      fetchLeaderboard(true); // Silent refresh
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [contestIdNum, subscribe]);

  // Calculate problem statuses based on userSubmissions and problems info
  const problemStatuses = useMemo(() => {
    const statusMap: Record<number, 'solved' | 'failed' | 'none'> = {};

    problems.forEach(p => {
      if (p.isAccepted) {
        statusMap[p.id] = 'solved';
        return;
      }

      const subsForProb = userSubmissions.filter(sub => sub.problemId === p.id);

      if (subsForProb.length === 0) {
        statusMap[p.id] = 'none';
      } else {
        const hasAccepted = subsForProb.some(sub => sub.verdict === 'ACCEPTED');
        if (hasAccepted) {
          statusMap[p.id] = 'solved';
        } else {
          const hasCompletedVerdict = subsForProb.some(sub =>
            sub.verdict && sub.verdict !== 'PENDING' && sub.verdict !== 'PROCESSING'
          );
          if (hasCompletedVerdict) {
            statusMap[p.id] = 'failed';
          } else {
            statusMap[p.id] = 'none';
          }
        }
      }
    });

    return statusMap;
  }, [problems, userSubmissions]);


  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && selectedProblemId) {
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
    if (!selectedProblemId || isSubmitting) return;
    const code = sourceCodes[selectedLanguageId];
    if (!code?.trim()) return;

    if (timeLeft <= 0) {
      alert('The contest has ended. You cannot submit code anymore!');
      return;
    }

    setIsSubmitting(true);
    setVerdict(null);


    try {
      const payload = {
        problemId: selectedProblemId,
        contestId: contestIdNum,
        lessonId: null,
        languageId: selectedLanguageId,
        sourceCode: code
      };

      const res = await api.post<ApiResponse<{ submissionId: number; status: string; message: string }>>(
        '/online-judge/submissions',
        payload
      );

      const subId = res.data.result.submissionId;
      activeSubIdRef.current = subId;

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
    } catch (error: any) {
      console.error('Contest submit failed:', error);
      const errMsg = getErrorMessage(error, 'An error occurred while submitting code.');
      setSubmitError(errMsg);
      setMaintenanceModalOpen(true);
      setIsSubmitting(false);
    }
  };

  // Format remaining seconds into HH:MM:SS
  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const getVerdictBadgeClass = (overall: string | null) => {
    if (!overall) return 'bg-code-elevated text-code-muted border-code-border border';
    switch (overall) {
      case 'ACCEPTED':
        return 'text-code-success bg-code-success-surface border-code-success-border border';
      case 'WRONG_ANSWER':
        return 'text-code-error bg-code-error-surface border-code-error-border border';
      case 'COMPILATION_ERROR':
        return 'text-code-accent bg-code-accent-surface border-code-accent border';
      case 'PENDING':
      case 'PROCESSING':
        return 'text-code-accent bg-code-accent-surface border-code-accent border';
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


  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-code-bg">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-10 w-10 animate-spin text-code-accent" />
          <span className="text-sm font-semibold text-code-muted">Initializing contest environment...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !contest) {
    return (
      <div className="mx-auto max-w-md text-center py-20 px-4 min-h-[70vh] flex flex-col justify-center items-center">
        <AlertTriangle className="h-12 w-12 text-code-error mb-4" />
        <h3 className="text-lg font-medium text-code-text mb-2">Access Denied</h3>
        <p className="text-sm text-code-muted mb-6 leading-relaxed">{errorMsg || 'Failed to load contest room. Make sure you are registered.'}</p>
        <button
          onClick={() => navigate('/contests')}
          className="px-4 py-2.5 bg-code-accent text-code-bg rounded-sm text-xs font-medium hover:bg-code-accent-hover transition-all "
        >
          Back to Contests
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col coding-workspace w-full overflow-hidden bg-code-bg text-left">

      {/* Contest header bar */}
      <div className="h-auto min-h-14 gap-3 flex-wrap py-3 border-b border-code-border bg-code-panel px-5 flex items-center justify-between shrink-0 z-10 select-none">
        {/* Left info */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate('/contests')}
            className="p-1 rounded-sm hover:bg-code-elevated text-code-muted transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-medium text-code-text line-clamp-1 max-w-xs md:max-w-md">
                {contest.title}
              </h1>
              <span className="text-[9px] font-medium bg-code-accent-surface text-code-accent border-code-accent px-1.5 py-0.5 rounded-sm border ">
                {contest.scoringRule}
              </span>
            </div>
          </div>
        </div>

        {/* Center Countdown timer */}
        <div className="flex items-center space-x-2">
          <Clock className={`h-4.5 w-4.5 ${timeLeft <= 600 ? 'text-code-error animate-pulse' : 'text-code-accent'}`} />
          <span className={`font-coding text-sm md:text-base font-medium ${
            timeLeft <= 600 ? 'text-code-error animate-pulse' : 'text-code-text'
          }`}>
            {formatTimeLeft(timeLeft)}
          </span>
          {timeLeft <= 0 && (
            <span className="text-xs font-medium text-code-error ml-1">Ended</span>
          )}
        </div>

        {/* Right action indicator */}
        <div className="flex items-center space-x-3">
          <div className="text-xs font-medium px-3.5 py-1.5 bg-code-accent-surface text-code-accent border-code-accent rounded-sm select-none border ">
            {activeTab}
          </div>
        </div>
      </div>

      {/* Main split work area */}
      <div className="coding-contest-area flex-grow flex flex-row overflow-hidden relative">

        {/* Left sidebar navigation */}
        <div className="coding-contest-sidebar w-56 md:w-64 border-r border-code-border bg-code-panel flex flex-col items-center py-6 gap-3 shrink-0 z-20 select-none">
          {/* Problems Tab button */}
          <button
            onClick={() => setActiveTab('problems')}
            className={`w-[calc(100%-1.5rem)] px-4 py-3 rounded-sm flex flex-row items-center space-x-3 border transition-all relative group ${
              activeTab === 'problems'
                ? 'bg-code-accent-surface border-code-accent text-code-accent border '
                : 'bg-transparent border-transparent text-code-muted hover:bg-code-elevated hover:text-code-muted'
            }`}
            title="Problems List"
          >
            <BookOpen className="h-4.5 w-4.5 shrink-0" />
            <span className="text-xs font-medium tracking-tight">Problems</span>
          </button>

          {/* Submissions Tab button */}
          <button
            onClick={() => setActiveTab('submissions')}
            className={`w-[calc(100%-1.5rem)] px-4 py-3 rounded-sm flex flex-row items-center space-x-3 border transition-all relative group ${
              activeTab === 'submissions'
                ? 'bg-code-accent-surface border-code-accent text-code-accent border '
                : 'bg-transparent border-transparent text-code-muted hover:bg-code-elevated hover:text-code-muted'
            }`}
            title="Submission History"
          >
            <Terminal className="h-4.5 w-4.5 shrink-0" />
            <span className="text-xs font-medium tracking-tight">Submissions</span>
          </button>

          {/* Ranking Tab button */}
          <button
            onClick={() => setActiveTab('ranking')}
            className={`w-[calc(100%-1.5rem)] px-4 py-3 rounded-sm flex flex-row items-center space-x-3 border transition-all relative group ${
              activeTab === 'ranking'
                ? 'bg-code-accent-surface border-code-accent text-code-accent border '
                : 'bg-transparent border-transparent text-code-muted hover:bg-code-elevated hover:text-code-muted'
            }`}
            title="Leaderboard Scoreboard"
          >
            <Trophy className="h-4.5 w-4.5 shrink-0" />
            <span className="text-xs font-medium tracking-tight">Ranking</span>
          </button>
        </div>

        {/* Main content panel */}
        <div className="coding-contest-content flex-grow h-full overflow-hidden flex flex-col">

          {/* PROBLEMS TAB CONTENT */}
          {activeTab === 'problems' && (
            selectedProblemId === null ? (
              // Problems List View
              <div className="flex-grow overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-medium text-code-text tracking-tight">
                      Contest Problems
                    </h2>
                  </div>
                  <div className="text-xs font-medium bg-code-elevated text-code-muted px-3 py-1.5 rounded-sm border-code-border border">
                    {problems.filter(p => problemStatuses[p.id] === 'solved').length} / {problems.length} Solved
                  </div>
                </div>

                <div className="bg-code-panel rounded-sm border-code-border overflow-hidden border">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-code-border bg-code-bg text-code-muted font-medium text-[10px] text-left">
                          <th className="px-6 py-4 w-20 text-center">Status</th>
                          <th className="px-6 py-4 w-24 text-center">Order</th>
                          <th className="px-6 py-4 text-left">Problem Name</th>
                          <th className="px-6 py-4 w-28 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-code-border divide-code-border">
                        {problems.map((prob, idx) => {
                          const label = String.fromCharCode(65 + idx); // A, B, C...
                          const status = problemStatuses[prob.id];

                          return (
                            <tr
                              key={prob.id}
                              onClick={() => setSelectedProblemId(prob.id)}
                              className="hover:bg-code-elevated transition-colors cursor-pointer group"
                            >
                              {/* Status */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                  {status === 'solved' ? (
                                    <div title="Completed">
                                      <CheckCircle className="h-5 w-5 text-code-success shrink-0" />
                                    </div>
                                  ) : status === 'failed' ? (
                                    <div title="Incorrect">
                                      <XCircle className="h-5 w-5 text-code-error shrink-0" />
                                    </div>
                                  ) : (
                                    <span className="w-5 h-5 rounded-sm border-code-border block shrink-0 border" />
                                  )}
                                </div>
                              </td>

                              {/* Order Index */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                  <span className={problemMarkerClass}>
                                    {label}
                                  </span>
                                </div>
                              </td>

                              {/* Title */}
                              <td className="px-6 py-4 text-left font-medium text-code-text group-hover:text-code-accent transition-colors text-sm">
                                {prob.title}
                              </td>

                              {/* Action */}
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProblemId(prob.id);
                                  }}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-code-accent-surface hover:bg-code-accent-surface text-code-accent border-code-accent rounded-sm text-xs font-medium transition-all border "
                                >
                                  <Code2 className="h-3.5 w-3.5" />
                                  <span>Solve</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // Individual Problem Workspace Detail View
              <div className="flex flex-col h-full w-full overflow-hidden">
                {/* Back bar */}
                <div className="h-12 border-b border-code-border bg-code-panel px-4 flex items-center justify-between shrink-0 select-none z-10 ">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedProblemId(null)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-code-elevated hover:bg-code-elevated/80 text-code-muted border-code-border text-xs font-medium transition-all border"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Problems</span>
                    </button>
                    <span className="text-code-text">|</span>
                    <h2 className="text-sm font-medium text-code-text">
                      Problem {problems.findIndex(p => p.id === selectedProblemId) !== -1 ? String.fromCharCode(65 + problems.findIndex(p => p.id === selectedProblemId)) : ''}: {problemDetail?.title}
                    </h2>
                  </div>

                  {/* Quick select mini problem list */}
                  <div className="flex items-center space-x-1 bg-code-elevated p-0.5 rounded-sm">
                    {problems.map((prob, idx) => {
                      const label = String.fromCharCode(65 + idx);
                      const isSelected = prob.id === selectedProblemId;
                      const status = problemStatuses[prob.id];

                      return (
                        <button
                          key={prob.id}
                          onClick={() => setSelectedProblemId(prob.id)}
                          className={`w-7 h-7 rounded-sm text-xs font-medium flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-code-accent text-code-bg '
                              : status === 'solved'
                              ? 'text-code-success hover:bg-code-success-surface'
                              : status === 'failed'
                              ? 'text-code-error hover:bg-code-error-surface'
                              : 'text-code-muted hover:bg-code-panel'
                          }`}
                          title={`${prob.title} (${status === 'solved' ? 'Completed' : status === 'failed' ? 'Incorrect' : 'Unattempted'})`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Single Scrollable Problem Workspace */}
                <div className="flex-grow overflow-y-auto w-full">
                  <div className="p-5 md:p-6 max-w-4xl mx-auto space-y-6 text-left">

                    {/* Problem details (Title & Solve status) */}
                    {loadingDetail ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-6 bg-code-elevated rounded-sm w-2/3"></div>
                        <div className="h-4 bg-code-elevated rounded-sm w-full"></div>
                        <div className="h-4 bg-code-elevated rounded-sm w-5/6"></div>
                      </div>
                    ) : problemDetail ? (
                      <div className="space-y-6">
                        {/* Title and Solve badge */}
                        <div>
                          <h2 className="text-xl font-medium text-code-text leading-snug">
                            {problemDetail.title}
                          </h2>
                          {problemStatuses[problemDetail.id] === 'solved' && (
                            <div className="flex items-center space-x-2 mt-1.5">
                              <span className="flex items-center space-x-0.5 text-xs font-medium text-code-success">
                                <CheckCircle className="h-4 w-4 text-code-success fill-code-success-surface" />
                                <span>Solved</span>
                              </span>
                            </div>
                          )}
                        </div>

                        <hr className="border-code-border border" />

                        {/* Description */}
                        {problemDetail.description && (
                          <div className="prose prose-invert max-w-none">
                            <h3 className="text-xs font-medium text-code-text flex items-center space-x-1.5">
                              <BookOpen className="h-4.5 w-4.5 text-code-accent" />
                              <span>Description</span>
                            </h3>
                            <p className="text-sm text-code-muted whitespace-pre-wrap leading-relaxed mt-2 font-normal font-coding">
                              {problemDetail.description}
                            </p>
                          </div>
                        )}

                        {/* Input Description */}
                        {problemDetail.inputDescription && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-code-text ">
                              Input
                            </h4>
                            <p className="text-sm text-code-muted leading-relaxed font-normal">
                              {problemDetail.inputDescription}
                            </p>
                          </div>
                        )}

                        {/* Output Description */}
                        {problemDetail.outputDescription && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-code-text ">
                              Output
                            </h4>
                            <p className="text-sm text-code-muted leading-relaxed font-normal">
                              {problemDetail.outputDescription}
                            </p>
                          </div>
                        )}

                        {/* Constraints */}
                        {problemDetail.constraints && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-code-text ">
                              Constraints
                            </h4>
                            <pre className="p-3.5 rounded-sm bg-code-bg/80 text-xs font-coding border-code-border leading-relaxed text-code-muted overflow-x-auto whitespace-pre-wrap border">
                              {problemDetail.constraints}
                            </pre>
                          </div>
                        )}

                        {/* Examples */}
                        {(problemDetail.exampleInput || problemDetail.exampleOutput) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {problemDetail.exampleInput && (
                              <div className="space-y-1.5">
                                <h4 className="text-xs font-medium text-code-text ">
                                  Example Input
                                </h4>
                                <pre className="p-3 rounded-sm bg-code-bg text-code-text text-xs font-coding border-code-border leading-relaxed overflow-x-auto whitespace-pre border">
                                  <code>{problemDetail.exampleInput}</code>
                                </pre>
                              </div>
                            )}
                            {problemDetail.exampleOutput && (
                              <div className="space-y-1.5">
                                <h4 className="text-xs font-medium text-code-text ">
                                  Example Output
                                </h4>
                                <pre className="p-3 rounded-sm bg-code-bg text-code-text text-xs font-coding border-code-border leading-relaxed overflow-x-auto whitespace-pre border">
                                  <code>{problemDetail.exampleOutput}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hint */}
                        {problemDetail.hint && (
                          <div className="bg-code-warning-surface border-code-warning-border rounded-sm p-4 space-y-1 border">
                            <h4 className="text-xs font-medium text-code-warning flex items-center space-x-1.5">
                              <Sparkles className="h-4 w-4" />
                              <span>Hints</span>
                            </h4>
                            <p className="text-xs text-code-muted leading-relaxed font-normal">
                              {problemDetail.hint}
                            </p>
                          </div>
                        )}

                        {/* Divider */}
                        <hr className="border-code-border my-6 border" />

                        {/* Code Editor block */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-code-text flex items-center space-x-1.5">
                              <Code2 className="h-4.5 w-4.5 text-code-accent" />
                              <span>Write Source Code</span>
                            </h3>

                            <div className="flex items-center space-x-3">
                              {/* Language dropdown */}
                              <select
                                aria-label={t('coding.programming_language')}
                                value={selectedLanguageId}
                                onChange={(e) => setSelectedLanguageId(Number(e.target.value))}
                                disabled={isSubmitting || timeLeft <= 0}
                                className="px-2.5 py-1 text-xs font-medium rounded-sm border-code-border bg-code-panel text-code-muted focus:outline-none focus:ring-1 focus:ring-code-accent disabled:opacity-60 border"
                              >
                                {LANGUAGES.map(lang => (
                                  <option key={lang.id} value={lang.id}>
                                    {lang.name}
                                  </option>
                                ))}
                              </select>

                              {/* Reset code */}
                              <button
                                onClick={handleResetCode}
                                disabled={isSubmitting || timeLeft <= 0}
                                title="Reset default template"
                                className="p-1.5 hover:bg-code-elevated text-code-muted hover:text-code-muted border-code-border rounded-sm transition-colors disabled:opacity-50 border"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Monaco Editor Container */}
                          <div className="h-[450px] md:h-[550px] w-full border-code-border rounded-sm overflow-hidden bg-code-bg relative border ">
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
                                padding: { top: 12, bottom: 12 },
                                readOnly: timeLeft <= 0
                              }}
                            />
                          </div>

                          {/* Submit Actions */}
                          <div className="flex items-center justify-between pt-1">
                            {/* Verdict status next to submit button */}
                            <div>
                              {isSubmitting && (!verdict || verdict.overallVerdict === 'PENDING' || verdict.overallVerdict === 'PROCESSING') ? (
                                <div className="flex items-center space-x-2 text-xs font-medium text-code-muted bg-code-panel/80 px-3 py-1.5 rounded-sm border-code-border border">
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-code-accent" />
                                  <span>Judging... {verdict && verdict.totalTestcases > 0 ? `(${verdict.processedTestcases}/${verdict.totalTestcases})` : ''}</span>
                                </div>
                              ) : verdict && verdict.overallVerdict ? (
                                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm border text-xs font-medium ${getVerdictBadgeClass(verdict.overallVerdict)}`}>
                                  <span>{getVerdictLabel(verdict.overallVerdict)}</span>
                                  {verdict.overallVerdict === 'COMPILATION_ERROR' && verdict.compileOutput && (
                                    <button
                                      onClick={() => alert(verdict.compileOutput)}
                                      className="ml-1 text-[9px] underline lowercase text-code-muted hover:text-code-text"
                                      title="View compilation error"
                                    >
                                      (details)
                                    </button>
                                  )}
                                </div>
                              ) : null}
                            </div>

                            <button
                              onClick={handleSubmit}
                              disabled={isSubmitting || timeLeft <= 0 || !selectedProblemId}
                              className="flex items-center space-x-2 px-5 py-2.5 bg-code-accent hover:bg-code-accent-hover text-code-bg rounded-sm text-xs font-medium disabled:opacity-50 transition-all "
                            >
                              {isSubmitting ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              <span>{timeLeft <= 0 ? 'Contest Ended' : 'Submit Code'}</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-code-muted font-coding">
                        <p className="text-xs">No problem description available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* SUBMISSIONS TAB CONTENT */}
          {activeTab === 'submissions' && (
            <div className="flex-grow overflow-y-auto p-6 max-w-5xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-medium text-code-text tracking-tight flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-code-accent" />
                    <span>My Submissions</span>
                  </h2>
                </div>

                <button
                  onClick={fetchUserSubmissions}
                  disabled={loadingSubmissions}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-code-panel hover:bg-code-elevated text-code-muted border-code-border rounded-sm text-xs font-medium transition-all disabled:opacity-50 border"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                  <span>Refresh History</span>
                </button>
              </div>

              {loadingSubmissions && userSubmissions.length === 0 ? (
                <div className="flex h-60 items-center justify-center">
                  <div className="flex flex-col items-center space-y-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-code-accent" />
                    <span className="text-xs font-medium text-code-muted">Loading submissions history...</span>
                  </div>
                </div>
              ) : (
                <div className="bg-code-panel rounded-sm border-code-border overflow-hidden border">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-code-border bg-code-bg text-code-muted font-medium text-[10px]">
                          <th className="px-6 py-4 w-24 text-center">Problem</th>
                          <th className="px-6 py-4 w-28 text-left">Language</th>
                          <th className="px-6 py-4 w-36 text-left">Verdict</th>
                          <th className="px-6 py-4 w-24 text-left">Time</th>
                          <th className="px-6 py-4 w-28 text-left">Memory</th>
                          <th className="px-6 py-4 w-44 text-left">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-code-border divide-code-border">
                        {userSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center text-code-muted">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <Terminal className="h-10 w-10 opacity-20 mb-1" />
                                <p className="font-medium text-sm">No Submissions Found</p>
                                <p className="text-xs text-code-muted">Submit code in Problems tab and check back here!</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          userSubmissions.map((sub) => {
                            const probIndex = problems.findIndex(p => p.id === sub.problemId);
                            const letter = probIndex !== -1 ? String.fromCharCode(65 + probIndex) : '';
                            const timeStr = new Date(sub.submittedAt).toLocaleString();

                            return (
                              <tr key={sub.id} className="hover:bg-code-elevated transition-colors group">
                                {/* Problem (Letter badge only) */}
                                <td className="px-6 py-4 text-center w-24">
                                  <div className="flex justify-center">
                                    <span className={problemMarkerClass}>
                                      {letter}
                                    </span>
                                  </div>
                                </td>

                                {/* Language */}
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-coding font-medium text-code-muted">
                                  {sub.language}
                                </td>

                                {/* Verdict Badge */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-medium border ${getVerdictBadgeClass(sub.verdict)}`}>
                                    {getVerdictLabel(sub.verdict)}
                                  </span>
                                </td>

                                {/* Time */}
                                <td className="px-6 py-4 whitespace-nowrap font-coding text-xs font-semibold text-code-muted">
                                  {sub.executionTimeMs !== null ? `${sub.executionTimeMs} ms` : '-'}
                                </td>

                                {/* Memory */}
                                <td className="px-6 py-4 whitespace-nowrap font-coding text-xs font-semibold text-code-muted">
                                  {sub.memoryUsedKb !== null ? `${(sub.memoryUsedKb / 1024).toFixed(1)} MB` : '-'}
                                </td>

                                {/* Submitted At */}
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-code-muted">
                                  {timeStr}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RANKING TAB CONTENT */}
          {activeTab === 'ranking' && (
            <div className="coding-contest-ranking">
              <div className="coding-contest-ranking-inner">

                {/* Main Scoreboard Card */}
                <div className="bg-code-panel rounded-sm border-code-border overflow-hidden border">
                  {loadingLeaderboard && !leaderboardData ? (
                    <div className="p-16 text-center text-code-muted">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-code-accent" />
                      <span className="text-xs font-medium">Retrieving stand data...</span>
                    </div>
                  ) : !leaderboardData || leaderboardData.leaderboard?.length === 0 ? (
                    <div className="p-16 text-center text-code-muted">
                      <Trophy className="h-12 w-12 mx-auto opacity-25 mb-3" />
                      <p className="font-medium text-sm">No submissions recorded yet</p>
                      <p className="text-xs text-code-muted mt-1">Submit code to update leaderboard scoreboard.</p>
                    </div>
                  ) : (
                    <ContestStandings problems={problems} rows={leaderboardData.leaderboard} />
                  )}
                </div>
              </div>
            </div>
          )}

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

export default ContestWorkspace;
