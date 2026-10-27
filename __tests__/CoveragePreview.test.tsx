import { render, screen } from '@testing-library/react';
import CoveragePreview from '@/components/CoveragePreview';
import type { Story, OutletProfile } from '@/lib/types';

const story: Story = {
  id: 'vote', headline: 'The committee approved a measure', summary: 'A committee vote took place.', category: 'politics', framings: [], entities: [], articleCount: 3, outletCount: 3, imageUrl: null, publishedDate: '2026-10-26T12:00:00Z',
  articles: [
    { id: 'a', sourceName: 'A', title: 'A reports the committee vote', sourceUrl: 'https://example.com/a' },
    { id: 'b', sourceName: 'B', title: 'B reports the committee vote', sourceUrl: 'https://example.com/b' },
    { id: 'c', sourceName: 'C', title: 'A headline without an original', sourceUrl: '' },
  ].map((a) => ({ ...a, summary: 'The committee voted.', category: 'politics', publishedDate: '2026-10-26T12:00:00Z', imageUrl: null, readTime: 1 })),
};
it('shows cited outlet ratings in the signed-out Compare preview before any interaction', () => {
  const ratedStory = { ...story, articles: story.articles.map((article) => ({ ...article,
    outlet: { slug: article.sourceName.toLowerCase(), name: article.sourceName,
      allSidesRating: 'center', allSidesUrl: `https://www.allsides.com/news-source/${article.sourceName}`,
      mbfcFactual: 'mostly-factual', mbfcUrl: `https://mediabiasfactcheck.com/${article.sourceName}/`,
    } as OutletProfile,
  })) };
  render(<CoveragePreview stories={[ratedStory]} />);
  expect(screen.getAllByRole('link', { name: /AllSides bias rating: Center/ })).toHaveLength(2);
  const factual = screen.getAllByRole('link', { name: /MBFC factual reporting: Mostly Factual/ });
  expect(factual).toHaveLength(2);
  expect(factual[0]).toBeVisible();
  expect(factual[0]).toHaveAttribute('href', 'https://mediabiasfactcheck.com/A/');
  expect(screen.getAllByRole('link', { name: 'About these ratings →' })).toHaveLength(2);
  expect(screen.queryByRole('link', { name: 'Outlet dossier for C' })).not.toBeInTheDocument();
  expect(screen.getByText(/not a generated comparison or a finding of agreement/)).toBeVisible();
});
it('shows original source headlines without inventing claim agreement', () => {
  render(<CoveragePreview stories={[story]} />);
  expect(screen.getByRole('heading', { name: story.headline })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /A reports the committee vote/ })).toHaveAttribute('href', 'https://example.com/a');
  expect(screen.getByRole('link', { name: /B reports the committee vote/ })).toHaveAttribute('href', 'https://example.com/b');
  expect(screen.getByText(/not a generated comparison or a finding of agreement/)).toBeInTheDocument();
  expect(screen.queryByText('A headline without an original')).not.toBeInTheDocument();
  const signIn = new URL(screen.getByRole('link', { name: /Sign in to compare/ }).getAttribute('href')!, 'https://sift.example');
  expect(signIn.pathname).toBe('/sign-in');
  const returnTo = new URL(signIn.searchParams.get('redirect_url')!, 'https://sift.example');
  expect(returnTo.pathname).toBe('/news');
  expect(returnTo.searchParams.get('compare')).toBe(story.headline);
  expect(returnTo.searchParams.get('sources')?.split(',')).toHaveLength(5);
});
it('explains the process when no sourced multi-outlet preview is available', () => {
  render(<CoveragePreview stories={[{ ...story, articles: story.articles.slice(0, 1) }]} />);
  expect(screen.getByText(/No recent, source-accounted saved comparison is available/)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: story.headline })).not.toBeInTheDocument();
});

it('preserves supported source choices through sign-in', () => {
  const sources = ['Financial Times', 'The Hill', 'Axios'];
  render(<CoveragePreview stories={[{ ...story, articles: sources.map((sourceName, index) => ({ ...story.articles[0], id: String(index), sourceName, sourceUrl: `https://example.com/${index}` })) }]} />);
  const link = new URL(screen.getByRole('link', { name: /Sign in to compare/ }).getAttribute('href')!, 'https://sift.example');
  const returnTo = new URL(link.searchParams.get('redirect_url')!, 'https://sift.example');
  expect(returnTo.searchParams.get('sources')).toBe('financial times,the hill,axios');
});

it('uses the reader draft instead of the unrelated preview candidate at sign-in', () => {
  render(<CoveragePreview stories={[story]} draft={{ topic: 'Federal Reserve rate decision', sources: ['bbc', 'reuters'] }} />);
  const link = new URL(screen.getByRole('link', { name: /Sign in to compare your topic/ }).getAttribute('href')!, 'https://sift.example');
  const returnTo = new URL(link.searchParams.get('redirect_url')!, 'https://sift.example');
  expect(returnTo.searchParams.get('compare')).toBe('Federal Reserve rate decision');
  expect(returnTo.searchParams.get('sources')).toBe('bbc,reuters');
  expect(screen.getByRole('heading', { name: story.headline })).toBeInTheDocument();
  expect(screen.getByText(/Your topic and selected outlets will be kept/)).toBeInTheDocument();
});

it.each([
  { topic: 'ab', sources: ['bbc', 'reuters'] },
  { topic: 'Reader topic', sources: ['bbc'] },
  { topic: 'Reader topic', sources: ['bbc', 'unknown'] },
])('explains invalid drafts without falling back to the preview story: %j', (draft) => {
  render(<CoveragePreview stories={[story]} draft={draft} />);
  expect(screen.queryByRole('link', { name: /Sign in to compare/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Enter a topic of 3–200 characters/)).toBeInTheDocument();
});

it('keeps the preview candidate action for a blank draft', () => {
  render(<CoveragePreview stories={[story]} draft={{ topic: '   ', sources: ['bbc', 'reuters'] }} />);
  const link = new URL(screen.getByRole('link', { name: /Sign in to compare/ }).getAttribute('href')!, 'https://sift.example');
  const returnTo = new URL(link.searchParams.get('redirect_url')!, 'https://sift.example');
  expect(returnTo.searchParams.get('compare')).toBe(story.headline);
});
