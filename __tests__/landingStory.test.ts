import { selectLandingArticle, isRecentLandingPublication } from '@/lib/landingStory';

const now = Date.parse('2026-10-26T12:00:00Z');
const row = (id: string, values: Record<string, unknown> = {}) => ({ id,
  source_url: `https://publisher.example/news/${id}`, published_date: '2026-10-26T10:00:00Z',
  context_primer: null, ...values });

it('prefers a recent real background while keeping ranked ties stable', () => {
  const noContext = row('no');
  const termsOnly = row('terms', { context_primer: { terms: [{ term: 'Cloture', definition: 'A vote.' }] } });
  const rich = row('rich', { context_primer: { background: 'Cloture limits debate before the chamber can vote.', terms: [] } });
  expect(selectLandingArticle([noContext, termsOnly, rich, { ...rich, id: 'later' }], now)).toBe(rich);
});
it('excludes declared opinion and digests, including explicit opinion URL sections', () => {
  const news = row('news');
  expect(selectLandingArticle([row('flag', { is_opinion: true }), row('digest', { is_roundup: true }),
    row('path', { source_url: 'https://publisher.example/op-eds/argument' }), news], now)).toBe(news);
});
it('keeps publication provenance: rejects future, invalid and obsolete dates', () => {
  const unknown = row('unknown', { published_date: null });
  expect(selectLandingArticle([row('future', { published_date: '2026-10-27' }), row('bad', { published_date: 'bad' }),
    row('old', { published_date: '2026-09-01' }), unknown], now)).toBe(unknown);
});
it('prefers a recent article over an older contextual example and an undated fallback', () => {
  const fresh = row('fresh', { published_date: new Date(now - 86_400_000) });
  const older = row('older', { published_date: '2026-10-01', context_primer: { background: 'An older explanation.' } });
  expect(selectLandingArticle([older, row('undated', { published_date: null }), fresh], now)).toBe(fresh);
  expect(selectLandingArticle([older], now)).toBe(older);
});
it('rejects unsafe and malformed original links and handles empty pools', () => {
  expect(selectLandingArticle([row('unsafe', { source_url: 'javascript:alert(1)' }), row('bad', { source_url: 'not a URL' })], now)).toBeNull();
  expect(selectLandingArticle([], now)).toBeNull();
});
it('accepts the recent boundary and http sources without mistaking query text for an opinion section', () => {
  const current = row('boundary', { source_url: 'http://publisher.example/news/a?next=/opinion/', published_date: new Date(now - 7 * 86_400_000), context_primer: { background: 'A genuine explanation.' } });
  expect(selectLandingArticle([current], now)).toBe(current);
});

it('requires a known nonfuture recent publisher date for headline demonstrations', () => {
  expect(isRecentLandingPublication(null, now)).toBe(false);
  expect(isRecentLandingPublication('invalid', now)).toBe(false);
  expect(isRecentLandingPublication(new Date(now + 1), now)).toBe(false);
  expect(isRecentLandingPublication(new Date(now - 7 * 86_400_000 - 1), now)).toBe(false);
  expect(isRecentLandingPublication(new Date(now - 7 * 86_400_000), now)).toBe(true);
  expect(isRecentLandingPublication(new Date(now), now)).toBe(true);
});
