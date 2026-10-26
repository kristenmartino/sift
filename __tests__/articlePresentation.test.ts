import { articleContentLabel, isEarlierPublication, summaryPreview } from '@/lib/articlePresentation';
import type { Article } from '@/lib/types';

type Presented = Pick<Article, 'isOpinion' | 'isRoundup' | 'genre' | 'sourceUrl'>;
const article = (fields: Partial<Presented> = {}): Presented => ({ sourceUrl: 'https://example.com/news/a', ...fields });

describe('explicit publisher formats', () => {
  it.each(['opinion', 'opinions', 'op-ed', 'op-eds', 'editorial', 'editorials'])('recognizes the /%s/ section', (section) => {
    expect(articleContentLabel(article({ sourceUrl: `https://example.com/${section}/a` }))).toBe('Opinion');
  });
  it('uses flags and precedence without inferring a default reporting format', () => {
    expect(articleContentLabel(article({ isOpinion: true, isRoundup: true }))).toBe('Opinion');
    expect(articleContentLabel(article({ isRoundup: true, sourceUrl: 'https://example.com/video/a' }))).toBe('Digest');
    expect(articleContentLabel(article({ sourceUrl: 'https://example.com/VIDEOS/a', genre: 'feature' }))).toBe('Video');
    expect(articleContentLabel(article({ genre: 'feature' }))).toBe('Feature');
    expect(articleContentLabel(article({ genre: 'news' }))).toBeNull();
    expect(articleContentLabel(article({ genre: 'soft' }))).toBeNull();
  });
  it.each(['', 'broken URL', 'javascript:opinion/a', 'https://opinion.example.com/news/a', 'https://example.com/news/an-opinion-piece', 'https://example.com/news/a?section=opinion', 'https://example.com/news/a#video'])('does not label from unsupported evidence %s', (sourceUrl) => {
    expect(articleContentLabel(article({ sourceUrl }))).toBeNull();
  });
});

describe('readable summary previews', () => {
  it('keeps short summaries and the largest whole sentences that fit', () => {
    expect(summaryPreview('  A vote took place.  ')).toBe('A vote took place.');
    expect(summaryPreview('The vote passed. The mayor spoke. The hearing is scheduled next week.', 35)).toBe('The vote passed. The mayor spoke.');
  });
  it('allows a moderately long opening sentence rather than cutting it mid-thought', () => {
    const opening = `The U.S. committee reviewed ${'the available evidence '.repeat(12)}before voting.`;
    expect(summaryPreview(`${opening} The decision takes effect next year.`, 180)).toBe(opening);
  });
  it('keeps an exceptionally long sentence or unpunctuated text as an honest excerpt', () => {
    const long = `The ${'committee '.repeat(90)}voted.`;
    expect(summaryPreview(long, 180)).toMatch(/…$/);
    expect(summaryPreview('Unpunctuated '.repeat(35), 40)).toBe('Unpunctuated Unpunctuated Unpunctuated…');
    expect(summaryPreview('')).toBe('');
  });
});

it('marks only older known publication dates, including the seven-day boundary', () => {
  const now = Date.parse('2026-10-26T12:00:00Z');
  expect(isEarlierPublication('2026-10-19T12:00:00Z', now)).toBe(true);
  expect(isEarlierPublication('2026-10-19T12:00:01Z', now)).toBe(false);
  expect(isEarlierPublication('2026-10-27T12:00:00Z', now)).toBe(false);
  expect(isEarlierPublication(null, now)).toBe(false);
  expect(isEarlierPublication('bad', now)).toBe(false);
  jest.spyOn(Date, 'now').mockReturnValue(now);
  expect(isEarlierPublication('2026-10-18T12:00:00Z')).toBe(true);
  jest.restoreAllMocks();
});
