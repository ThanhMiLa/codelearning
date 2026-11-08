import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode, type ReactNode } from 'react';
import type Stomp from 'stompjs';
import App from '../App';
import CodingLayout from '../layouts/CodingLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import PracticeCatalog from '../pages/oj/PracticeCatalog';
import ProblemWorkspace from '../pages/oj/ProblemWorkspace';
import ContestList from '../pages/contest/ContestList';
import ContestWorkspace from '../pages/contest/ContestWorkspace';
import ContestLeaderboard from '../pages/contest/ContestLeaderboard';
import Profile from '../pages/profile/Profile';
import DepositPage from '../pages/payment/DepositPage';
import SuccessPage from '../pages/payment/SuccessPage';
import CancelPage from '../pages/payment/CancelPage';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), refreshProfile: vi.fn(), logout: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(),
  auth: { isAuthenticated: true, isLoading: false, user: { id: 7, displayName: 'Test Developer', username: 'developer', email: 'developer@example.test', phoneNumber: '0901234567', balance: 50000, avatarUrl: null, roles: ['USER'] } },
}));
vi.mock('../api/axios', () => ({ default: { get: mocks.get, post: mocks.post, patch: mocks.patch, put: mocks.put } }));
vi.mock('../context/AuthContext', () => ({ AuthProvider: ({ children }: { children: ReactNode }) => children, useAuth: () => ({ ...mocks.auth, refreshProfile: mocks.refreshProfile, logout: mocks.logout }) }));
vi.mock('../context/CartContext', () => ({ CartProvider: ({ children }: { children: ReactNode }) => children, useCart: vi.fn() }));
vi.mock('../context/WebSocketContext', () => ({ WebSocketProvider: ({ children }: { children: ReactNode }) => children, useWebSocket: () => ({ isConnected: true, subscribe: mocks.subscribe }) }));
vi.mock('@monaco-editor/react', () => ({ default: ({ value, onChange, theme }: { value: string; onChange: (value: string) => void; theme: string }) => (
  <textarea aria-label="Code editor" data-theme={theme} value={value} onChange={event => onChange(event.target.value)} />
) }));
const response = (result: unknown) => ({ data: { result } });
const problem = { id: 11, title: 'Two Sum', description: 'Find two indices.', difficulty: 'EASY', acceptanceRate: 75, totalSubmissions: 20, tags: ['Arrays'], timeLimitMs: 1000, memoryLimitMb: 128 };
const contest = { id: 3, title: 'Weekly Challenge', status: 'RUNNING', scoringRule: 'ICPC', public: true, registered: false, startTime: new Date(Date.now() - 60000).toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), numberOfParticipants: 12 };
const page = (content: unknown[]) => ({ content, page: 0, totalPages: 1, totalElements: content.length });
const CurrentLocation = () => { const location = useLocation(); return <div data-testid="destination">{location.pathname}:{location.state?.from?.pathname}</div>; };
const mount = (path: string, pattern: string, element: ReactNode) => render(
  <MemoryRouter initialEntries={[path]}><Routes>
    <Route element={<CodingLayout />}>
      <Route path={pattern} element={element} />
      <Route path="/login" element={<CurrentLocation />} />
      <Route path="/" element={<CurrentLocation />} />
    </Route>
    <Route path="*" element={<CurrentLocation />} />
  </Routes></MemoryRouter>
);

beforeEach(() => {
  mocks.auth.isAuthenticated = true;
  mocks.auth.isLoading = false;
  mocks.get.mockReset(); mocks.post.mockReset();
  mocks.subscribe.mockImplementation(() => ({ unsubscribe: mocks.unsubscribe }));
  mocks.refreshProfile.mockResolvedValue(mocks.auth.user);
  mocks.logout.mockResolvedValue(undefined);
  mocks.patch.mockResolvedValue(response(mocks.auth.user)); mocks.put.mockResolvedValue(response(null));
});

