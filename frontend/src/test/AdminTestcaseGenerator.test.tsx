import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TestcaseGenerator from '../pages/admin/TestcaseGenerator';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('../api/axios', () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock('../context/WebSocketContext', () => ({ useWebSocket: () => ({ subscribe: mocks.subscribe, isConnected: true }) }));
vi.mock('@monaco-editor/react', () => ({ default: ({ theme }: { theme: string }) => <div data-testid="editor" data-theme={theme} /> }));

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.subscribe.mockReset();
  mocks.get.mockResolvedValue({ data: { result: { id: 11, title: 'Two Sum' } } });
  mocks.post.mockResolvedValue({ data: { result: null } });
  mocks.subscribe.mockReturnValue({ unsubscribe: mocks.unsubscribe });
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Admin testcase generator', () => {
  it('keeps generation and live progress working with the coding editor', async () => {
    render(<MemoryRouter initialEntries={['/admin/problems/11/testcases']}><Routes>
      <Route path="/admin/problems/:problemId/testcases" element={<TestcaseGenerator />} />
    </Routes></MemoryRouter>);
    expect(await screen.findByTestId('editor')).toHaveAttribute('data-theme', 'codelearning-dark');
    await userEvent.click(screen.getByRole('button', { name: 'Start Generating' }));
    expect(mocks.post).toHaveBeenCalledWith('/online-judge/problems/11/generate-testcases', expect.objectContaining({
      totalTestcasesToGenerate: 10, generatorLanguageId: 71, solutionLanguageId: 71,
      generatorCode: expect.any(String), solutionCode: expect.any(String),
    }));
    const callback = mocks.subscribe.mock.calls[0][1];
    act(() => callback({ body: JSON.stringify({ status: 'RUNNING', message: 'Generated testcase 5/10' }) }));
    expect(screen.getByText('[RUNNING] Generated testcase 5/10')).toBeInTheDocument();
    expect(document.querySelector('.bg-indigo-500[style]')).toHaveStyle({ width: '50%' });
    act(() => callback({ body: JSON.stringify({ status: 'FAILED', message: 'Lỗi sinh Output: Compile Error' }) }));
    await waitFor(() => expect(screen.getByText(/Compilation error: check the source code/)).toBeInTheDocument());
    expect(screen.getByText(/Failed to run the solution on the generated input/)).toBeInTheDocument();
  });
});
