import { compareDraftReturnTo, compareDraftSignInHref } from '@/lib/compareDraft';

it('keeps a validated topic and exact supported source order through sign-in', () => {
  const draft = { topic: '  Redistricting & elections?  ', sources: ['bbc', 'reuters', 'axios'] };
  const path = compareDraftReturnTo(draft)!;
  const target = new URL(path, 'https://sift.example');
  expect(target.pathname).toBe('/news');
  expect(target.searchParams.get('compare')).toBe('Redistricting & elections?');
  expect(target.searchParams.get('sources')).toBe('bbc,reuters,axios');
  const signIn = new URL(compareDraftSignInHref(draft)!, 'https://sift.example');
  expect(signIn.pathname).toBe('/sign-in');
  expect(signIn.searchParams.get('redirect_url')).toBe(path);
});

it.each([
  { topic: '', sources: ['bbc', 'reuters'] },
  { topic: 'ab', sources: ['bbc', 'reuters'] },
  { topic: 'a'.repeat(201), sources: ['bbc', 'reuters'] },
  { topic: 'Federal Reserve', sources: [] },
  { topic: 'Federal Reserve', sources: ['bbc'] },
  { topic: 'Federal Reserve', sources: ['bbc', 'reuters', 'axios', 'npr', 'cnn', 'vox'] },
  { topic: 'Federal Reserve', sources: ['bbc', 'unsupported'] },
  { topic: 'Federal Reserve', sources: ['bbc', 'bbc'] },
])('rejects an incomplete or unsupported draft without substituting intent: %j', (draft) => {
  expect(compareDraftReturnTo(draft)).toBeNull();
  expect(compareDraftSignInHref(draft)).toBeNull();
});

it('accepts the exact topic and source-count boundaries', () => {
  expect(compareDraftReturnTo({ topic: 'Fed', sources: ['bbc', 'reuters'] })).not.toBeNull();
  expect(compareDraftReturnTo({ topic: 'x'.repeat(200), sources: ['bbc', 'reuters', 'axios', 'npr', 'cnn'] })).not.toBeNull();
});
