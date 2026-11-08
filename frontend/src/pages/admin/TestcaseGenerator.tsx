import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, 
  Terminal, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings
} from 'lucide-react';
import api from '../../api/axios';
import { codingEditorFontFamily, codingEditorTheme, configureCodingEditor } from '../../utils/codingEditorTheme';
import { useWebSocket } from '../../context/WebSocketContext';
import type { ApiResponse, OjProblemDetailResponse, OjTestcaseGenWsMessage } from '../../types';

const LANGUAGES = [
  { id: 71, name: 'Python 3', monacoName: 'python', extension: 'py', defaultGenerator: 'import random\n\ndef generate():\n    # Print out random input data\n    a = random.randint(1, 1000)\n    b = random.randint(1, 1000)\n    print(f"{a} {b}")\n\nif __name__ == "__main__":\n    generate()', defaultSolution: 'import sys\n\ndef solve():\n    # Read from stdin and print standard output\n    line = sys.stdin.readline()\n    if not line: return\n    a, b = map(int, line.split())\n    print(a + b)\n\nif __name__ == "__main__":\n    solve()' },
  { id: 54, name: 'C++ (GCC)', monacoName: 'cpp', extension: 'cpp', defaultGenerator: '#include <iostream>\n#include <cstdlib>\n#include <ctime>\nusing namespace std;\n\nint main() {\n    srand(time(0));\n    // Print out random input data\n    int a = rand() % 1000 + 1;\n    int b = rand() % 1000 + 1;\n    cout << a << " " << b << endl;\n    return 0;\n}', defaultSolution: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read from stdin and print standard output\n    int a, b;\n    if (cin >> a >> b) {\n        cout << a + b << endl;\n    }\n    return 0;\n}' }
];

const formatUserFriendlyErrorMessage = (rawMessage: string, t: (key: string) => string): string => {
  if (!rawMessage) return t('coding.admin_testcase_unknown_error');

  let msg = rawMessage;
  let explanation = '';

  if (rawMessage.includes('NZEC') || rawMessage.includes('Non-Zero Exit Code') || rawMessage.includes('Runtime Error')) {
    explanation = t('coding.admin_testcase_runtime_error');
  } else if (rawMessage.includes('Compile Error') || rawMessage.includes('Compilation Error') || rawMessage.toLowerCase().includes('compile error')) {
    explanation = t('coding.admin_testcase_compile_error');
  } else if (rawMessage.includes('Time Limit Exceeded') || rawMessage.includes('TLE')) {
    explanation = t('coding.admin_testcase_time_error');
  } else if (rawMessage.includes('Memory Limit Exceeded') || rawMessage.includes('MLE')) {
    explanation = t('coding.admin_testcase_memory_error');
  }

  // Clean up technical labels in Vietnamese
  msg = msg
    .replace(/Lỗi sinh Output:/g, t('coding.admin_testcase_solution_error'))
    .replace(/Lỗi sinh Input:/g, t('coding.admin_testcase_generator_error'));

  if (explanation) {
    return `${explanation}\n\n[${t('coding.admin_testcase_error_details')}]:\n${msg}`;
  }

  return msg;
};

const TestcaseGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { subscribe, isConnected } = useWebSocket();

  const problemIdNum = Number(problemId);

  // States
  const [problem, setProblem] = useState<OjProblemDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [totalTestcases, setTotalTestcases] = useState<number>(10);
  const [generatorLangId, setGeneratorLangId] = useState(71);
  const [solutionLangId, setSolutionLangId] = useState(71);
  
  // Editor tabs & values
  const [activeEditorTab, setActiveEditorTab] = useState<'generator' | 'solution'>('generator');
  const [generatorCode, setGeneratorCode] = useState('');
  const [solutionCode, setSolutionCode] = useState('');

  // Generation log states
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [genStatus, setGenStatus] = useState<string>('IDLE'); // IDLE, RUNNING, SUCCESS, FAILED
  const [progress, setProgress] = useState(0);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const selectedGenLanguage = LANGUAGES.find(l => l.id === generatorLangId) || LANGUAGES[0];
  const selectedSolLanguage = LANGUAGES.find(l => l.id === solutionLangId) || LANGUAGES[0];

  // Load problem details
  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await api.get<ApiResponse<OjProblemDetailResponse>>(`/online-judge/problems/${problemId}`);
        setProblem(res.data.result);
        
        // Setup initial starter code
        setGeneratorCode(selectedGenLanguage.defaultGenerator);
        setSolutionCode(selectedSolLanguage.defaultSolution);
      } catch (err: any) {
        console.error('Failed to load problem info:', err);
        setErrorMsg(err?.response?.data?.message || 'Failed to load problem. Please check the ID.');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  // Update default code templates when languages are switched
  useEffect(() => {
    setGeneratorCode(selectedGenLanguage.defaultGenerator);
  }, [generatorLangId]);

  useEffect(() => {
    setSolutionCode(selectedSolLanguage.defaultSolution);
  }, [solutionLangId]);

  // Scroll logs container to bottom when log updates
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Subscribe to live log updates
  useEffect(() => {
    if (!problemIdNum) return;

    const topic = `/topic/testcase-generation/${problemIdNum}`;
    console.log(`Subscribing to testcase gen logs: ${topic}`);

    const subscription = subscribe(topic, (message) => {
      try {
        const data: OjTestcaseGenWsMessage = JSON.parse(message.body);
        console.log('Received generation log update:', data);

        const isSuccess = 
          data.status === 'SUCCESS' || 
          data.status === 'COMPLETED' || 
          data.type === 'TESTCASE_GENERATION_COMPLETED' ||
          data.message.toLowerCase().includes('successfully') ||
          data.message.toLowerCase().includes('thành công');

        const isFailure = 
          data.status === 'ERROR' || 
          data.status === 'FAILED' || 
          data.type === 'TESTCASE_GENERATION_FAILED' ||
          data.message.toLowerCase().includes('failed') ||
          data.message.toLowerCase().includes('thất bại') ||
          data.message.toLowerCase().includes('lỗi');

        const displayStatus = isSuccess ? 'SUCCESS' : (isFailure ? 'FAILED' : data.status);
        const formattedMessage = isFailure ? formatUserFriendlyErrorMessage(data.message, t) : data.message;

        // Append log line
        setLogs(prev => [...prev, `[${displayStatus}] ${formattedMessage}`]);

        // Parse progress if possible
        if (data.message.includes('Generating testcase') || data.message.includes('Generated testcase')) {
          const match = data.message.match(/(\d+)\/(\d+)/);
          if (match) {
            const current = Number(match[1]);
            const total = Number(match[2]);
            setProgress(Math.round((current / total) * 100));
          }
        }

        if (isSuccess) {
          setGenStatus('SUCCESS');
          setIsGenerating(false);
          setProgress(100);
        } else if (isFailure) {
          setGenStatus('FAILED');
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Failed to parse generation WS message:', err);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [problemIdNum, subscribe, t]);

  const handleStartGeneration = async () => {
    if (!generatorCode.trim() || !solutionCode.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenStatus('RUNNING');
    setLogs(['[SYSTEM] Starting automatic testcase generation...']);
    setProgress(0);

    try {
      const payload = {
        totalTestcasesToGenerate: totalTestcases,
        generatorCode: generatorCode,
        solutionCode: solutionCode,
        generatorLanguageId: generatorLangId,
        solutionLanguageId: solutionLangId
      };

      await api.post(`/online-judge/problems/${problemIdNum}/generate-testcases`, payload);
      setLogs(prev => [...prev, '[SYSTEM] Testcase generation accepted (202 Accepted). Connecting to logs...']);
    } catch (err: any) {
      console.error('Failed to start testcase generation:', err);
      const errMsg = err?.response?.data?.message || 'Failed to start testcase generation process.';
      setLogs(prev => [...prev, `[ERROR] Startup failed: ${errMsg}`]);
      setGenStatus('FAILED');
      setIsGenerating(false);
    }
  };

  const getStatusBadge = () => {
    switch (genStatus) {
      case 'RUNNING':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold animate-pulse">
            Processing...
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center space-x-1">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Success</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center space-x-1">
            <XCircle className="h-3.5 w-3.5" />
            <span>Failure</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-bold">
            Ready (Idle)
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading problem data...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !problem) {
    return (
      <div className="mx-auto max-w-md text-center py-20 px-4 min-h-[70vh] flex flex-col justify-center items-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">An error occurred</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{errorMsg || 'Failed to load problem.'}</p>
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="admin-testcase flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-left">
      
      {/* LEFT COLUMN: Controls & WebSockets Logs console (40% width) */}
      <div className="w-full lg:w-2/5 flex flex-col h-1/2 lg:h-full border-r border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 select-none shrink-0">
        
        {/* Navigation & Header title */}
        <div className="px-5 py-3.5 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <h2 className="text-sm font-extrabold text-slate-950 dark:text-white line-clamp-1 max-w-[200px] md:max-w-xs">
                Generate Testcases Automatically
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                Problem: {problem.title}
              </span>
            </div>
          </div>
        </div>

        {/* Form controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
              <Settings className="h-4 w-4" />
              <span>Generator Config</span>
            </span>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Total testcases */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Number of testcases (1-100):
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={totalTestcases}
                disabled={isGenerating}
                onChange={(e) => setTotalTestcases(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-bold"
              />
            </div>

            {/* Submit button */}
            <div className="flex items-end">
              <button
                onClick={handleStartGeneration}
                disabled={isGenerating || !generatorCode.trim() || !solutionCode.trim()}
                className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shadow-indigo-600/10 hover:shadow-indigo-600/25"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>Start Generating</span>
              </button>
            </div>

          </div>

          {/* Languages config */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Generator Language:
              </label>
              <select
                value={generatorLangId}
                disabled={isGenerating}
                onChange={(e) => setGeneratorLangId(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Solution Language:
              </label>
              <select
                value={solutionLangId}
                disabled={isGenerating}
                onChange={(e) => setSolutionLangId(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live log Console area */}
        <div className="flex-grow flex flex-col bg-slate-950 overflow-hidden relative border-t border-slate-900">
          
          {/* Terminal Console Header */}
          <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/50 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">WebSocket Live Log</span>
            </div>
            
            {/* WS connection indicator */}
            <div className="flex items-center space-x-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
              <span className="text-[8px] text-slate-500 font-bold uppercase">
                {isConnected ? 'Sync Active' : 'Sync Closed'}
              </span>
            </div>
          </div>

          {/* Logs lists scroll */}
          <div className="flex-grow overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] leading-relaxed text-slate-300 text-left select-text scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 select-none">
                <Terminal className="h-8 w-8 text-slate-800 mb-2 opacity-50" />
                <p className="text-[10px]">Configure and click generate to view execution logs from Judge0.</p>
              </div>
            ) : (
              <>
                {logs.map((log, index) => {
                  let colorClass = 'text-slate-300';
                  if (log.includes('[ERROR]') || log.includes('[FAILED]')) colorClass = 'text-rose-400 font-bold';
                  else if (log.includes('[SUCCESS]')) colorClass = 'text-emerald-400 font-bold';
                  else if (log.includes('[SYSTEM]')) colorClass = 'text-indigo-400';
                  
                  return (
                    <div key={index} className={colorClass}>
                      {log}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </>
            )}
          </div>

          {/* Progress bar at the bottom */}
          {isGenerating && (
            <div className="h-1 bg-slate-900 w-full shrink-0 relative overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN: Monaco editor tabs (60% width) */}
      <div className="w-full lg:w-3/5 flex flex-col h-1/2 lg:h-full bg-slate-950 overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-900 shrink-0 bg-slate-950 select-none">
          <button
            onClick={() => setActiveEditorTab('generator')}
            className={`px-6 py-3.5 text-xs font-bold transition-all border-b-2 tracking-wider uppercase ${
              activeEditorTab === 'generator'
                ? 'border-indigo-600 text-indigo-400 dark:border-indigo-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Input Generator
          </button>
          <button
            onClick={() => setActiveEditorTab('solution')}
            className={`px-6 py-3.5 text-xs font-bold transition-all border-b-2 tracking-wider uppercase ${
              activeEditorTab === 'solution'
                ? 'border-indigo-600 text-indigo-400 dark:border-indigo-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard Solution
          </button>
        </div>

        {/* Monaco Editor area */}
        <div className="flex-grow bg-slate-950 relative">
          <Editor
            height="100%"
            language={activeEditorTab === 'generator' ? selectedGenLanguage.monacoName : selectedSolLanguage.monacoName}
            value={activeEditorTab === 'generator' ? generatorCode : solutionCode}
            onChange={(val) => {
              if (val !== undefined) {
                if (activeEditorTab === 'generator') setGeneratorCode(val);
                else setSolutionCode(val);
              }
            }}
            beforeMount={configureCodingEditor}
            theme={codingEditorTheme}
            loading={
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
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

    </div>
  );
};

export default TestcaseGenerator;
