import { render, screen } from '@testing-library/react';
import StoryCard from '@/components/StoryCard';
import type { Story } from '@/lib/types';

jest.mock('@/components/CardImage', () => ({ __esModule: true, default: () => null }));

it('keeps both outlets visible when no distinct framing was found', () => {
  const story: Story = {
    id: 'same-report', headline: 'The committee voted on Tuesday.',
    summary: 'The measure passed by a vote of 10 to 2.', category: 'politics',
    framings: [
      { sourceName: 'Outlet A', framing: '', tone: 'neutral' },
      { sourceName: 'Outlet B', framing: '', tone: 'neutral' },
    ],
    entities: [], articleCount: 2, outletCount: 2, imageUrl: null, publishedDate: '2026-10-24T12:00:00Z',
    articles: ['A', 'B'].map((name) => ({
      id: name, title: `Report from ${name}`, summary: 'The measure passed 10 to 2.',
      sourceName: `Outlet ${name}`, sourceUrl: `https://example.com/${name}`,
      category: 'politics', imageUrl: null, readTime: 1, publishedDate: '2026-10-24T12:00:00Z',
    })),
  };
  render(<StoryCard story={story} featured={false} index={0} onCompare={jest.fn()} onBookmark={jest.fn()} bookmarks={new Set()} />);
  expect(screen.getByText('2 sources')).toBeInTheDocument();
  for (const name of ['A', 'B']) {
    const link = screen.getByRole('link', { name: `Report from ${name}` });
    expect(link).toBeVisible();
    expect(link.closest('[style*="grid-template-rows: 0fr"]')).toBeNull();
  }
});

it('orders blank-note outlets by their rating alongside framed outlets', () => {
  const profiles = [
    { slug: 'left', name: 'Left outlet', allSidesRating: 'left' },
    { slug: 'right', name: 'Right outlet', allSidesRating: 'right' },
  ].map((p) => ({ ...p, allSidesUrl: null, mbfcFactual: null, mbfcUrl: null }) as NonNullable<Story['articles'][number]['outlet']>);
  const story: Story = {
    id: 'spectrum-order', headline: 'A vote was held.', summary: 'The measure passed.', category: 'politics',
    framings: [
      { sourceName: 'Right outlet', framing: 'Cites the vote count.', tone: 'neutral', outlet: profiles[1] },
      { sourceName: 'Left outlet', framing: '', tone: 'neutral', outlet: profiles[0] },
    ],
    entities: [], articleCount: 2, outletCount: 2, imageUrl: null, publishedDate: null,
    articles: profiles.map((outlet) => ({ id: outlet.slug, title: `Report ${outlet.slug}`, summary: 'A vote was held.', sourceName: outlet.name, sourceUrl: `https://example.com/${outlet.slug}`, category: 'politics', imageUrl: null, readTime: 1, publishedDate: null, outlet })),
  };
  render(<StoryCard story={story} featured={false} index={0} onCompare={jest.fn()} onBookmark={jest.fn()} bookmarks={new Set()} />);
  const sources = screen.getAllByRole('link', { name: /Outlet dossier for/ });
  expect(sources.map((s) => s.getAttribute('aria-label'))).toEqual(['Outlet dossier for Left outlet', 'Outlet dossier for Right outlet']);
});
