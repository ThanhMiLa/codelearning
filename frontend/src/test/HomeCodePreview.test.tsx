import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import HomeCodePreview from '../components/home/HomeCodePreview';

describe('Home code preview', () => {
  it('switches problems and keeps the chosen language and matching examples', async () => {
    render(<HomeCodePreview />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'JavaScript' }));
    for (const [title, filename, output] of [
      ['Reverse Linked List', 'reverse_list.js', '[5, 4, 3, 2, 1]'],
      ['Binary Search', 'binary_search.js', '4'],
      ['Climbing Stairs', 'climbing_stairs.js', '5'],
    ]) {
      await user.click(screen.getByRole('button', { name: title }));
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
      expect(screen.getByText(filename)).toBeInTheDocument();
      const source = screen.getByRole('region', { name: 'JavaScript example solution' });
      expect(source.querySelector('.code-keyword')).toBeInTheDocument();
      expect(source.querySelector('.code-function')).toBeInTheDocument();
      const problem = screen.getByRole('complementary', { name: 'The challenge' });
      expect(within(problem).getByText(output, { exact: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: title })).toHaveAttribute('aria-pressed', 'true');
    }
    await user.click(screen.getByRole('button', { name: 'Java' }));
    expect(screen.getByText('Solution.java')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Java example solution' })).toHaveTextContent('climbStairs');
    await user.click(screen.getByRole('button', { name: 'Two Sum' }));
    expect(screen.getByRole('heading', { name: 'Two Sum' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Java example solution' })).toHaveTextContent('twoSum');
  });
});