describe('Problems', () => {
  it('keeps search, difficulty and solved filters connected to the API', async () => {
    mocks.get.mockResolvedValue(response(page([problem])));
    mount('/oj/practice', '/oj/practice', <PracticeCatalog />);
    expect(await screen.findByRole('link', { name: 'Two Sum' })).toHaveAttribute('href', '/oj/problems/11');
    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Difficulty: All' }), 'HARD');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status: All' }), 'SOLVED');
    await user.type(screen.getByRole('textbox', { name: 'Search problems by name...' }), 'arrays');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(mocks.get).toHaveBeenLastCalledWith('/online-judge/problems/practice', expect.objectContaining({ params: expect.objectContaining({ keyword: 'arrays', difficulties: 'HARD', isAccepted: true }) }));
  });
  it('submits the chosen language and receives the matching WebSocket verdict', async () => {
    mocks.get.mockResolvedValue(response(problem)); mocks.post.mockResolvedValue(response({ submissionId: 91, status: 'PENDING' }));
    mount('/oj/problems/11', '/oj/problems/:problemId', <ProtectedRoute><ProblemWorkspace /></ProtectedRoute>);
    expect(await screen.findByLabelText('Code editor')).toHaveAttribute('data-theme', 'codelearning-dark');
    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox'), '62');
    await user.clear(screen.getByLabelText('Code editor'));
    await user.type(screen.getByLabelText('Code editor'), 'class Main');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/online-judge/submissions', expect.objectContaining({ problemId: 11, languageId: 62, contestId: null, lessonId: null, sourceCode: 'class Main' })));
    const callback = mocks.subscribe.mock.calls.find(call => call[0] === '/topic/submissions/7')?.[1] as (message: Stomp.Message) => void;
    act(() => callback({ body: JSON.stringify({ submissionId: 91, testcaseId: null, overallVerdict: 'ACCEPTED', processedTestcases: 2, totalTestcases: 2 }) } as Stomp.Message));
    expect(await screen.findByText('Accepted', { exact: true })).toBeInTheDocument();
    expect(document.querySelector('.bg-code-success[style]')).toHaveStyle({ width: '100%' });
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});

