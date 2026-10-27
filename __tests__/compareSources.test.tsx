import { fireEvent, render, screen, within } from '@testing-library/react';
import { compareSourcesFromMap, compareDefaults, resolveCompareSource } from '@/lib/compareSources';
import { compareDraftReturnTo } from '@/lib/compareDraft';
import { CompareSourcesProvider } from '@/components/CompareSources';
import CompareView from '@/components/CompareView';
import type { OutletProfile } from '@/lib/types';

jest.mock('@/components/CompareOutletRatings', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/analytics/UsageView', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@/components/ShareActions', () => ({ ShareButton: () => null }));
const fox = { slug: 'fox-news', name: 'Fox News', allSidesRating: 'lean-right' } as OutletProfile;
const bbc = { slug: 'bbc-news', name: 'BBC News', allSidesRating: 'center' } as OutletProfile;
const other = { slug: 'curated-extra', name: 'Curated Extra' } as OutletProfile;
const map = new Map([['fox news', fox], ['bbc', bbc], ['bbc news', bbc], ['bbc world', bbc], ['curated extra', other]]);

it('derives one choice per curated publisher, including right-leaning outlets and new registry entries', () => {
  const choices = compareSourcesFromMap(map);
  expect(choices).toHaveLength(3);
  expect(choices.map(s => s.label)).toContain('Fox News');
  expect(choices.map(s => s.key)).toContain('curated extra');
  expect(resolveCompareSource(' BBC World ', choices)?.key).toBe('bbc');
  expect(resolveCompareSource('bbc-news', choices)?.key).toBe('bbc');
  expect(resolveCompareSource('fortune', choices)).toBeUndefined();
  expect(compareDefaults('top', choices).every(k => choices.some(s => s.key === k))).toBe(true);
});

it('preserves newly curated choices through sign-in and rejects duplicate publisher aliases', () => {
  const choices = compareSourcesFromMap(map);
  expect(compareDraftReturnTo({ topic: 'An indexed event', sources: ['fox news', 'curated extra'] }, choices)).toContain('curated+extra');
  expect(compareDraftReturnTo({ topic: 'An indexed event', sources: ['bbc', 'bbc world'] }, choices)).toBeNull();
});

it('uses the shared registry in the result picker and keeps the five-outlet limit', () => {
  window.scrollTo = jest.fn();
  const choices = Array.from({ length: 6 }, (_, i) => ({ key: `outlet ${i}`, label: i === 5 ? 'Fox News' : `Outlet ${i}` }));
  const toggle = jest.fn();
  render(<CompareSourcesProvider value={choices}><CompareView topic="An event" comparison="Coverage." sourcesChecked={[]} claims={[]} durationMs={1} selectedSources={choices.slice(0, 5).map(s => s.key)} onToggleSource={toggle} onCompareAnother={jest.fn()} onClose={jest.fn()} /></CompareSourcesProvider>);
  fireEvent.click(screen.getByRole('button', { name: /Sources to search:/ }));
  const sixth = screen.getByRole('button', { name: 'Fox News' });
  expect(sixth).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(sixth);
  expect(toggle).not.toHaveBeenCalled();
  expect(screen.getByText('5/5 selected')).toBeVisible();
  expect(within(sixth.parentElement!).getAllByRole('button')).toHaveLength(6);
});
