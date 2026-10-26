import { fireEvent, render, screen } from '@testing-library/react';
import LeadStory from '@/components/landing/LeadStory';
import type { Article } from '@/lib/types';
const article: Article = { id: 'a', title: 'A committee votes', summary: 'The committee approved a measure. ' + 'The next step is a chamber vote. '.repeat(15), sourceUrl: 'https://example.com/op-eds/vote', sourceName: 'Example', publishedDate: '2026-10-26T10:00:00Z', category: 'top', imageUrl: null, readTime: 1, contextPrimer: { background: 'Committee approval sends a bill onward but does not enact it.', terms: [] } };
it('distinguishes opinion, publication date, summary and contextual background', () => {
  render(<LeadStory article={article} />);
  expect(screen.getByText('Opinion')).toBeInTheDocument();
  expect(screen.getByText('Published Oct 26, 2026')).toBeInTheDocument();
  expect(screen.getByText('Sift summary')).toBeInTheDocument();
  expect(screen.getByText(article.contextPrimer!.background)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Read original/ })).toHaveAttribute('href', article.sourceUrl);
  fireEvent.click(screen.getByRole('button', { name: /Read full summary/ }));
  expect(screen.getByText(article.summary.trim())).toBeInTheDocument();
});
it('does not manufacture a date or background for a limited example', () => {
  render(<LeadStory article={{ ...article, publishedDate: null, contextPrimer: null }} />);
  expect(screen.getByText('Publication date unavailable')).toBeInTheDocument();
  expect(screen.queryByText('What you should know first')).not.toBeInTheDocument();
});
it('provides a feed path when no real eligible example exists', () => {
  render(<LeadStory article={null} />);
  expect(screen.getByRole('link', { name: /Open the full feed/ })).toHaveAttribute('href', '/news');
});