describe('Contests', () => {
  it('registers a public contest and opens its workspace', async () => {
    mocks.get.mockResolvedValue(response(page([contest]))); mocks.post.mockResolvedValue(response(null));
    mount('/contests', '/contests', <ContestList />);
    await screen.findByText('Weekly Challenge');
    await userEvent.click(screen.getByRole('button', { name: 'Join Contest' }));
    expect(mocks.post).toHaveBeenCalledWith('/contests/3/register', { password: null });
    expect(await screen.findByTestId('destination')).toHaveTextContent('/contests/3');
  });
  it('requires a password for protected contests', async () => {
    mocks.get.mockResolvedValue(response(page([{ ...contest, public: false }]))); mocks.post.mockResolvedValue(response(null));
    mount('/contests', '/contests', <ContestList />);
    await screen.findByText('Weekly Challenge'); const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Join Contest' }));
    expect(mocks.post).not.toHaveBeenCalled(); const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByPlaceholderText(/password/i), 'test-room');
    await user.click(within(dialog).getByRole('button', { name: /join|enter/i }));
    expect(mocks.post).toHaveBeenCalledWith('/contests/3/register', { password: 'test-room' });
  });
  it('scopes submissions to the contest and keeps ranking available', async () => {
    mocks.get.mockImplementation(async (url: string) => response(url.endsWith('/problems') ? [problem] : url.endsWith('/submissions') ? [] : url.endsWith('/leaderboard') ? { title: contest.title, leaderboard: [] } : url.startsWith('/online-judge/problems/') ? problem : contest));
    mocks.post.mockResolvedValue(response({ submissionId: 92, status: 'PENDING' }));
    mount('/contests/3', '/contests/:contestId', <ProtectedRoute><ContestWorkspace /></ProtectedRoute>);
    await screen.findByText('Contest Problems'); const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Solve' })); await screen.findByLabelText('Code editor');
    await user.click(screen.getByRole('button', { name: 'Submit Code' }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/online-judge/submissions', expect.objectContaining({ problemId: 11, contestId: 3, languageId: 71 })));
    await user.click(screen.getByRole('button', { name: 'Ranking' }));
    expect(await screen.findByText('No submissions recorded yet')).toBeInTheDocument();
    expect(screen.queryByText('Standings Scoreboard')).not.toBeInTheDocument();
    expect(screen.queryByText('LIVE FEED SYNCED')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Reload Leaderboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Participants', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText('Scoring System', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText('Total Problems', { exact: true })).not.toBeInTheDocument();
    expect(mocks.subscribe).toHaveBeenCalledWith('/topic/contests/3/leaderboard', expect.any(Function));
  });
  it('prevents code submission after a contest has ended', async () => {
    const ended = { ...contest, status: 'ENDED', endTime: new Date(Date.now() - 1000).toISOString() };
    mocks.get.mockImplementation(async (url: string) => response(url.endsWith('/problems') ? [problem] : url.endsWith('/submissions') ? [] : url.startsWith('/online-judge/problems/') ? problem : ended));
    mount('/contests/3', '/contests/:contestId', <ContestWorkspace />);
    await screen.findByText('Contest Problems');
    await userEvent.click(screen.getByRole('button', { name: 'Solve' }));
    await screen.findByLabelText('Code editor');
    expect(screen.getByRole('button', { name: 'Contest Ended' })).toBeDisabled();
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('loads the separate leaderboard and subscribes to live refresh', async () => {
    mocks.get.mockImplementation(async (url: string) => response(url.endsWith('/leaderboard') ? { title: contest.title, leaderboard: [] } : url.endsWith('/problems') ? [problem] : contest));
    mount('/contests/3/leaderboard', '/contests/:contestId/leaderboard', <ContestLeaderboard />);
    expect(await screen.findByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(mocks.subscribe).toHaveBeenCalledWith('/topic/contests/3/leaderboard', expect.any(Function));
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});

describe('Profile and authorization', () => {
  it('saves profile data as multipart form data', async () => {
    mount('/profile', '/profile', <Profile />); const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Display Name')); await user.type(screen.getByLabelText('Display Name'), 'Updated Developer');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());
    const [url, body, options] = mocks.patch.mock.calls[0];
    expect(url).toBe('/users/me'); expect(body.get('displayName')).toBe('Updated Developer'); expect(body.get('phoneNumber')).toBe('0901234567');
    expect(options).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
  });
  it('blocks a password mismatch and preserves the password API contract', async () => {
    mount('/profile', '/profile', <Profile />); const user = userEvent.setup();
    await user.type(screen.getByLabelText('Old Password'), 'old-password'); await user.type(screen.getByLabelText('New Password'), 'new-password');
    await user.type(screen.getByLabelText('Confirm New Password'), 'wrong-password'); await user.click(screen.getByRole('button', { name: 'Update Password' }));
    expect(mocks.put).not.toHaveBeenCalled(); expect(screen.getByText('Confirm password does not match')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Confirm New Password')); await user.type(screen.getByLabelText('Confirm New Password'), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Update Password' }));
    expect(mocks.put).toHaveBeenCalledWith('/users/me/password', { oldPassword: 'old-password', newPassword: 'new-password', confirmNewPassword: 'new-password' });
  });
  it('redirects guests to login with their intended destination', async () => {
    mocks.auth.isAuthenticated = false; mount('/profile', '/profile', <ProtectedRoute><Profile /></ProtectedRoute>);
    expect(await screen.findByTestId('destination')).toHaveTextContent('/login:/profile');
  });
  it('keeps logout accessible in the shared header', async () => {
    mount('/profile', '/profile', <Profile />); await userEvent.click(screen.getAllByRole('button', { name: 'Logout' })[0]);
    expect(mocks.logout).toHaveBeenCalledOnce(); expect(await screen.findByTestId('destination')).toHaveTextContent('/');
  });
});

describe('Payments', () => {
  it('enforces the minimum and sends the selected amount, showing API errors inline', async () => {
    mocks.post.mockRejectedValue(new Error('Payment service unavailable')); mount('/deposit', '/deposit', <DepositPage />);
    const user = userEvent.setup(); const amount = screen.getByLabelText('Or enter custom amount (VND):');
    await user.type(amount, '5000'); expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeDisabled();
    await user.clear(amount); await user.type(amount, '150000'); await user.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(mocks.post).toHaveBeenCalledWith('/payment/deposit', { amount: 150000 });
    expect(await screen.findByRole('alert')).toHaveTextContent('Payment service unavailable');
    expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeEnabled();
  });
  it('shows cancellation details and links back to payments', () => {
    mount('/payment/cancel?orderCode=123', '/payment/cancel', <CancelPage />); expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /try|retry/i })).toHaveAttribute('href', '/deposit'); expect(mocks.post).not.toHaveBeenCalled();
  });
  it('syncs the account when the payment balance changes', async () => {
    mocks.get.mockResolvedValue(response({ balance: 60000 })); mount('/payment/success?orderCode=456', '/payment/success', <StrictMode><SuccessPage /></StrictMode>);
    expect(screen.getByText('456')).toBeInTheDocument(); await waitFor(() => expect(mocks.refreshProfile).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Checking…')).not.toBeInTheDocument());
    expect(mocks.get).toHaveBeenCalledWith('/users/me/balance'); expect(mocks.post).not.toHaveBeenCalled();
  });
});


describe('Application route integration', () => {
  it.each([
    ['/oj/practice', 'Problems'], ['/contests', 'Contests'], ['/profile', 'Your profile'],
    ['/deposit', 'Support CodeLearning'], ['/payment/success?orderCode=9', 'Thank you for your support.'],
    ['/payment/cancel?orderCode=9', 'Donation Cancelled'],
  ])('renders %s through the coding layout', async (path, heading) => {
    mocks.get.mockResolvedValue(response(path.startsWith('/payment/') ? { balance: 60000 } : page([])));
    window.history.replaceState({}, '', path);
    render(<App />);
    expect(await screen.findByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
    expect(document.querySelector('.coding-shell .coding-screen')).not.toBeNull();
    const nav = screen.getAllByRole('navigation', { name: 'Main navigation' })[0];
    expect(within(nav).queryByRole('link', { name: /courses/i })).not.toBeInTheDocument();
  });
});
