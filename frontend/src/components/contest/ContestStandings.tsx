import { useId, useRef, useState } from 'react';
import './ContestStandings.css';
import { useTranslation } from 'react-i18next';
import type { ContestLeaderboardItemResponse, ContestProblemStatusResponse } from '../../types';

interface StandingProblem {
  id: number;
  title: string;
}

interface ContestStandingsProps {
  problems: readonly StandingProblem[];
  rows: readonly ContestLeaderboardItemResponse[];
}

interface SelectedResult {
  participant: string;
  problem: StandingProblem;
  label: string;
  status: ContestProblemStatusResponse | undefined;
}

const problemLabel = (index: number): string => {
  let label = '';
  let value = index + 1;
  while (value > 0) {
    value--;
    label = String.fromCharCode(65 + value % 26) + label;
    value = Math.floor(value / 26);
  }
  return label;
};

const ContestStandings = ({ problems, rows }: ContestStandingsProps) => {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selected, setSelected] = useState<SelectedResult | null>(null);

  const resultLabel = (status: ContestProblemStatusResponse | undefined) => t(
    status?.isSolved ? 'standings.accepted' : status && status.failedAttemptsCount > 0 ? 'standings.unsolved' : 'standings.unattempted',
  );

  return (
    <div className="coding-standings">
      <table className="coding-ranking-table" aria-label={t('standings.table')}>
        <thead>
          <tr>
            <th scope="col" className="standing-rank standing-summary-column">{t('standings.rank')}</th>
            <th scope="col" className="standing-participant">{t('standings.participant')}</th>
            <th scope="col" className="standing-solved standing-summary-column">{t('standings.solved')}</th>
            <th scope="col" className="standing-penalty standing-summary-column">{t('standings.penalty')}</th>
            {problems.map((problem, index) => (
              <th key={problem.id} scope="col" className="standing-problem" title={`${problemLabel(index)}: ${problem.title}`}>
                <span className="standing-cell-frame"><span className="standing-problem-label">{problemLabel(index)}</span></span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.userId}>
              <td className="standing-rank standing-summary-column">
                <span className={`standing-rank-value${row.rank >= 1 && row.rank <= 3 ? ` standing-rank-${row.rank}` : ''}`}>
                  {row.rank}
                </span>
              </td>
              <th scope="row" className="standing-participant" title={`${row.displayName} — ${t('standings.summary', { rank: row.rank, solved: row.problemsSolved, penalty: Math.floor(row.totalPenalty / 60) })}`}>
                <span className="standing-participant-name">{row.displayName}</span>
                <span className="standing-compact-summary">{t('standings.summary', { rank: row.rank, solved: row.problemsSolved, penalty: Math.floor(row.totalPenalty / 60) })}</span>
              </th>
              <td className="standing-solved standing-summary-column">{row.problemsSolved}</td>
              <td className="standing-penalty standing-summary-column">{Math.floor(row.totalPenalty / 60)}</td>
              {problems.map((problem, index) => {
                const status = row.problemStatuses?.find(result => result.problemId === problem.id);
                const attempted = status && (status.isSolved || status.failedAttemptsCount > 0);
                const label = problemLabel(index);
                const description = `${row.displayName} — ${label}: ${problem.title} — ${resultLabel(status)}`;
                return (
                  <td key={problem.id} className="standing-problem">
                    <span className="standing-cell-frame">
                      <button type="button"
                        className={`standing-result${status?.isSolved ? ' standing-result-accepted' : attempted ? ' standing-result-failed' : ''}`}
                        aria-label={description} title={description} aria-haspopup="dialog"
                        onClick={() => { setSelected({ participant: row.displayName, problem, label, status }); dialog.current?.showModal(); }}>
                        <span className="standing-result-detail">
                          {status?.isSolved ? (status.solvedAtSeconds >= 0 ? Math.floor(status.solvedAtSeconds / 60) : '+') : attempted ? `-${status.failedAttemptsCount}` : '·'}
                          {status?.isSolved && status.failedAttemptsCount > 0 && <span className="standing-attempts">(-{status.failedAttemptsCount})</span>}
                        </span>
                        <span className="standing-result-symbol" aria-hidden="true">{status?.isSolved ? '+' : attempted ? '−' : '·'}</span>
                      </button>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <dialog ref={dialog} className="standing-result-dialog" aria-labelledby={titleId} onClose={() => setSelected(null)}>
        {selected && <>
          <h2 id={titleId}>{selected.label}: {selected.problem.title}</h2>
          <p>{selected.participant}</p>
          <dl>
            <div><dt>{t('standings.status')}</dt><dd className={selected.status?.isSolved ? 'text-code-success' : selected.status && selected.status.failedAttemptsCount > 0 ? 'text-code-error' : 'text-code-muted'}>{resultLabel(selected.status)}</dd></div>
            {selected.status?.isSolved && selected.status.solvedAtSeconds >= 0 && <div><dt>{t('standings.solve_time')}</dt><dd>{t('standings.minutes', { count: Math.floor(selected.status.solvedAtSeconds / 60) })}</dd></div>}
            <div><dt>{t('standings.failed_attempts')}</dt><dd>{selected.status?.failedAttemptsCount ?? 0}</dd></div>
          </dl>
          <form method="dialog"><button className="coding-button coding-button-secondary" type="submit">{t('standings.close')}</button></form>
        </>}
      </dialog>
    </div>
  );
};

export default ContestStandings;
