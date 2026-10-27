import { act, renderHook } from '@testing-library/react';
import { compareSessionRefreshTarget } from '@/lib/compareSession';
import { useCompare } from '@/lib/hooks';

const choices = [{ key: 'the guardian', label: 'The Guardian' }, { key: 'new york post', label: 'New York Post' }];
const draft = { topic: 'The submitted event', sources: choices.map(s => s.key) };
beforeEach(() => sessionStorage.clear());

it('refreshes only a signed-in, validated submitted draft and bounds repeat attempts', () => {
  expect(compareSessionRefreshTarget(null, draft, choices, sessionStorage, 100_000)).toBeNull();
  expect(compareSessionRefreshTarget('user', { ...draft, sources: ['unknown', 'new york post'] }, choices, sessionStorage, 100_000)).toBeNull();
  const target = compareSessionRefreshTarget('user', draft, choices, sessionStorage, 100_000)!;
  expect(new URL(target, 'https://sift.example').searchParams.get('sources')).toBe('the guardian,new york post');
  expect(new URL(target, 'https://sift.example').searchParams.get('compare')).toBe(draft.topic);
  expect(compareSessionRefreshTarget('user', draft, choices, sessionStorage, 100_001)).toBeNull();
  expect(compareSessionRefreshTarget('user', draft, choices, sessionStorage, 160_000)).toBe(target);
});

it('keeps the sign-in fallback if session storage is unavailable', () => {
  const storage = { getItem: () => { throw new Error('blocked'); }, setItem: jest.fn() };
  expect(compareSessionRefreshTarget('user', draft, choices, storage)).toBeNull();
  expect(storage.setItem).not.toHaveBeenCalled();
});

it.each([true, false])('offers a rejected request once to session recovery: %s', async (recover) => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) });
  const refresh = jest.fn().mockReturnValue(recover);
  const { result } = renderHook(() => useCompare(refresh));
  const sources = [...draft.sources];
  await act(async () => {
    const pending = result.current.compare(draft.topic, sources);
    sources.push('a later UI change');
    await pending;
  });
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(refresh).toHaveBeenCalledWith(draft.topic, draft.sources);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(result.current.error).toBe(recover ? null : 'Unauthorized');
});

it('does not refresh for budget or provider errors', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: 'Capacity unavailable' }) });
  const refresh = jest.fn();
  const { result } = renderHook(() => useCompare(refresh));
  await act(async () => { await result.current.compare(draft.topic, draft.sources); });
  expect(refresh).not.toHaveBeenCalled();
  expect(result.current.error).toBe('Capacity unavailable');
});
