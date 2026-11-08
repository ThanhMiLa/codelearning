import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  RefreshCw, 
  FilePlus, 
  Code,
  ChevronRight,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  GripVertical,
  Users,
  CreditCard,
  Search,
  ChevronDown,
  UserRound
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/errorUtils';
import { useAuth } from '../../context/AuthContext';
import type { 
  ApiResponse, 
  OjAdminProblemResponse,
  PageResponse,
  ContestListResponse,
  ContestResponse,
  AdminUserResponse,
  AdminPaymentTransactionResponse,
  OjAdminSubmissionSearchRequest,
  OjAdminSubmissionResponse
} from '../../types';

type DashboardTab = 'problems' | 'contests' | 'users' | 'payments' | 'submissions' | 'emails';

interface MultiSelectDropdownProps {
  options: { value: string | number; label: string }[];
  selectedValues: any[];
  onChange: (values: any[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string | number) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v: any) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none flex justify-between items-center gap-2 min-w-[150px] w-full"
      >
        <span className="truncate max-w-[120px] text-slate-700 dark:text-slate-300">
          {selectedValues.length === 0 ? placeholder : `${selectedValues.length} selected`}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full min-w-[200px] max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => toggleOption(opt.value)}
              className="px-3 py-2 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                readOnly
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-900 pointer-events-none"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 select-none whitespace-nowrap">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('problems');

  // Problems states
  const [problems, setProblems] = useState<OjAdminProblemResponse[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [problemsPage, setProblemsPage] = useState(0);
  const [problemsTotalPages, setProblemsTotalPages] = useState(0);
  const [problemsTotalElements, setProblemsTotalElements] = useState(0);

  // Contests states
  const [contests, setContests] = useState<ContestListResponse[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [contestsPage, setContestsPage] = useState(0);
  const [contestsTotalPages, setContestsTotalPages] = useState(0);
  const [contestsTotalElements, setContestsTotalElements] = useState(0);

  // Users states
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalElements, setUsersTotalElements] = useState(0);
  const [userSearchKeyword, setUserSearchKeyword] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // State variables for Emails
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [emailTargets, setEmailTargets] = useState<any[]>([]);
  const [loadingEmailTargets, setLoadingEmailTargets] = useState(false);
  const [emailTargetSearchKeyword, setEmailTargetSearchKeyword] = useState('');
  const [emailTargetRoleFilter, setEmailTargetRoleFilter] = useState('');
  const [selectedEmailUserIds, setSelectedEmailUserIds] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Payments states
  const [payments, setPayments] = useState<AdminPaymentTransactionResponse[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(0);
  const [paymentsTotalElements, setPaymentsTotalElements] = useState(0);
  const [paymentSearchKeyword, setPaymentSearchKeyword] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');

  // Submissions states
  const [submissions, setSubmissions] = useState<OjAdminSubmissionResponse[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsPage, setSubmissionsPage] = useState(0);
  const [submissionsTotalPages, setSubmissionsTotalPages] = useState(0);
  const [submissionsTotalElements, setSubmissionsTotalElements] = useState(0);
  
  const [submissionSearch, setSubmissionSearch] = useState<OjAdminSubmissionSearchRequest>({
    problemTitle: '',
    userDisplayName: '',
    verdict: [],
    languageId: []
  });

  // Contest CRUD Modals
  const [showContestModal, setShowContestModal] = useState(false);
  const [editingContestId, setEditingContestId] = useState<number | null>(null);
  const [contestTitle, setContestTitle] = useState('');
  const [contestDesc, setContestDesc] = useState('');
  const [contestPassword, setContestPassword] = useState('');
  const [contestScoringRule, setContestScoringRule] = useState<'ICPC' | 'IOI' | 'CUSTOM'>('ICPC');
  const [contestStartTime, setContestStartTime] = useState('');
  const [contestEndTime, setContestEndTime] = useState('');
  const [savingContest, setSavingContest] = useState(false);

  // Contest Problems Management
  const [selectedContest, setSelectedContest] = useState<ContestListResponse | null>(null);
  const [contestProblems, setContestProblems] = useState<any[]>([]);
  const [loadingContestProblems, setLoadingContestProblems] = useState(false);
  const [showAddProblemToContestModal, setShowAddProblemToContestModal] = useState(false);
  const [searchProblemKeyword, setSearchProblemKeyword] = useState('');
  const [allProblemsForSelection, setAllProblemsForSelection] = useState<OjAdminProblemResponse[]>([]);
  const [loadingSelectionProblems, setLoadingSelectionProblems] = useState(false);

  // Ref to always track latest contestProblems for drag and drop without stale closures
  const contestProblemsRef = React.useRef(contestProblems);
  React.useEffect(() => {
    contestProblemsRef.current = contestProblems;
  }, [contestProblems]);

  // Problem creation modal
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [probTitle, setProbTitle] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [probInput, setProbInput] = useState('');
  const [probOutput, setProbOutput] = useState('');
  const [probConstraints, setProbConstraints] = useState('');
  const [probExampleInput, setProbExampleInput] = useState('');
  const [probExampleOutput, setProbExampleOutput] = useState('');
  const [probHint, setProbHint] = useState('');
  const [probDifficulty, setProbDifficulty] = useState('EASY');
  const [probScope, setProbScope] = useState('CONTEST');
  const [probTimeLimit, setProbTimeLimit] = useState('1000');
  const [probMemoryLimit, setProbMemoryLimit] = useState('262144');
  const [probScore] = useState('10');
  const [savingProblem, setSavingProblem] = useState(false);

  useEffect(() => {
    fetchProblems(problemsPage);
  }, [problemsPage]);

  useEffect(() => {
    if (activeTab === 'contests') {
      fetchContests(contestsPage);
    } else if (activeTab === 'emails') {
      fetchEmailTemplates();
      fetchEmailTargets();
    }
  }, [activeTab, contestsPage]);

  const fetchEmailTemplates = async () => {
    try {
      const res = await api.get('/admin/emails/templates');
      if (res.data && res.data.result && res.data.result.templates) {
        setEmailTemplates(res.data.result.templates);
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to fetch email templates');
    }
  };

  const fetchEmailTargets = async (overrideKeyword?: string, overrideRole?: string) => {
    setLoadingEmailTargets(true);
    try {
      const kw = overrideKeyword !== undefined ? overrideKeyword : emailTargetSearchKeyword;
      const role = overrideRole !== undefined ? overrideRole : emailTargetRoleFilter;
      let url = '/admin/users/email-targets';
      const params = new URLSearchParams();
      if (kw) params.append('keyword', kw);
      if (role) params.append('role', role);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await api.get(url);
      if (res.data && res.data.result) {
        setEmailTargets(res.data.result);
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to fetch email targets');
    } finally {
      setLoadingEmailTargets(false);
    }
  };

  const handleSendEmailCampaign = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select an email template');
      return;
    }

    // Calculate if we are targeting ALL users (no filters + all checkboxes checked)
    const isTargetingAll = emailTargets.length > 0 && 
                           selectedEmailUserIds.length === emailTargets.length && 
                           !emailTargetSearchKeyword && 
                           !emailTargetRoleFilter;
                           
    const targetType = isTargetingAll ? 'ALL' : 'SPECIFIC';

    if (targetType === 'SPECIFIC' && selectedEmailUserIds.length === 0) {
      toast.error('Please select at least one target user');
      return;
    }

    setSendingEmail(true);
    try {
      await api.post('/admin/emails/send', {
        templateId: selectedTemplateId,
        targetType: targetType,
        userIds: targetType === 'SPECIFIC' ? selectedEmailUserIds : undefined
      });
      toast.success(`Successfully sent emails to ${targetType === 'ALL' ? 'all' : selectedEmailUserIds.length} users!`);
      setSelectedEmailUserIds([]); // reset selection
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to send email campaign');
    } finally {
      setSendingEmail(false);
    }
  };

  const fetchUsers = async (page: number = 0, keyword: string = userSearchKeyword, isOnline: boolean = showOnlineOnly) => {
    setLoadingUsers(true);
    try {
      const endpoint = isOnline ? '/admin/users/online' : '/admin/users';
      const res = await api.get<ApiResponse<PageResponse<AdminUserResponse>>>(endpoint, {
        params: { page, size: 20, keyword: keyword || undefined }
      });
      const data = res.data.result;
      setUsers(data.content || []);
      setUsersPage(data.page || 0);
      setUsersTotalPages(data.totalPages || 0);
      setUsersTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch admin users:', getErrorMessage(error));
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPayments = async (
    page: number = 0,
    keyword: string = paymentSearchKeyword,
    status: string = paymentStatusFilter,
    type: string = paymentTypeFilter
  ) => {
    setLoadingPayments(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<AdminPaymentTransactionResponse>>>('/admin/payment-transactions', {
        params: {
          page,
          size: 20,
          keyword: keyword || undefined,
          status: status || undefined,
          type: type || undefined
        }
      });
      const data = res.data.result;
      setPayments(data.content || []);
      setPaymentsPage(data.page || 0);
      setPaymentsTotalPages(data.totalPages || 0);
      setPaymentsTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch admin payment transactions:', getErrorMessage(error));
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(usersPage);
    }
  }, [activeTab, usersPage, showOnlineOnly]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments(paymentsPage);
    }
  }, [activeTab, paymentsPage]);

  const fetchSubmissions = async (page: number = 0, filters = submissionSearch) => {
    setLoadingSubmissions(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<OjAdminSubmissionResponse>>>('/online-judge/admin/submissions', {
        params: {
          page,
          size: 20,
          problemTitle: filters.problemTitle || undefined,
          userDisplayName: filters.userDisplayName || undefined,
          verdict: filters.verdict && filters.verdict.length > 0 ? filters.verdict.join(',') : undefined,
          languageId: filters.languageId && filters.languageId.length > 0 ? filters.languageId.join(',') : undefined
        }
      });
      const data = res.data.result;
      setSubmissions(data.content || []);
      setSubmissionsPage(data.page || 0);
      setSubmissionsTotalPages(data.totalPages || 0);
      setSubmissionsTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch admin submissions:', getErrorMessage(error));
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions(submissionsPage);
    }
  }, [activeTab, submissionsPage]);

  // Date converters with browser local timezone support
  const convertToIsoWithOffset = (datetimeLocalStr: string) => {
    if (!datetimeLocalStr) return '';
    const date = new Date(datetimeLocalStr);
    const tzOffset = -date.getTimezoneOffset();
    const diff = tzOffset >= 0 ? '+' : '-';
    const pad = (num: number) => String(num).padStart(2, '0');
    const offsetStr = diff + pad(Math.floor(Math.abs(tzOffset) / 60)) + ':' + pad(Math.abs(tzOffset) % 60);
    return `${datetimeLocalStr}:00${offsetStr}`;
  };

  const convertFromIsoToLocal = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  const formatDateTime = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContestStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30';
      case 'UPCOMING': return 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/30';
      case 'ENDED': return 'text-slate-500 bg-slate-50 border-slate-100 dark:text-slate-400 dark:bg-slate-950/30';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const fetchContests = async (page: number = 0) => {
    setLoadingContests(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<ContestListResponse>>>('/contests', {
        params: { page, size: 10 }
      });
      const data = res.data.result;
      setContests(data.content || []);
      setContestsPage(data.page);
      setContestsTotalPages(data.totalPages);
      setContestsTotalElements(data.totalElements);
    } catch (err) {
      console.error('Failed to load contests:', err);
    } finally {
      setLoadingContests(false);
    }
  };

  const handleOpenContestModal = async (contest: ContestListResponse | null = null) => {
    if (contest) {
      setEditingContestId(contest.id);
      setContestTitle(contest.title);
      setContestScoringRule('ICPC');
      setContestPassword('');
      setContestStartTime(convertFromIsoToLocal(contest.startTime));
      setContestEndTime(convertFromIsoToLocal(contest.endTime));
      
      try {
        const res = await api.get<ApiResponse<ContestResponse>>(`/contests/${contest.id}`);
        const data = res.data.result;
        setContestDesc(data.description || '');
        setContestScoringRule(data.scoringRule);
      } catch (err) {
        console.error('Failed to load contest detail:', err);
      }
    } else {
      setEditingContestId(null);
      setContestTitle('');
      setContestDesc('');
      setContestPassword('');
      setContestScoringRule('ICPC');
      const now = new Date();
      const formatStr = (d: Date) => {
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setContestStartTime(formatStr(now));
      const end = new Date();
      end.setHours(end.getHours() + 3);
      setContestEndTime(formatStr(end));
    }
    setShowContestModal(true);
  };

  const handleSaveContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestTitle.trim() || !contestStartTime || !contestEndTime) return;

    setSavingContest(true);
    try {
      const payload: any = {
        title: contestTitle,
        description: contestDesc,
        scoringRule: contestScoringRule,
        startTime: convertToIsoWithOffset(contestStartTime),
        endTime: convertToIsoWithOffset(contestEndTime)
      };
      
      if (contestPassword.trim()) {
        payload.password = contestPassword.trim();
      }

      if (editingContestId) {
        const updatePayload = {
          title: contestTitle,
          description: contestDesc,
          scoringRule: contestScoringRule,
          startTime: convertToIsoWithOffset(contestStartTime),
          endTime: convertToIsoWithOffset(contestEndTime),
          newPassword: contestPassword.trim() || undefined
        };
        await api.put(`/contests/${editingContestId}`, updatePayload);
      } else {
        await api.post('/contests', payload);
      }
      setShowContestModal(false);
      fetchContests(contestsPage);
    } catch (err: any) {
      console.error('Failed to save contest:', err);
      alert(getErrorMessage(err));
    } finally {
      setSavingContest(false);
    }
  };

  const fetchContestProblems = async (contestId: number) => {
    setLoadingContestProblems(true);
    try {
      const res = await api.get<ApiResponse<any[]>>(`/contests/${contestId}/problems`);
      setContestProblems(res.data.result || []);
    } catch (err) {
      console.error('Failed to load contest problems:', err);
    } finally {
      setLoadingContestProblems(false);
    }
  };

  const handleRemoveProblemFromContest = async (problemId: number) => {
    if (!selectedContest) return;
    if (window.confirm('Are you sure you want to remove this problem from the contest?')) {
      try {
        await api.delete(`/contests/${selectedContest.id}/problems/${problemId}`);
        fetchContestProblems(selectedContest.id);
      } catch (err) {
        console.error('Failed to remove problem:', err);
        alert(getErrorMessage(err));
      }
    }
  };

  const handleSendReorderRequest = async () => {
    if (!selectedContest) return;
    
    const payload = contestProblemsRef.current.map((prob, idx) => ({
      problemId: Number(prob.id),
      orderIndex: idx + 1
    }));

    try {
      console.log('Sending reorder request:', payload);
      await api.put(`/contests/${Number(selectedContest.id)}/problems/reorder`, payload);
    } catch (err) {
      console.error('Failed to reorder contest problems on backend:', err);
      // Re-fetch to restore database order if API call fails
      fetchContestProblems(selectedContest.id);
    }
  };

  const fetchSelectionProblems = async () => {
    setLoadingSelectionProblems(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<OjAdminProblemResponse>>>('/online-judge/admin/problems', {
        params: { page: 0, size: 100, scope: 'CONTEST' }
      });
      setAllProblemsForSelection(res.data.result.content || []);
    } catch (err) {
      console.error('Failed to fetch selection problems:', err);
    } finally {
      setLoadingSelectionProblems(false);
    }
  };

  const handleAddProblemToContest = async (problemId: number) => {
    if (!selectedContest) return;
    try {
      const contestIdNum = Number(selectedContest.id);
      const problemIdNum = Number(problemId);
      console.log('Adding problem to contest:', { contestId: contestIdNum, problemIds: [problemIdNum] });
      await api.post(`/contests/${contestIdNum}/problems`, {
        problemIds: [problemIdNum]
      });
      fetchContestProblems(selectedContest.id);
      setShowAddProblemToContestModal(false);
    } catch (err: any) {
      console.error('Failed to add problem to contest error details:', err?.response?.data || err);
      alert(getErrorMessage(err));
    }
  };

  const fetchProblems = async (page: number = 0) => {
    setLoadingProblems(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<OjAdminProblemResponse>>>('/online-judge/admin/problems', {
        params: { page }
      });
      const data = res.data.result;
      setProblems(data.content || []);
      setProblemsPage(data.page);
      setProblemsTotalPages(data.totalPages);
      setProblemsTotalElements(data.totalElements);
    } catch (err) {
      console.error('Failed to load OJ problems:', err);
    } finally {
      setLoadingProblems(false);
    }
  };

  const handleToggleVisibility = async (problemId: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/online-judge/admin/problems/${problemId}/public`, null, {
        params: { isPublic: newStatus }
      });
      setProblems(prev => prev.map(p => p.id === problemId ? { ...p, isPublic: newStatus } : p));
    } catch (err) {
      console.error('Failed to update problem visibility:', err);
      alert(getErrorMessage(err));
    }
  };

  // PROBLEM CRUD
  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probTitle.trim()) return;

    setSavingProblem(true);
    try {
      const payload = {
        title: probTitle,
        description: probDesc,
        inputDescription: probInput,
        outputDescription: probOutput,
        constraints: probConstraints,
        exampleInput: probExampleInput,
        exampleOutput: probExampleOutput,
        hint: probHint,
        problemScope: probScope,
        difficulty: probDifficulty,
        timeLimitMs: Number(probTimeLimit),
        memoryLimitKb: Number(probMemoryLimit),
        score: Number(probScore),
        tagIds: []
      };

      await api.post('/online-judge/admin/problems', payload);
      setShowProblemModal(false);
      fetchProblems();
      
      // Clear inputs
      setProbTitle('');
      setProbDesc('');
      setProbInput('');
      setProbOutput('');
      setProbConstraints('');
      setProbExampleInput('');
      setProbExampleOutput('');
      setProbHint('');
    } catch (err: any) {
      console.error('Failed to create problem:', err);
      alert(getErrorMessage(err));
    } finally {
      setSavingProblem(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
      case 'HARD': return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30';
      default: return '';
    }
  };

  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case 'CONTEST':
        return 'text-amber-600 bg-amber-50/80 border-amber-200/70 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900/40';
      case 'LESSON':
        return 'text-purple-600 bg-purple-50/80 border-purple-200/70 dark:text-purple-400 dark:bg-purple-950/40 dark:border-purple-900/40';
      case 'PRACTICE':
      default:
        return 'text-blue-600 bg-blue-50/80 border-blue-200/70 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-900/40';
    }
  };

  return (
    <div className="admin-dashboard flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden text-left">
      
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
          
          <button
            onClick={() => setActiveTab('problems')}
            aria-pressed={activeTab === 'problems'}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'problems'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code className="h-5 w-5 shrink-0" />
            <span className="truncate">Problem Bank (OJ)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('contests')}
            aria-pressed={activeTab === 'contests'}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'contests'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="h-5 w-5 shrink-0" />
            <span className="truncate">Contests</span>
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            aria-pressed={activeTab === 'users'}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="truncate">Management User</span>
          </button>
          
          <button
            onClick={() => setActiveTab('payments')}
            aria-pressed={activeTab === 'payments'}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'payments'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="h-5 w-5 shrink-0" />
            <span className="truncate">Payments</span>
          </button>
          
          <button
            onClick={() => setActiveTab('submissions')}
            aria-pressed={activeTab === 'submissions'}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'submissions'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FilePlus className="h-5 w-5 shrink-0" />
            <span className="truncate">Global Submissions</span>
          </button>

          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Marketing</p>

          <button
            onClick={() => setActiveTab('emails')}
            aria-pressed={activeTab === 'emails'}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'emails'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="truncate">Email Campaigns</span>
          </button>
        </div>
        
        <div className="admin-sidebar-footer p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <Link to="/profile" className="admin-sidebar-account">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" width={32} height={32} />
            ) : (
              <span className="admin-sidebar-avatar"><UserRound size={18} aria-hidden="true" /></span>
            )}
            <span>{user?.displayName}</span>
          </Link>
          <Link to="/" className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="mx-auto max-w-[1400px]">

      {activeTab === 'problems' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Code className="h-5 w-5 text-indigo-500" />
              <span>Problem Bank (OJ)</span>
            </h3>
            <button
              onClick={() => setShowProblemModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Problem</span>
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden">
          {loadingProblems ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : problems.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Code className="h-12 w-12 mx-auto opacity-30 mb-3" />
              <p className="font-bold text-xs">Problem bank empty</p>
              <button
                onClick={() => setShowProblemModal(true)}
                className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Problem</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto select-none text-left">
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/20 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4">Problem Name</th>
                      <th className="px-6 py-4 w-32">Scope</th>
                      <th className="px-6 py-4 w-32">Difficulty</th>
                      <th className="px-6 py-4 w-36 text-center">Visibility</th>
                      <th className="px-6 py-4 w-40 text-center">Submissions</th>
                      <th className="px-6 py-4 w-48 text-center">Config</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {problems.map((prob) => (
                      <tr key={prob.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {prob.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${getScopeBadgeColor(prob.scope)}`}>
                            {prob.scope || 'PRACTICE'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyColor(prob.difficulty)}`}>
                            {prob.difficulty === 'EASY' ? 'Easy' : prob.difficulty === 'MEDIUM' ? 'Medium' : 'Hard'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleVisibility(prob.id, prob.isPublic)}
                            className="inline-flex items-center space-x-2 focus:outline-none cursor-pointer"
                          >
                            <div className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${prob.isPublic ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white w-4.5 h-4.5 rounded-full shadow transition-transform duration-200 ${prob.isPublic ? 'translate-x-4.5' : 'translate-x-0'}`} />
                            </div>
                            <span className={`text-xs font-bold ${prob.isPublic ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {prob.isPublic ? 'Public' : 'Private'}
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-semibold text-slate-500">
                          {prob.totalSubmissions}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            to={`/admin/problems/${prob.id}/testcases`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/20 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            <span>{t('coding.admin_generate_testcases')}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Problems */}
              {problemsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50/20 dark:bg-slate-950/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Showing <span className="text-slate-800 dark:text-white">{(problemsPage * 20) + 1}</span> to{' '}
                    <span className="text-slate-800 dark:text-white">
                      {Math.min((problemsPage + 1) * 20, problemsTotalElements)}
                    </span>{' '}
                    of <span className="text-slate-800 dark:text-white">{problemsTotalElements}</span> problems
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setProblemsPage(prev => Math.max(prev - 1, 0))}
                      disabled={problemsPage === 0}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 dark:text-white" />
                    </button>
                    
                    <div className="flex items-center space-x-1.5">
                      {Array.from({ length: problemsTotalPages }, (_, idx) => {
                        if (idx === problemsPage || idx === 0 || idx === problemsTotalPages - 1 || Math.abs(idx - problemsPage) <= 1) {
                          return (
                            <button
                              key={idx}
                              onClick={() => setProblemsPage(idx)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                problemsPage === idx
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/15'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:text-slate-300'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        } else if (idx === 1 || idx === problemsTotalPages - 2) {
                          return <span key={idx} className="text-slate-400 dark:text-slate-600 px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setProblemsPage(prev => Math.min(prev + 1, problemsTotalPages - 1))}
                      disabled={problemsPage === problemsTotalPages - 1}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4 dark:text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* 3. CONTESTS TAB CONTENT */}
      {activeTab === 'contests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left panel: Contests list (1/3 width) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-indigo-500" />
                <span>Contests List ({contestsTotalElements})</span>
              </h3>
              <button
                onClick={() => handleOpenContestModal(null)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Contest</span>
              </button>
            </div>

            {loadingContests ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse bg-white dark:bg-slate-900 h-20 rounded-2xl border border-slate-300 dark:border-slate-800"></div>
                ))}
              </div>
            ) : contests.length === 0 ? (
              <p className="text-xs text-slate-500">No contests found.</p>
            ) : (
              <div className="space-y-3">
                {contests.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedContest(c);
                      fetchContestProblems(c.id);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedContest?.id === c.id
                        ? 'bg-indigo-50/70 border-indigo-500 dark:bg-indigo-950/20 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="space-y-1 pr-3 flex-grow overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${getContestStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{c.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{formatDateTime(c.startTime)}</p>
                    </div>
                    <ChevronRight className={`h-4.5 w-4.5 text-slate-400 transition-transform ${selectedContest?.id === c.id ? 'translate-x-1 text-indigo-500' : ''}`} />
                  </button>
                ))}

                {/* Contests Pagination */}
                {contestsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 select-none">
                    <button
                      onClick={() => setContestsPage(prev => Math.max(prev - 1, 0))}
                      disabled={contestsPage === 0}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-30 cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs text-slate-500 font-bold dark:text-slate-400">
                      Page {contestsPage + 1} of {contestsTotalPages}
                    </span>
                    <button
                      onClick={() => setContestsPage(prev => Math.min(prev + 1, contestsTotalPages - 1))}
                      disabled={contestsPage === contestsTotalPages - 1}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-30 cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Contest Problems Manager (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedContest ? (
              <>
                {/* Contest Info Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 p-6 shadow-sm space-y-4 text-left">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-black text-slate-950 dark:text-white">{selectedContest.title}</h4>
                        <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/35">
                          {selectedContest.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">
                        Starts: {formatDateTime(selectedContest.startTime)} | Ends: {formatDateTime(selectedContest.endTime)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenContestModal(selectedContest)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Contest Info</span>
                    </button>
                  </div>
                </div>

                {/* Problems Management for Contest */}
                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <Code className="h-5 w-5 text-indigo-500" />
                    <span>Contest Problems</span>
                  </h3>
                  
                  <button
                    onClick={() => {
                      fetchSelectionProblems();
                      setShowAddProblemToContestModal(true);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/25 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Assign Problem</span>
                  </button>
                </div>

                {loadingContestProblems ? (
                  <div className="p-12 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                  </div>
                ) : contestProblems.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-300 dark:border-slate-800 text-center text-slate-400 dark:text-slate-400">
                    <Code className="h-10 w-10 mx-auto opacity-35 mb-2" />
                    <p className="font-bold text-xs">No Problems Assigned</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Start assigning problems from the Problem Bank to this contest.</p>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={contestProblems}
                    onReorder={setContestProblems}
                    className="space-y-3"
                  >
                    {contestProblems.map((prob, lIdx) => (
                      <Reorder.Item
                        key={prob.id}
                        value={prob}
                        onDragEnd={handleSendReorderRequest}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing select-none hover:border-slate-350 dark:hover:border-slate-700 shadow-sm"
                      >
                        <div className="flex items-center space-x-3 text-left flex-grow">
                          <GripVertical className="h-4 w-4 text-slate-400 shrink-0 cursor-grab" />
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-300">
                              {String.fromCharCode(65 + lIdx)}. {prob.title}
                            </h5>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveProblemFromContest(prob.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 border border-slate-300 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 h-64 flex flex-col justify-center items-center">
                <Trophy className="h-10 w-10 opacity-30 mb-2" />
                <p className="font-bold text-xs">No Contest Selected</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Please click and select a contest from the left sidebar to manage details and problems.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. MANAGEMENT USER TAB CONTENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <span>User Management</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {showOnlineOnly ? 'Total online users:' : 'Total accounts registered:'} <span className="font-bold text-slate-800 dark:text-slate-200">{usersTotalElements}</span>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUsersPage(0);
                fetchUsers(0, userSearchKeyword, showOnlineOnly);
              }}
              className="flex items-center space-x-2"
            >
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, name, email, phone..."
                  value={userSearchKeyword}
                  onChange={(e) => setUserSearchKeyword(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 sm:w-80"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOnlineOnly(!showOnlineOnly);
                  if (usersPage !== 0) {
                    setUsersPage(0);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                  showOnlineOnly 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showOnlineOnly ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span>Online</span>
              </button>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loadingUsers ? (
              <div className="p-12 flex justify-center items-center space-x-2 text-slate-500 text-xs">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <span>Loading users data...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Users className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p>No user records found matching criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-6">Display Name</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Phone</th>
                      <th className="py-4 px-6">Wallet Balance</th>
                      <th className="py-4 px-6">Created At</th>
                      <th className="py-4 px-6">Status / Roles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                          #{u.id}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-xs">
                              {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {u.displayName || u.username}
                              </p>
                              <p className="text-[10px] text-slate-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                          {u.email}
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">
                          {u.phoneNumber || 'N/A'}
                        </td>
                        <td className="py-4 px-6 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {Number(u.balance || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDateTime(u.createdAt)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                            }`}>
                              {u.status || 'ACTIVE'}
                            </span>
                            {u.roles && u.roles.map((r) => (
                              <span key={r} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800">
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {usersTotalPages > 1 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {usersPage + 1} of {usersTotalPages} ({usersTotalElements} total users)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={usersPage === 0 || loadingUsers}
                    onClick={() => setUsersPage((prev) => Math.max(0, prev - 1))}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={usersPage >= usersTotalPages - 1 || loadingUsers}
                    onClick={() => setUsersPage((prev) => prev + 1)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PAYMENT TRANSACTION TAB CONTENT */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                <span>Payment Transactions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total recorded transactions: <span className="font-bold text-slate-800 dark:text-slate-200">{paymentsTotalElements}</span>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPaymentsPage(0);
                fetchPayments(0, paymentSearchKeyword, paymentStatusFilter, paymentTypeFilter);
              }}
              className="flex flex-wrap items-center gap-2"
            >
              {/* Type Filter */}
              <select
                value={paymentTypeFilter}
                onChange={(e) => {
                  setPaymentTypeFilter(e.target.value);
                  setPaymentsPage(0);
                  fetchPayments(0, paymentSearchKeyword, paymentStatusFilter, e.target.value);
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAW">Withdraw</option>
              </select>

              {/* Status Filter */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPaymentsPage(0);
                  fetchPayments(0, paymentSearchKeyword, e.target.value, paymentTypeFilter);
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="LATE_SUCCESS">Late Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, user name..."
                  value={paymentSearchKeyword}
                  onChange={(e) => setPaymentSearchKeyword(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Payment Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loadingPayments ? (
              <div className="p-12 flex justify-center items-center space-x-2 text-slate-500 text-xs">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <span>Loading transaction logs...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CreditCard className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p>No payment transaction records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6">Transaction Code</th>
                      <th className="py-4 px-6">User Display Name</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {payments.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {tx.transactionCode}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                          {tx.userDisplayName || (tx.userId ? `User #${tx.userId}` : 'N/A')}
                        </td>
                        <td className="py-4 px-6 font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {Number(tx.amount || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            tx.type === 'DEPOSIT'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : tx.status === 'LATE_SUCCESS'
                              ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                              : tx.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                              : tx.status === 'FAILED'
                              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                              : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {paymentsTotalPages > 1 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {paymentsPage + 1} of {paymentsTotalPages} ({paymentsTotalElements} total transactions)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={paymentsPage === 0 || loadingPayments}
                    onClick={() => setPaymentsPage((prev) => Math.max(0, prev - 1))}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={paymentsPage >= paymentsTotalPages - 1 || loadingPayments}
                    onClick={() => setPaymentsPage((prev) => prev + 1)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 6. SUBMISSIONS TAB CONTENT */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center space-x-2">
                <Code className="h-5 w-5 text-indigo-500" />
                <span>Global Submissions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total submissions: <span className="font-bold text-slate-800 dark:text-slate-200">{submissionsTotalElements}</span>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmissionsPage(0);
                fetchSubmissions(0);
              }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search problem..."
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-48"
                  value={submissionSearch.problemTitle || ''}
                  onChange={(e) => setSubmissionSearch({ ...submissionSearch, problemTitle: e.target.value })}
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search user..."
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-40"
                  value={submissionSearch.userDisplayName || ''}
                  onChange={(e) => setSubmissionSearch({ ...submissionSearch, userDisplayName: e.target.value })}
                />
                <Users className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <MultiSelectDropdown
                options={[
                  { value: "PENDING", label: "Pending" },
                  { value: "PROCESSING", label: "Processing" },
                  { value: "ACCEPTED", label: "Accepted" },
                  { value: "WRONG_ANSWER", label: "Wrong Answer" },
                  { value: "TIME_LIMIT_EXCEEDED", label: "Time Limit Exceeded" },
                  { value: "MEMORY_LIMIT_EXCEEDED", label: "Memory Limit Exceeded" },
                  { value: "RUNTIME_ERROR", label: "Runtime Error" },
                  { value: "COMPILATION_ERROR", label: "Compile Error" },
                  { value: "INTERNAL_ERROR", label: "System Error" },
                ]}
                selectedValues={submissionSearch.verdict || []}
                onChange={(values) => setSubmissionSearch({ ...submissionSearch, verdict: values })}
                placeholder="All Verdicts"
              />
              <MultiSelectDropdown
                options={[
                  { value: 50, label: "C (GCC 9.2.0)" },
                  { value: 54, label: "C++ (GCC 9.2.0)" },
                  { value: 62, label: "Java (OpenJDK 13)" },
                  { value: 71, label: "Python (3.8.1)" },
                  { value: 60, label: "Go (1.13.5)" },
                  { value: 51, label: "C# (Mono 6.6.0)" },
                  { value: 63, label: "JavaScript (Node.js 12.14)" },
                  { value: 74, label: "TypeScript (3.7.4)" },
                ]}
                selectedValues={submissionSearch.languageId || []}
                onChange={(values) => setSubmissionSearch({ ...submissionSearch, languageId: values })}
                placeholder="All Languages"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {loadingSubmissions ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-sm">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Code className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p>No submissions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Problem</th>
                      <th className="py-4 px-6">Language</th>
                      <th className="py-4 px-6">Verdict</th>
                      <th className="py-4 px-6">Time / Memory</th>
                      <th className="py-4 px-6">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {submissions.map((sub, idx) => {
                      let verdictColor = 'text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/30';
                      if (sub.verdict === 'ACCEPTED') verdictColor = 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30';
                      else if (sub.verdict === 'WRONG_ANSWER') verdictColor = 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30';
                      else if (sub.verdict === 'TIME_LIMIT_EXCEEDED' || sub.verdict === 'MEMORY_LIMIT_EXCEEDED') verdictColor = 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
                      else if (sub.verdict === 'PENDING' || sub.verdict === 'PROCESSING') verdictColor = 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30';
                      else if (sub.verdict === 'COMPILATION_ERROR' || sub.verdict === 'RUNTIME_ERROR' || sub.verdict === 'INTERNAL_ERROR') verdictColor = 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30';
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                            {sub.userDisplayName || 'Unknown User'}
                          </td>
                          <td className="py-4 px-6 font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">
                            {sub.problemTitle}
                          </td>
                          <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                            {sub.language}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${verdictColor}`}>
                              {sub.verdict.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span>⏱ {sub.executionTimeMs} ms</span>
                              <span>💾 {Math.round(sub.memoryUsedKb / 1024)} MB</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                            {formatDateTime(sub.submittedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingSubmissions && submissionsTotalPages > 1 && (
              <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-xs font-semibold text-slate-500">
                  Page {submissionsPage + 1} of {submissionsTotalPages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={submissionsPage === 0 || loadingSubmissions}
                    onClick={() => setSubmissionsPage((prev) => prev - 1)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={submissionsPage >= submissionsTotalPages - 1 || loadingSubmissions}
                    onClick={() => setSubmissionsPage((prev) => prev + 1)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* 7. EMAILS TAB CONTENT */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
            <div className="flex flex-wrap gap-4 justify-between items-start">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-indigo-500" />
                  <span>Email Campaigns</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Send targeted emails to specific user segments.
                </p>
              </div>
              <button
                disabled={sendingEmail}
                onClick={handleSendEmailCampaign}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                <span>{sendingEmail ? 'Sending...' : 'Send Campaign'}</span>
              </button>
            </div>

            {/* Template Selection */}
            <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Email Template:</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
              >
                <option value="">-- Choose Template --</option>
                {emailTemplates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Target Selection */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center space-x-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Select Recipients ({selectedEmailUserIds.length} selected)
                  </h4>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search name or email..."
                        value={emailTargetSearchKeyword}
                        onChange={(e) => setEmailTargetSearchKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchEmailTargets()}
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
                      />
                      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    <select
                      value={emailTargetRoleFilter}
                      onChange={(e) => {
                        setEmailTargetRoleFilter(e.target.value);
                        fetchEmailTargets(undefined, e.target.value);
                      }}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Roles</option>
                      <option value="USER">User</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
              </div>
                  {loadingEmailTargets ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                  <p className="text-xs text-slate-500 mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={emailTargets.length > 0 && selectedEmailUserIds.length === emailTargets.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmailUserIds(emailTargets.map((u: any) => String(u.id)));
                                } else {
                                  setSelectedEmailUserIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {emailTargets.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500">No valid email users found.</td>
                          </tr>
                        ) : (
                          emailTargets.map((user: any) => (
                            <tr 
                              key={user.id} 
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${
                                selectedEmailUserIds.includes(String(user.id)) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                              }`}
                              onClick={() => {
                                const idStr = String(user.id);
                                if (selectedEmailUserIds.includes(idStr)) {
                                  setSelectedEmailUserIds((prev: any) => prev.filter((id: any) => id !== idStr));
                                } else {
                                  setSelectedEmailUserIds((prev: any) => [...prev, idStr]);
                                }
                              }}
                            >
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedEmailUserIds.includes(String(user.id))}
                                  onChange={() => {}} // handled by tr click
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 pointer-events-none"
                                />
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                                {user.displayName}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                {user.email}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                {user.phone || '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-bold">
                                  {user.role}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTEST MODAL */}
      {showContestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl relative text-left my-8">
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              {editingContestId ? 'Edit Contest' : 'Create New Contest'}
            </h3>
            
            <form onSubmit={handleSaveContest} className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contest Title:</label>
                <input
                  type="text"
                  required
                  placeholder="Example: ACM-ICPC Round 1"
                  value={contestTitle}
                  onChange={(e) => setContestTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description:</label>
                <textarea
                  rows={3}
                  placeholder="Details about participation rules..."
                  value={contestDesc}
                  onChange={(e) => setContestDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Scoring Rule */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scoring Rule:</label>
                  <select
                    value={contestScoringRule}
                    onChange={(e: any) => setContestScoringRule(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/20 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ICPC">ICPC</option>
                    <option value="IOI">IOI</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Participation Password (Optional):</label>
                  <input
                    type="password"
                    placeholder="Leave blank for public access"
                    value={contestPassword}
                    onChange={(e) => setContestPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Time:</label>
                  <input
                    type="datetime-local"
                    required
                    value={contestStartTime}
                    onChange={(e) => setContestStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Time:</label>
                  <input
                    type="datetime-local"
                    required
                    value={contestEndTime}
                    onChange={(e) => setContestEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContestModal(false)}
                  disabled={savingContest}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContest}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 cursor-pointer flex justify-center items-center"
                >
                  {savingContest ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PROBLEM TO CONTEST MODAL */}
      {showAddProblemToContestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-4 shadow-2xl relative text-left">
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Assign Problem to Contest
            </h3>
            
            {/* Search filter input */}
            <input
              type="text"
              placeholder="Search problems by name..."
              value={searchProblemKeyword}
              onChange={(e) => setSearchProblemKeyword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />

            {/* List of problems */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-850 rounded-2xl bg-slate-50/20 dark:bg-slate-950/10">
              {loadingSelectionProblems ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                </div>
              ) : allProblemsForSelection.filter(p => p.title.toLowerCase().includes(searchProblemKeyword.toLowerCase())).length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">No matching problems found.</p>
              ) : (
                allProblemsForSelection
                  .filter(p => p.title.toLowerCase().includes(searchProblemKeyword.toLowerCase()))
                  .map((prob) => {
                    const isAlreadyAssigned = contestProblems.some(cp => cp.id === prob.id);
                    return (
                      <div key={prob.id} className="flex items-center justify-between p-3.5">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-300">{prob.title}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">{prob.difficulty}</p>
                        </div>
                        <button
                          onClick={() => handleAddProblemToContest(prob.id)}
                          disabled={isAlreadyAssigned}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border transition-all ${
                            isAlreadyAssigned
                              ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700/50'
                              : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/10 cursor-pointer active:scale-95'
                          }`}
                        >
                          {isAlreadyAssigned ? 'Assigned' : 'Select'}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddProblemToContestModal(false);
                  setSearchProblemKeyword('');
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROBLEM MODAL */}
      {showProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl relative text-left my-8">
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Create New OJ Problem
            </h3>
            
            <form onSubmit={handleSaveProblem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Problem Title (Required):</label>
                  <input
                    type="text"
                    required
                    placeholder="Example: Calculate Sum of 2 Numbers"
                    value={probTitle}
                    onChange={(e) => setProbTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Difficulty:</label>
                  <select
                    value={probDifficulty}
                    onChange={(e) => setProbDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/20 text-xs focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Problem Scope */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Problem Scope:</label>
                <select
                  value={probScope}
                  onChange={(e) => setProbScope(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none"
                >
                  <option value="CONTEST">CONTEST</option>
                  <option value="PRACTICE">PRACTICE</option>
                  <option value="LESSON">LESSON</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Problem Description:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter detailed description..."
                  value={probDesc}
                  onChange={(e) => setProbDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Input Desc */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Input Description:</label>
                  <textarea
                    rows={2}
                    placeholder="Single line containing 2 integers..."
                    value={probInput}
                    onChange={(e) => setProbInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none dark:text-white"
                  />
                </div>
                {/* Output Desc */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Output Description:</label>
                  <textarea
                    rows={2}
                    placeholder="Sum of 2 integers..."
                    value={probOutput}
                    onChange={(e) => setProbOutput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Constraints */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Constraints:</label>
                <input
                  type="text"
                  placeholder="-10^9 <= A, B <= 10^9"
                  value={probConstraints}
                  onChange={(e) => setProbConstraints(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time limits */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Limit (ms) (Min 1000):</label>
                  <input
                    type="number"
                    min="1000"
                    value={probTimeLimit}
                    onChange={(e) => setProbTimeLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none dark:text-white"
                  />
                </div>
                {/* Memory limit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory Limit (KB):</label>
                  <input
                    type="number"
                    min="256000"
                    value={probMemoryLimit}
                    onChange={(e) => setProbMemoryLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Example Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Example Input:</label>
                  <input
                    type="text"
                    placeholder="2 3"
                    value={probExampleInput}
                    onChange={(e) => setProbExampleInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs font-mono focus:outline-none dark:text-white"
                  />
                </div>
                {/* Example Output */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Example Output:</label>
                  <input
                    type="text"
                    placeholder="5"
                    value={probExampleOutput}
                    onChange={(e) => setProbExampleOutput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs font-mono focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Hint */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hints:</label>
                <input
                  type="text"
                  placeholder="Enter hints..."
                  value={probHint}
                  onChange={(e) => setProbHint(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs focus:outline-none dark:text-white"
                />
              </div>

              {/* Footer actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(false)}
                  disabled={savingProblem}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProblem}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 flex items-center space-x-1.5"
                >
                  {savingProblem ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Save Problem</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
