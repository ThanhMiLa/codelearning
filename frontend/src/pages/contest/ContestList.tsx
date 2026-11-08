import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Trophy, Lock, Users, ChevronRight, RefreshCw, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import type { ApiResponse, PageResponse, ContestListResponse } from '../../types';

interface ContestCountdownProps {
  startTime: string;
  onTimerEnd: () => void;
}

const ContestCountdown: React.FC<ContestCountdownProps> = ({ startTime, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const difference = new Date(startTime).getTime() - Date.now();
      if (difference <= 0) {
        return null;
      }
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      return { hours, minutes, seconds };
    };

    const initial = calculate();
    setTimeLeft(initial);
    if (!initial) {
      onTimerEnd();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculate();
      if (!remaining) {
        clearInterval(interval);
        setTimeLeft(null);
        onTimerEnd();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, onTimerEnd]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex flex-col items-stretch md:items-end gap-1">
      <span className="text-[10px] font-medium text-code-warning">Starts In</span>
      <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-code-warning-surface text-code-warning border-code-warning-border text-xs font-medium animate-pulse border">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-coding ">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
};

const ContestList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contests, setContests] = useState<ContestListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL'); // ALL, RUNNING, UPCOMING, ENDED

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState<ContestListResponse | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPasswordModalOpen) {
      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isPasswordModalOpen]);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<ContestListResponse>>>('/contests', {
        params: {
          page: page,
          size: pageSize
        }
      });
      setContests(res.data.result.content || []);
      setTotalPages(res.data.result.totalPages);
      setTotalElements(res.data.result.totalElements);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [page]);

  const filteredContests = contests.filter(c => {
    if (activeTab === 'ALL') return true;
    return c.status === activeTab;
  });

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-sm bg-code-success-surface text-code-success border-code-success-border text-xs font-medium animate-pulse border">
            <span className="w-1.5 h-1.5 rounded-sm bg-code-success"></span>
            <span>Running</span>
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-sm bg-code-accent-surface text-code-accent border-code-accent text-xs font-medium border">
            <span className="w-1.5 h-1.5 rounded-sm bg-code-accent"></span>
            <span>Upcoming</span>
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-sm bg-code-panel text-code-muted border-code-border text-xs font-medium border">
            <span>Ended</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-sm bg-code-error-surface text-code-error border-code-error-border text-xs font-medium border">
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleContestAction = (contest: ContestListResponse) => {
    if (contest.status === 'CANCELLED') {
      navigate(`/contests/${contest.id}/leaderboard`);
      return;
    }

    if (contest.status === 'ENDED') {
      navigate(`/contests/${contest.id}`);
      return;
    }

    if (contest.registered) {
      // Already registered, enter directly
      navigate(`/contests/${contest.id}`);
      return;
    }

    const isContestPublic = contest.public ?? contest.isPublic;
    if (isContestPublic) {
      // Direct registration or entering
      registerAndEnter(contest.id, '');
    } else {
      // Show password modal
      setSelectedContest(contest);
      setPassword('');
      setShowPassword(false);
      setRegisterError(null);
      setIsPasswordModalOpen(true);
    }
  };

  const registerAndEnter = async (contestId: number, passVal: string) => {
    setRegistering(true);
    setRegisterError(null);
    try {
      await api.post(`/contests/${contestId}/register`, {
        password: passVal || null
      });

      // Update contest status in state to registered: true
      setContests(prev => prev.map(c => c.id === contestId ? { ...c, registered: true } : c));

      setIsPasswordModalOpen(false);
      navigate(`/contests/${contestId}`);
    } catch (error: any) {
      console.error('Failed to register contest:', error);
      const errCode = error?.response?.data?.code;
      const errMessage = error?.response?.data?.message;

      if (errCode === 9003) {
        setRegisterError("Incorrect room password, please try again!");
      } else if (errCode === 9005) {
        setIsPasswordModalOpen(false);
        alert("The contest has not started or has ended!");
        window.location.reload();
      } else {
        setRegisterError(
          errMessage || 'Incorrect room password or you do not have permission to join.'
        );
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContest || registering) return;
    registerAndEnter(selectedContest.id, password);
  };

  return (
    <div className="coding-page">

      <header className="coding-page-header">
        <div>
          <h1>{t('coding.contests_title')}</h1>
          <p>{t('coding.contests_description')}</p>
        </div>
        <Trophy size={28} className="coding-page-symbol" aria-hidden="true" />
      </header>

      {/* Tabs */}
      <div className="coding-tabs flex border-b border-code-border mb-6 shrink-0">
        {['ALL', 'RUNNING', 'UPCOMING', 'ENDED'].map((tab) => (
          <button
            key={tab}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3.5 px-6 text-xs font-medium   border-b-2 transition-all ${
              activeTab === tab
                ? 'text-code-accent border-code-accent font-medium border'
                : 'border-transparent text-code-muted hover:text-code-text'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab === 'RUNNING' ? 'Running' : tab === 'UPCOMING' ? 'Upcoming' : 'Ended'}
          </button>
        ))}
      </div>

      {/* Contest Cards list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-code-panel rounded-sm p-6 border-code-border space-y-3 border">
              <div className="h-6 bg-code-elevated rounded-sm w-1/3"></div>
              <div className="h-4 bg-code-elevated rounded-sm w-1/4"></div>
            </div>
          ))}
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="bg-code-panel rounded-sm border-code-border p-16 text-center text-code-muted border">
          <Calendar className="h-12 w-12 mx-auto opacity-30 mb-3" />
          <p className="font-medium text-sm">No contests found</p>
          <p className="text-xs text-code-muted mt-1">There are currently no contests in this status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContests.map((contest) => (
            <div
              key={contest.id}
              className="bg-code-panel rounded-sm border-code-border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-200 hover:border-code-accent border"
            >
              {/* Contest info */}
              <div className="space-y-3 text-left flex-grow">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(contest.status)}

                  {/* Public/Private Badge */}
                  {(contest.public ?? contest.isPublic) ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-sm bg-code-elevated text-code-success text-[10px] font-medium">
                      <span>Public</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-sm bg-code-error-surface text-code-error text-[10px] font-medium border-code-error-border border">
                      <span>Protected</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base md:text-lg font-medium text-code-text leading-snug">
                    {contest.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-code-muted font-semibold">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Start: {formatDate(contest.startTime)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>End: {formatDate(contest.endTime)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{contest.numberOfParticipants} participants</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-code-muted">
                  Organized by: <span className="font-semibold">{contest.createdByTeacherName || 'Organizer'}</span>
                </p>
              </div>

              {/* Action Button / Countdown */}
              <div className="shrink-0 w-full md:w-auto flex flex-col items-stretch md:items-end justify-center">

                  {contest.status === 'UPCOMING' ? (
                    <div
                      key={`countdown-${contest.id}`}
                    >
                      <ContestCountdown startTime={contest.startTime} onTimerEnd={fetchContests} />
                    </div>
                  ) : (
                    <button
                      key={`btn-${contest.id}`}
                      onClick={() => handleContestAction(contest)}
                      className={`w-full md:w-auto inline-flex items-center justify-center space-x-1.5 px-6 py-3 rounded-sm text-xs font-medium transition-all ${
                        contest.status === 'ENDED' || contest.status === 'CANCELLED'
                          ? 'bg-code-elevated hover:bg-code-panel text-code-text'
                          : 'bg-code-accent hover:bg-code-accent-hover text-code-bg '
                      }`}
                    >
                      {contest.status === 'CANCELLED' ? (
                        <>
                          <Eye className="h-4 w-4" />
                          <span>Leaderboard</span>
                        </>
                      ) : contest.status === 'ENDED' ? (
                        <>
                          <Eye className="h-4 w-4" />
                          <span>Enter Workspace</span>
                        </>
                      ) : contest.registered ? (
                        <>
                          <Trophy className="h-4 w-4" />
                          <span>Enter Contest</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="h-4 w-4" />
                          <span>Join Contest</span>
                        </>
                      )}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}

              </div>
          </div>
        ))}
      </div>
    )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-code-border pt-6 mt-6">
          <div className="text-xs text-code-muted font-semibold">
            Showing {contests.length} of {totalElements} contests (Page {page + 1} of {totalPages})
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="px-3.5 py-1.5 border-code-border rounded-sm hover:bg-code-elevated/80 disabled:opacity-40 transition-colors text-xs font-medium text-code-text border"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
              disabled={page === totalPages - 1}
              className="px-3.5 py-1.5 border-code-border rounded-sm hover:bg-code-elevated/80 disabled:opacity-40 transition-colors text-xs font-medium text-code-text border"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && selectedContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-code-panel/80 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="contest-password-title"
          className="w-full max-w-md bg-code-panel rounded-sm border-code-border p-6 md:p-8 space-y-6 relative  border">

            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-sm bg-code-warning-surface text-code-warning flex items-center justify-center border-code-warning-border border">
                <Lock className="h-5 w-5" />
              </div>
              <h3 id="contest-password-title" className="text-lg font-medium text-code-text">
                Password Required
              </h3>
              <p className="text-xs text-code-muted px-4 leading-relaxed font-semibold">
                "{selectedContest.title}" is password-protected. Please enter the password to join.
              </p>
            </div>

            {/* Error dialog */}
            {registerError && (
              <div className="p-3 bg-code-error-surface border-code-error-border rounded-sm text-code-error text-xs font-medium flex items-center space-x-2 border">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-code-muted block">
                  Contest Password:
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-sm border-code-border bg-code-bg/80 text-sm focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent transition-all text-code-text border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-code-muted hover:text-code-text transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={registering}
                  className="px-4 py-2.5 border-code-border rounded-sm text-xs font-medium text-code-muted hover:bg-code-elevated/80 transition-colors border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering || !password.trim()}
                  className="px-4 py-2.5 bg-code-accent hover:bg-code-accent-hover disabled:opacity-50 text-code-bg rounded-sm text-xs font-medium transition-all flex items-center justify-center space-x-1.5"
                >
                  {registering ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <span>Join</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ContestList;
