import { selectLoadedFeed } from '@/lib/feedView';
import type { FeedItem } from '@/lib/types';

const now = Date.parse('2026-10-26T12:00:00Z');
const item = (id: string, publishedDate: string | null): FeedItem => ({ type: 'article', data: { id, publishedDate } } as FeedItem);
const old = item('old', '2026-10-24T12:00:00Z');
const fresh = item('fresh', '2026-10-26T11:00:00Z');
const boundary = item('boundary', '2026-10-25T12:00:00Z');
const future = item('future', '2026-10-27T12:00:00Z');
const unknown = item('unknown', null);
const invalid = item('invalid', 'invalid');

it('preserves recommended ranking and does not mutate the loaded pool', () => {
  const loaded = [old, fresh];
  const result = selectLoadedFeed(loaded, 'recommended', 'all', now);
  expect(result).toEqual(loaded);
  expect(result).not.toBe(loaded);
  expect(selectLoadedFeed(loaded, 'latest', 'all', now)).toEqual([fresh, old]);
  expect(loaded).toEqual([old, fresh]);
});
it('sorts the loaded pool by publication time with invalid, absent and future dates last', () => {
  expect(selectLoadedFeed([unknown, old, fresh, invalid, future], 'latest', 'all', now)).toEqual([fresh, old, unknown, invalid, future]);
});
it('includes the exact 24-hour boundary and excludes old, future and undated reporting', () => {
  expect(selectLoadedFeed([old, fresh, unknown, invalid, future, boundary], 'recommended', 'day', now)).toEqual([fresh, boundary]);
  expect(selectLoadedFeed([boundary, fresh], 'latest', 'day', now)).toEqual([fresh, boundary]);
});
it('returns an empty selection when no loaded item meets the date range', () => {
  expect(selectLoadedFeed([old], 'latest', 'day', now)).toEqual([]);
});

it('keeps reporting published after a collector checkpoint but before the view time', () => {
  const collectorCheckpoint = Date.parse('2026-10-26T11:00:00Z');
  const laterReporting = item('after-checkpoint', '2026-10-26T11:30:00Z');
  expect(Date.parse(laterReporting.data.publishedDate!)).toBeGreaterThan(collectorCheckpoint);
  expect(selectLoadedFeed([old, laterReporting], 'latest', 'day', now)).toEqual([laterReporting]);
});

it('filters known formats without relabeling unknown articles or reordering matches', () => {
  const opinion = { ...fresh, data: { ...fresh.data, sourceUrl: 'https://example.com/op-eds/a' } } as FeedItem;
  const digest = { ...old, data: { ...old.data, isRoundup: true } } as FeedItem;
  const video = { ...boundary, data: { ...boundary.data, sourceUrl: 'https://example.com/video/a' } } as FeedItem;
  const group = { type: 'story', data: { ...fresh.data, id: 'group', articles: [opinion.data] } } as FeedItem;
  const flagGroup = { type: 'story', data: { ...fresh.data, id: 'flag', isOpinion: true, articles: [] } } as FeedItem;
  const neutralGroup = { type: 'story', data: { ...fresh.data, id: 'neutral', articles: [] } } as FeedItem;
  const pool = [old, opinion, digest, video, group, flagGroup, neutralGroup];
  expect(selectLoadedFeed(pool, 'recommended', 'all', now, 'opinion')).toEqual([opinion, group, flagGroup]);
  expect(selectLoadedFeed(pool, 'recommended', 'all', now, 'digests')).toEqual([digest]);
  expect(selectLoadedFeed(pool, 'recommended', 'all', now, 'video')).toEqual([video]);
  expect(selectLoadedFeed(pool, 'recommended', 'all', now, 'groups')).toEqual([group, flagGroup, neutralGroup]);
  expect(selectLoadedFeed(pool, 'recommended', 'day', now, 'digests')).toEqual([]);
});
