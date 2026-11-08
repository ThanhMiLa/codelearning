import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CodingLayout from '../layouts/CodingLayout';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from '../pages/admin/AdminDashboard';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock('../api/axios', () => ({ default: mocks }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { displayName: 'Admin User', avatarUrl: '/avatar.png', roles: ['ADMIN'] }, logout: vi.fn() }) }));

const page = { content: [], page: 0, totalPages: 0, totalElements: 0 };
beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.put.mockReset();
  mocks.put.mockResolvedValue({ data: { result: null } });
  mocks.get.mockImplementation((url: string) => Promise.resolve({ data: { result:
    url === '/admin/emails/templates' ? { templates: [] } :
    url.startsWith('/admin/users/email-targets') ? [] : page
  } }));
});

describe('Admin dashboard', () => {
  it('hides the shared header and shows the account above the home link', async () => {
    render(<MemoryRouter initialEntries={['/admin/dashboard']}><Routes>
      <Route element={<CodingLayout />}><Route path="/admin/dashboard" element={<AdminDashboard />} /></Route>
    </Routes></MemoryRouter>);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    const account = screen.getByRole('link', { name: 'Admin User' });
    expect(account).toHaveAttribute('href', '/profile');
    expect(account.querySelector('img')).toHaveAttribute('src', '/avatar.png');
    expect(account.nextElementSibling).toHaveTextContent('Back to Home');
    await screen.findByText('Problem bank empty');
  });

  it('opens problem management without loading or exposing courses', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    expect(await screen.findByText('Problem bank empty')).toBeInTheDocument();
    expect(screen.queryByText(/Courses & Syllabus/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Problem Bank (OJ)' })).toHaveAttribute('aria-pressed', 'true');
    expect(mocks.get).toHaveBeenCalledWith('/online-judge/admin/problems', { params: { page: 0 } });
    expect(mocks.get.mock.calls.some(([url]) => String(url).startsWith('/courses'))).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Create Problem' }));
    expect(screen.getByText('Create New OJ Problem')).toBeInTheDocument();
  });

  it('keeps problem visibility and testcase navigation working', async () => {
    mocks.get.mockResolvedValue({ data: { result: { ...page, content: [{
      id: 11, title: 'Two Sum', scope: 'PRACTICE', difficulty: 'EASY', isPublic: false, totalSubmissions: 2,
    }] } } });
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    expect(await screen.findByText('Two Sum')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Private' }));
    expect(mocks.put).toHaveBeenCalledWith('/online-judge/admin/problems/11/public', null, { params: { isPublic: true } });
    expect(await screen.findByRole('button', { name: 'Public' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /generate testcases/i })).toHaveAttribute('href', '/admin/problems/11/testcases');
  });

  it('keeps payment filters connected to the existing search API', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Payments' }));
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'DEPOSIT');
    await user.type(screen.getByPlaceholderText('Search code, user name...'), 'developer');
    await user.click(screen.getByRole('button', { name: 'Filter' }));
    expect(mocks.get).toHaveBeenLastCalledWith('/admin/payment-transactions', { params: {
      page: 0, size: 20, keyword: 'developer', status: undefined, type: 'DEPOSIT',
    } });
  });

  it('keeps selecting recipients and sending a campaign connected', async () => {
    mocks.get.mockImplementation((url: string) => Promise.resolve({ data: { result:
      url === '/admin/emails/templates' ? { templates: [{ id: 'welcome', name: 'Welcome' }] } :
      url.startsWith('/admin/users/email-targets') ? [
        { id: 7, displayName: 'First Recipient', email: 'first@example.test', role: 'USER' },
        { id: 8, displayName: 'Second Recipient', email: 'second@example.test', role: 'USER' },
      ] : page
    } }));
    mocks.post.mockResolvedValue({ data: { result: null } });
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Email Campaigns' }));
    await screen.findByText('First Recipient');
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'welcome');
    await user.click(screen.getByText('First Recipient'));
    await user.click(screen.getByRole('button', { name: 'Send Campaign' }));
    expect(mocks.post).toHaveBeenCalledWith('/admin/emails/send', {
      templateId: 'welcome', targetType: 'SPECIFIC', userIds: ['7'],
    });
  });

  it('keeps the remaining management tabs connected to their existing APIs', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    const user = userEvent.setup();
    for (const [label, endpoint] of [
      ['Contests', '/contests'], ['Management User', '/admin/users'],
      ['Payments', '/admin/payment-transactions'], ['Global Submissions', '/online-judge/admin/submissions'],
      ['Email Campaigns', '/admin/emails/templates'],
    ]) {
      await user.click(screen.getByRole('button', { name: label }));
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
      await waitFor(() => expect(mocks.get.mock.calls.some(([url]) => url === endpoint)).toBe(true));
    }
  });
});
