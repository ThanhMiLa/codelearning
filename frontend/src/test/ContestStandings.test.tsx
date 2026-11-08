import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContestStandings from '../components/contest/ContestStandings';
import type { ContestLeaderboardItemResponse } from '../types';

const problems = Array.from({ length: 30 }, (_, index) => ({ id: index + 1, title: `Problem ${index + 1}` }));
const rows: ContestLeaderboardItemResponse[] = [
  { userId: 1, displayName: 'Developer One', rank: 1, problemsSolved: 1, totalPenalty: 3600,
    problemStatuses: [{ problemId: 1, isSolved: true, failedAttemptsCount: 2, solvedAtSeconds: 1800 }, { problemId: 30, isSolved: false, failedAttemptsCount: 3, solvedAtSeconds: -1 }] },
  { userId: 2, displayName: 'A very long participant name that must not widen the table', rank: 2, problemsSolved: 0, totalPenalty: 0, problemStatuses: [] },
];

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    }),
  });
});

describe('Responsive contest standings', () => {
  it('displays the top three ranks as numbers with distinct medal colors', () => {
    render(<ContestStandings problems={[]} rows={[...rows, { ...rows[1], userId: 3, rank: 3 }, { ...rows[1], userId: 4, rank: 4 }]} />);
    const tableRows = within(screen.getByRole('table', { name: 'Contest standings' })).getAllByRole('row').slice(1);
    tableRows.forEach((row, index) => {
      const rank = within(row).getAllByRole('cell')[0];
      expect(rank).toHaveTextContent(String(index + 1));
      if (index < 3) expect(rank.firstElementChild).toHaveClass(`standing-rank-${index + 1}`);
      else expect(rank.firstElementChild).not.toHaveClass('standing-rank-3');
    });
  });

  it('renders every problem in one header row, including labels after Z', () => {
    render(<ContestStandings problems={problems} rows={rows} />);
    const table = screen.getByRole('table', { name: 'Contest standings' });
    const header = within(table).getAllByRole('row')[0];
    expect(within(header).getAllByRole('columnheader')).toHaveLength(34);
    expect(within(header).getByRole('columnheader', { name: 'A' })).toHaveAttribute('title', 'A: Problem 1');
    expect(within(header).getByRole('columnheader', { name: 'AD' })).toHaveAttribute('title', 'AD: Problem 30');
    for (const row of within(table).getAllByRole('row').slice(1)) {
      expect(within(row).getAllByRole('button')).toHaveLength(30);
    }
  });

  it('preserves time and failed attempts when compact cells open their details', async () => {
    render(<ContestStandings problems={problems} rows={rows} />);
    await userEvent.click(screen.getByRole('button', { name: 'Developer One — A: Problem 1 — Accepted' }));
    const dialog = screen.getByRole('dialog', { name: 'A: Problem 1' });
    expect(within(dialog).getByText('30 minutes')).toBeInTheDocument();
    expect(within(dialog).getByText('2')).toBeInTheDocument();
    expect(within(dialog).getByText('Accepted')).toHaveClass('text-code-success');
    fireEvent(dialog, new Event('close'));
    await userEvent.click(screen.getByRole('button', { name: 'Developer One — AD: Problem 30 — Not solved' }));
    const next = screen.getByRole('dialog', { name: 'AD: Problem 30' });
    expect(within(next).getByText('3')).toBeInTheDocument();
    expect(within(next).getByText('Not solved')).toHaveClass('text-code-error');
    expect(within(next).queryByText('Solve time')).not.toBeInTheDocument();
  });

  it('distinguishes an unattempted problem without hiding that column', async () => {
    render(<ContestStandings problems={problems} rows={rows} />);
    await userEvent.click(screen.getByRole('button', { name: 'Developer One — B: Problem 2 — Not attempted' }));
    const dialog = screen.getByRole('dialog', { name: 'B: Problem 2' });
    expect(within(dialog).getByText('Not attempted')).toBeInTheDocument();
    expect(within(dialog).getByText('0')).toBeInTheDocument();
  });
});
