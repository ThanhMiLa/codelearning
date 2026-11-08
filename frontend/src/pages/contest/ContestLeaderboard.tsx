import ContestStandings from '../../components/contest/ContestStandings';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, RefreshCw, AlertTriangle, Users, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/errorUtils';
import { useWebSocket } from '../../context/WebSocketContext';
import type { ApiResponse, ContestLeaderboardResponse, ContestResponse } from '../../types';

interface SimpleProblem {
  id: number;
  title: string;
}

const ContestLeaderboard: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { subscribe, isConnected } = useWebSocket();

  const contestIdNum = Number(contestId);

  // States
  const [leaderboardData, setLeaderboardData] = useState<ContestLeaderboardResponse | null>(null);
  const [problems, setProblems] = useState<SimpleProblem[]>([]);
  const [contest, setContest] = useState<ContestResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLeaderboardAndMetadata = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [leaderboardRes, problemsRes, contestRes] = await Promise.all([
        api.get<ApiResponse<ContestLeaderboardResponse>>(`/contests/${contestId}/leaderboard`),
        api.get<ApiResponse<any>>(`/contests/${contestId}/problems`).catch(() => ({ data: { result: [] } })),
        api.get<ApiResponse<ContestResponse>>(`/contests/${contestId}`).catch(() => ({ data: { result: null } }))
      ]);

      setLeaderboardData(leaderboardRes.data.result);

      const rawProblems = problemsRes.data.result;
      setProblems(Array.isArray(rawProblems) ? rawProblems : rawProblems?.content || []);

      if (contestRes.data.result) {
        setContest(contestRes.data.result);
      }
    } catch (error: any) {
      console.error('Failed to fetch leaderboard:', error);
      setErrorMsg(getErrorMessage(error, 'Failed to load contest leaderboard data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (contestId) {
      fetchLeaderboardAndMetadata();
    }
  }, [contestId]);

  // Subscribe to live leaderboard updates via WebSocket
  useEffect(() => {
    if (!contestIdNum) return;

    const topic = `/topic/contests/${contestIdNum}/leaderboard`;
    console.log(`Subscribing to leaderboard topic: ${topic}`);

    const subscription = subscribe(topic, () => {
      console.log('Leaderboard updated socket signal received! Re-fetching...');
      fetchLeaderboardAndMetadata(true); // Silent refresh
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [contestIdNum, subscribe]);



  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-code-bg">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-10 w-10 animate-spin text-code-accent" />
          <span className="text-sm font-semibold text-code-muted">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !leaderboardData) {
    return (
      <div className="mx-auto max-w-md text-center py-20 px-4 min-h-[70vh] flex flex-col justify-center items-center">
        <AlertTriangle className="h-12 w-12 text-code-error mb-4" />
        <h3 className="text-lg font-medium text-code-text mb-2">Leaderboard Load Error</h3>
        <p className="text-sm text-code-muted mb-6 leading-relaxed">{errorMsg || 'Failed to display leaderboard.'}</p>
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
    <div className="coding-page">

      {/* Back to contest room & Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border-code-border rounded-sm hover:bg-code-elevated bg-code-panel text-code-muted transition-colors border "
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-code-warning" />
              <h1 className="text-xl md:text-2xl font-medium text-code-text tracking-tight">
                Leaderboard
              </h1>
            </div>
            <p className="text-xs text-code-muted font-semibold mt-0.5">
              Contest: <span className="text-code-muted font-medium">{leaderboardData.title}</span>
            </p>
          </div>
        </div>

        {/* Live sync badge & manual refresh */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-code-elevated/80 border-code-border border">
            <div className={`w-2 h-2 rounded-sm ${isConnected ? 'bg-code-success animate-pulse' : 'bg-code-error'}`} />
            <span className="text-[10px] text-code-muted font-medium ">
              {isConnected ? 'Realtime Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            onClick={() => fetchLeaderboardAndMetadata(true)}
            disabled={refreshing}
            className="p-2.5 border-code-border rounded-sm bg-code-panel hover:bg-code-elevated text-code-muted transition-all disabled:opacity-40 border"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard statistics summary */}
      <div className="coding-ranking-stats grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-code-panel rounded-sm border-code-border p-5 flex items-center space-x-4 border ">
          <div className="w-10 h-10 rounded-sm bg-code-accent-surface text-code-accent flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-code-muted font-medium block">Participants</span>
            <span className="text-lg font-medium text-code-text">
              {leaderboardData.leaderboard?.length || 0} participants
            </span>
          </div>
        </div>

        <div className="bg-code-panel rounded-sm border-code-border p-5 flex items-center space-x-4 border ">
          <div className="w-10 h-10 rounded-sm bg-code-warning-surface text-code-warning flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-code-muted font-medium block">Scoring Rule</span>
            <span className="text-lg font-medium text-code-text ">
              {contest?.scoringRule || 'ICPC'}
            </span>
          </div>
        </div>

        <div className="bg-code-panel rounded-sm border-code-border p-5 flex items-center space-x-4 border ">
          <div className="w-10 h-10 rounded-sm bg-code-accent-surface text-code-accent flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-code-muted font-medium block">Total Problems</span>
            <span className="text-lg font-medium text-code-text">
              {problems.length} problems
            </span>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-code-panel rounded-sm border-code-border overflow-hidden border">
        {leaderboardData.leaderboard?.length === 0 ? (
          <div className="p-16 text-center text-code-muted">
            <Trophy className="h-12 w-12 mx-auto opacity-25 mb-3" />
            <p className="font-medium text-sm">No submissions yet</p>
            <p className="text-xs text-code-muted mt-1">Participant submissions will be shown here.</p>
          </div>
        ) : (
          <ContestStandings problems={problems} rows={leaderboardData.leaderboard} />
        )}
      </div>

    </div>
  );
};

export default ContestLeaderboard;
