import { fireEvent, render, screen } from '@testing-library/react';
import ReadingSummary from '@/components/ReadingSummary';
import ArticleCard from '@/components/ArticleCard';
import StoryCard from '@/components/StoryCard';
import BackgroundPrimer from '@/components/primer/BackgroundPrimer';
import type { Article, Story } from '@/lib/types';

jest.mock('@/components/CardImage', () => ({ __esModule: true, default: () => null }));
const first = 'The committee held a vote after hearing evidence.';
const ending = 'The new rules will take effect next year, and a second hearing will address enforcement.';
const summary = `${first} ${'Members discussed implementation and funding. '.repeat(4)}${ending}`;
const article: Article = { id: 'article', title: 'Publisher headline', summary, sourceUrl: 'https://example.com/opinion/vote', sourceName: 'Outlet A', category: 'politics', publishedDate: '2026-10-10T12:00:00Z', imageUrl: null, readTime: 1 };

it('exposes the complete summary independently and collapses to a whole-sentence preview', () => {
  const parentClick = jest.fn();
  render(<div onClick={parentClick}><ReadingSummary summary={summary} previewChars={60} /></div>);
  expect(screen.getByText(first)).toBeInTheDocument();
  expect(screen.queryByText(new RegExp(ending))).not.toBeInTheDocument();
  const button = screen.getByRole('button', { name: /Read full summary/ });
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(button).toHaveAttribute('type', 'button');
  button.focus();
  fireEvent.click(button, { detail: 0 });
  expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(document.getElementById(button.getAttribute('aria-controls')!)).toHaveTextContent(summary);
  expect(parentClick).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Show less/ }));
  expect(screen.getByText(first)).toBeInTheDocument();
});

it('does not offer expansion for complete short text and labels unpunctuated excerpts', () => {
  const { rerender } = render(<ReadingSummary summary='A complete summary.' />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  rerender(<ReadingSummary summary={'Long wording '.repeat(100)} previewChars={50} />);
  expect(screen.getByText('Sift summary · excerpt')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Read full summary/ }));
  expect(screen.getByText('Sift summary')).toBeInTheDocument();
  rerender(<ReadingSummary summary='' />);
  expect(screen.queryByText(/Sift summary/)).not.toBeInTheDocument();
});

it('lets a single article be read in full while publisher and bookmark actions remain distinct', () => {
  const bookmark = jest.fn();
  render(<ArticleCard article={article} featured index={0} isBookmarked={false} onBookmark={bookmark} />);
  expect(screen.getByText('Opinion')).toBeInTheDocument();
  expect(screen.getByText('Earlier publication')).toBeInTheDocument();
  const toggle = screen.getByRole('button', { name: /Read full summary/ });
  expect(toggle.closest('a')).toBeNull();
  fireEvent.click(toggle);
  expect(screen.getByText(summary)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: article.title })).toHaveAttribute('href', article.sourceUrl);
  expect(screen.getByRole('link', { name: /Read original/ })).toHaveAttribute('target', '_blank');
  expect(bookmark).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Add bookmark/ }));
  expect(bookmark).toHaveBeenCalledWith(article.id);
});

it('keeps a cluster summary and all source coverage as independent disclosures', () => {
  const story: Story = { id: 's', headline: 'Committee vote', summary, category: 'politics', imageUrl: null, publishedDate: article.publishedDate, framings: [], articles: [article, { ...article, id: 'b', sourceName: 'Outlet B', sourceUrl: 'https://example.org/news/a' }], articleCount: 2, outletCount: 2, entities: [] };
  render(<StoryCard story={story} featured={false} index={0} onBookmark={jest.fn()} bookmarks={new Set()} />);
  expect(screen.getByText('Includes opinion')).toBeInTheDocument();
  const coverage = screen.getByRole('button', { name: /View coverage from 2 outlets/ });
  fireEvent.click(screen.getByRole('button', { name: /Read full summary/ }));
  expect(screen.getByText(summary)).toBeInTheDocument();
  expect(coverage).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(coverage);
  expect(screen.getByRole('region', { name: 'Source coverage' })).toBeInTheDocument();
  expect(screen.getByText(summary)).toBeInTheDocument();
});

it('labels definitions-only panels without promising additional background', () => {
  render(<BackgroundPrimer primer={{ background: '', terms: [{ term: 'Cloture', definition: 'A procedure to end debate.' }] }} />);
  expect(screen.getByRole('button', { name: /Terms explained/i })).toBeInTheDocument();
});
