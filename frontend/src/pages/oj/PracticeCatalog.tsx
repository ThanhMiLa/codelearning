import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Terminal, CheckCircle, Code, HelpCircle, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import type { ApiResponse, PageResponse, OjPracticeProblemResponse } from '../../types';

const PracticeCatalog: React.FC = () => {
  const { t } = useTranslation();
  const [problems, setProblems] = useState<OjPracticeProblemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page,
        size: pageSize,
        sortBy: 'totalSubmissions',
        order: 'desc'
      };

      if (search.trim()) {
        params.keyword = search.trim();
      }

      if (difficulty !== 'ALL') {
        params.difficulties = difficulty; // e.g. "EASY", "MEDIUM", "HARD"
      }

      if (status === 'SOLVED') {
        params.isAccepted = true;
      } else if (status === 'UNSOLVED') {
        params.isAccepted = false;
      }

      const res = await api.get<ApiResponse<PageResponse<OjPracticeProblemResponse>>>(
        '/online-judge/problems/practice',
        { params }
      );

      const data = res.data.result;
      setProblems(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Failed to fetch practice problems:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [page, difficulty, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchProblems();
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

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return t('practice.easy');
      case 'MEDIUM':
        return t('practice.medium');
      case 'HARD':
        return t('practice.hard');
      default:
        return diff;
    }
  };

  return (
    <div className="coding-page">
      <header className="coding-page-header coding-page-header-borderless">
        <div>
          <h1>{t('practice.title')}</h1>
        </div>
        <Terminal size={28} className="coding-page-symbol" aria-hidden="true" />
      </header>

      {/* Filter and Search Section */}
      <div className="bg-code-panel rounded-sm border-code-border p-5 mb-6 space-y-4 border">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 flex gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                aria-label={t('practice.search_placeholder')}
                placeholder={t('practice.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-sm border-code-border bg-code-bg/80 text-sm focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent transition-all text-code-text border"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-code-muted" />
            </div>
            <button type="submit" className="coding-button coding-button-small">{t('practice.search')}</button>
          </div>

          {/* Difficulty filter */}
          <div className="relative">
            <select
              aria-label={t('practice.diff_all')}
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(0);
              }}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-sm border-code-border bg-code-bg/80 text-sm focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent transition-all text-code-text appearance-none cursor-pointer border"
            >
              <option value="ALL">{t('practice.diff_all')}</option>
              <option value="EASY">{t('practice.diff_easy')}</option>
              <option value="MEDIUM">{t('practice.diff_medium')}</option>
              <option value="HARD">{t('practice.diff_hard')}</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-code-muted pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              aria-label={t('practice.status_all')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-sm border-code-border bg-code-bg/80 text-sm focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent transition-all text-code-text appearance-none cursor-pointer border"
            >
              <option value="ALL">{t('practice.status_all')}</option>
              <option value="SOLVED">{t('practice.status_solved')}</option>
              <option value="UNSOLVED">{t('practice.status_unsolved')}</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-code-muted pointer-events-none" />
          </div>
        </form>
      </div>

      {/* Main Problems Table or List */}
      <div className="bg-code-panel rounded-sm border-code-border overflow-hidden mb-6 border">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-code-border last:border-0">
                <div className="space-y-2 flex-grow pr-6">
                  <div className="h-5 bg-code-elevated rounded-sm w-1/3"></div>
                  <div className="h-3 bg-code-elevated rounded-sm w-1/4"></div>
                </div>
                <div className="h-8 bg-code-elevated rounded-sm w-20"></div>
              </div>
            ))}
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16 text-code-muted">
            <HelpCircle className="h-12 w-12 mx-auto opacity-30 mb-3" />
            <p className="font-medium text-sm">{t('practice.no_problems')}</p>
            <p className="text-xs mt-1 text-code-muted">{t('practice.change_filters')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-code-border bg-code-bg text-code-muted font-medium text-[10px] text-left">
                  <th className="px-6 py-4 w-12"></th>
                  <th className="px-6 py-4 w-[40%] max-w-[40%] whitespace-nowrap">{t('practice.th_name')}</th>
                  <th className="px-6 py-4 w-32 whitespace-nowrap">{t('practice.th_difficulty')}</th>
                  <th className="px-6 py-4 w-40 whitespace-nowrap">{t('practice.th_acceptance')}</th>
                  <th className="px-6 py-4 w-40 whitespace-nowrap">{t('practice.th_submissions')}</th>
                  <th className="px-6 py-4 w-28 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-code-border divide-code-border">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-code-elevated transition-colors">
                    {/* Status Tick */}
                    <td className="px-6 py-4 text-center">
                      {problem.isAccepted ? (
                        <CheckCircle className="h-5 w-5 text-code-success shrink-0" />
                      ) : (
                        <HelpCircle className="h-5 w-5 text-code-text shrink-0" />
                      )}
                    </td>

                    {/* Title */}
                    <td className="px-6 py-4 w-[40%] max-w-[40%] truncate">
                      <Link
                        to={`/oj/problems/${problem.id}`}
                        className="font-medium text-code-text hover:text-code-accent transition-colors text-sm block truncate"
                        title={problem.title}
                      >
                        {problem.title}
                      </Link>
                    </td>

                    {/* Difficulty */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-sm text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                        {getDifficultyLabel(problem.difficulty)}
                      </span>
                    </td>

                    {/* Acceptance Rate */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-code-muted text-xs">
                          {problem.acceptanceRate.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-code-elevated h-1.5 rounded-sm overflow-hidden hidden sm:block">
                          <div
                            className="bg-code-accent h-full"
                            style={{ width: `${problem.acceptanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Submissions count */}
                    <td className="px-6 py-4 text-xs font-medium text-code-muted whitespace-nowrap">
                      {problem.totalSubmissions} {t('practice.subs_suffix')}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/oj/problems/${problem.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-code-accent-surface hover:bg-code-accent-surface text-code-accent border-code-accent rounded-sm text-xs font-medium transition-all border "
                      >
                        <Code className="h-3.5 w-3.5" />
                        <span>{t('practice.btn_solve')}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-code-border pt-6">
          <div className="text-xs text-code-muted font-semibold">
            {t('practice.showing')} <span className="text-code-text">{(page * pageSize) + 1}</span> {t('practice.to')}{' '}
            <span className="text-code-text">
              {Math.min((page + 1) * pageSize, totalElements)}
            </span>{' '}
            {t('practice.of')} <span className="text-code-text">{totalElements}</span> {t('practice.problems')}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="p-2 border-code-border rounded-sm hover:bg-code-elevated/80 disabled:opacity-40 transition-colors border"
            >
              <ArrowLeft className="h-4 w-4 text-code-text" />
            </button>

            <div className="flex items-center space-x-1.5">
              {Array.from({ length: totalPages }, (_, idx) => {
                // simple pagination display logic, show nearby pages
                if (idx === page || idx === 0 || idx === totalPages - 1 || Math.abs(idx - page) <= 1) {
                  return (
                    <button
                      key={idx}
                      onClick={() => setPage(idx)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-all ${
                        page === idx
                          ? 'bg-code-accent text-code-bg border-code-accent border '
                          : 'border-code-border hover:bg-code-elevated/80 text-code-muted border'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                } else if (idx === 1 || idx === totalPages - 2) {
                  return <span key={idx} className="text-code-muted px-1">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
              disabled={page === totalPages - 1}
              className="p-2 border-code-border rounded-sm hover:bg-code-elevated/80 disabled:opacity-40 transition-colors border"
            >
              <ArrowRight className="h-4 w-4 text-code-text" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeCatalog;
