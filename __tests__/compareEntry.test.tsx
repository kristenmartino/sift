import { fireEvent, render, screen, within } from '@testing-library/react';
import NewsAggregator from '@/components/NewsAggregator';
import { compareStorySources } from '@/lib/compareSources';
import type { Article, Story } from '@/lib/types';
import { useNewsLoader, useBookmarks, useCustomTopics, useTheme, useTopicSearch, useCompare } from '@/lib/hooks';

jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock('next/dynamic', () => () => () => null);
jest.mock('@/lib/hooks');
jest.mock('@/components/CoachStrip', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/CardImage', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/analytics/UsageView', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => children }));

const choices = ['reuters', 'fox news', 'the guardian', 'npr', 'axios', 'the verge', 'wired', 'ars technica', 'cnbc', 'bbc'].map(key => ({ key, label: key, aliases: key === 'bbc' ? ['bbc world'] : [] }));
const articles: Article[] = ['reuters', 'fox news', 'the guardian'].map((sourceName, index) => ({
  id: `source-${index}`, title: `Publisher headline ${index}`, sourceName,
  summary: 'A sourced account of the committee vote.', sourceUrl: `https://example.com/${index}`,
  imageUrl: null, category: 'politics', readTime: 1, publishedDate: '2026-10-27T12:00:00Z',
}));
const story: Story = { id: 'story', headline: 'The committee approved the proposal', summary: 'The measure passed.',
  category: 'politics', framings: [], entities: [], articleCount: 3, outletCount: 3, articles,
  imageUrl: null, publishedDate: '2026-10-27T12:00:00Z' };
const single: Article = { ...articles[1], id: 'single', title: 'A chipmaker introduces a processor', category: 'technology' };
const compare = jest.fn();
const clear = jest.fn();
const noop = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  window.scrollTo = jest.fn();
  (useNewsLoader as jest.Mock).mockReturnValue({ articles: { top: [single] }, stories: { top: [story] }, lastUpdated: new Date("2026-10-27T13:00:00Z"), loading: false, error: null, slow: false, loadCategory: noop });
  (useBookmarks as jest.Mock).mockReturnValue({ bookmarks: new Set(), toggle: noop, count: 0 });
  (useCustomTopics as jest.Mock).mockReturnValue({ topics: [], add: noop, remove: noop, canAdd: true });
  (useTheme as jest.Mock).mockReturnValue({ dark: false, toggle: noop, mounted: true });
  (useTopicSearch as jest.Mock).mockReturnValue({ articles: [], loading: false, error: null, search: noop, clear: noop });
  (useCompare as jest.Mock).mockReturnValue({ topic: null, comparison: null, claims: [], sourcesChecked: [], sourcesDone: [], loading: false, error: null, compare, clear });
});

function renderFeed() {
  return render(<NewsAggregator userId="signed-in-reader" authSlot={null} compareSources={choices} />);
}

it('has one grouped-story action, keeps its headline and outlets, and waits for explicit submission', () => {
  renderFeed();
  const card = within(screen.getByRole('heading', { name: story.headline }).closest('article')!);
  fireEvent.click(card.getByRole('button', { name: /View coverage from 3 outlets/ }));
  expect(card.getAllByRole('button', { name: /Compare coverage/ })).toHaveLength(1);
  fireEvent.click(card.getByRole('button', { name: /Compare coverage/ }));
  expect(compare).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox')).toHaveValue(story.headline);
  expect(screen.getByRole('textbox')).not.toHaveFocus();
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  (window.scrollTo as jest.Mock).mockClear();
  for (const key of ['reuters', 'fox news', 'the guardian']) {
    expect(screen.getByRole('button', { name: key })).toHaveAttribute('aria-pressed', 'true');
  }
  expect(screen.getByRole('button', { name: 'npr' })).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(screen.getByRole('button', { name: 'the guardian' }));
  fireEvent.click(screen.getByRole('button', { name: 'npr' }));
  expect(compare).not.toHaveBeenCalled();
  expect(window.scrollTo).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
  expect(compare).toHaveBeenCalledTimes(1);
  expect(compare).toHaveBeenCalledWith(story.headline, ['reuters', 'fox news', 'npr']);
});

it('prepares the reporting outlet plus four article-category suggestions, editable before running', () => {
  renderFeed();
  const card = within(screen.getByRole('heading', { name: single.title }).closest('article')!);
  fireEvent.click(card.getByRole('button', { name: 'Compare coverage' }));
  expect(compare).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox')).toHaveValue(single.title);
  for (const key of ['fox news', 'the verge', 'wired', 'ars technica', 'cnbc']) {
    expect(screen.getByRole('button', { name: key })).toHaveAttribute('aria-pressed', 'true');
  }
  expect(screen.getByRole('button', { name: 'reuters' })).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(screen.getByRole('button', { name: 'wired' }));
  fireEvent.click(screen.getByRole('button', { name: 'reuters' }));
  expect(compare).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
  expect(compare).toHaveBeenCalledWith(single.title, ['fox news', 'the verge', 'ars technica', 'cnbc', 'reuters']);
});

it('deduplicates publisher aliases, selects only known group outlets, and caps a larger group at five', () => {
  const names = ['bbc world', 'bbc', 'reuters', 'fox news', 'the guardian', 'npr', 'axios'];
  const draft = compareStorySources('technology', names, choices);
  expect(draft.reporting).toEqual(['bbc', 'reuters', 'fox news', 'the guardian', 'npr', 'axios']);
  expect(draft.selected).toEqual(draft.reporting.slice(0, 5));
  expect(draft.selected).not.toContain('the verge');
});

it('reports an unavailable original outlet instead of pretending a suggestion is its coverage', () => {
  const draft = compareStorySources('technology', ['Unknown outlet'], choices);
  expect(draft.reporting).toEqual([]);
  expect(draft.unavailable).toEqual(['Unknown outlet']);
  expect(draft.selected).toHaveLength(5);
});

it('lets a reader swap a sixth reporting outlet into a five-outlet story draft', () => {
  const names = ['reuters', 'fox news', 'the guardian', 'npr', 'axios', 'bbc'];
  const large = { ...story, articles: names.map((sourceName, i) => ({ ...articles[0], id: `large-${i}`, sourceName })), framings: [], articleCount: 6, outletCount: 6 };
  (useNewsLoader as jest.Mock).mockReturnValue({ articles: { top: [] }, stories: { top: [large] }, lastUpdated: null, loading: false, loadCategory: noop });
  renderFeed();
  const card = within(screen.getByRole('heading', { name: story.headline }).closest('article')!);
  fireEvent.click(card.getByRole('button', { name: /Compare coverage/ }));
  expect(screen.getByText(/6 outlets report on this story. Five are selected/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'bbc' })).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'reuters' }));
  fireEvent.click(screen.getByRole('button', { name: 'bbc' }));
  expect(compare).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
  expect(compare).toHaveBeenCalledWith(story.headline, ['fox news', 'the guardian', 'npr', 'axios', 'bbc']);
});
