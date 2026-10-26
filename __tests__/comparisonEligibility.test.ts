import { eligibleComparisonExample } from '@/lib/comparison';
import type { DailyCompareExample } from '@/lib/types';
const now = Date.parse('2026-10-26T12:00:00Z');
const example: DailyCompareExample = {
  topic: 'Committee vote', comparison: 'Two outlets covered the vote.',
  source_provenance_version: 1, sources_requested: ['A', 'B'], sources_retrieved: ['A', 'B'], sources_analyzed: ['A', 'B'], sources_unavailable: [], sources_checked: ['A', 'B'],
  claims: [{ claim: 'A vote took place.', sources: ['A', 'B', 'Invented'], agreement: 'unanimous' }, { claim: 'The vote was on Tuesday.', sources: ['A'], agreement: 'unanimous' }], duration_ms: 10, generatedAt: '2026-10-25T12:00:00Z',
};
it('demonstrates only recent source-accounted output, with normalized claims', () => {
  const valid = eligibleComparisonExample(example, now)!;
  expect(valid.claims[0].sources).toEqual(['A', 'B']);
  expect(valid.claims[1].agreement).toBe('unique');
  expect(example.claims[0].sources).toContain('Invented');
});
it('rejects missing, future, invalid or older-than-seven-days examples', () => {
  expect(eligibleComparisonExample(null, now)).toBeNull();
  expect(eligibleComparisonExample(undefined, now)).toBeNull();
  for (const generatedAt of ['invalid', '2026-10-27T12:00:00Z', '2026-10-19T11:59:59Z']) expect(eligibleComparisonExample({ ...example, generatedAt }, now)).toBeNull();
  expect(eligibleComparisonExample({ ...example, generatedAt: '2026-10-19T12:00:00Z' }, now)).not.toBeNull();
});
it('rejects legacy availability, one analyzed source, and unsupported claims', () => {
  expect(eligibleComparisonExample({ ...example, source_provenance_version: undefined }, now)).toBeNull();
  expect(eligibleComparisonExample({ ...example, sources_analyzed: ['A'] }, now)).toBeNull();
  expect(eligibleComparisonExample({ ...example, claims: [{ claim: 'Unknown', agreement: 'unanimous', sources: ['Invented'] }, example.claims[1]] }, now)).toBeNull();
});
it('uses the present time when a caller does not supply a reference', () => {
  jest.spyOn(Date, 'now').mockReturnValue(now);
  expect(eligibleComparisonExample(example)).not.toBeNull();
  jest.restoreAllMocks();
});
