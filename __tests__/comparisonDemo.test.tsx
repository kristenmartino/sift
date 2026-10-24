import { render, screen } from '@testing-library/react';
import ComparisonDemo from '@/components/landing/ComparisonDemo';
import type { DailyCompareExample } from '@/lib/types';

const example: DailyCompareExample = {
  topic: 'Federal Reserve rate decision',
  comparison: 'Two outlets report the rate decision.',
  sources_checked: ['Outlet A', 'Outlet B'],
  source_provenance_version: 1,
  sources_requested: ['Outlet A', 'Outlet B'],
  sources_retrieved: ['Outlet A', 'Outlet B'],
  sources_analyzed: ['Outlet A', 'Outlet B'],
  sources_unavailable: [],
  claims: [
    { claim: 'The rate was unchanged.', agreement: 'unanimous', sources: ['Outlet A', 'Outlet B'] },
    { claim: 'The next meeting is in September.', agreement: 'unanimous', sources: ['Outlet A', 'Outlet B'] },
  ],
  duration_ms: 1000,
  generatedAt: '2025-08-11T00:30:00.000Z',
};

it('labels an old saved comparison as an example and preserves its full UTC date', () => {
  render(<ComparisonDemo example={example} />);
  expect(screen.getByText(/Example comparison/)).toBeInTheDocument();
  expect(screen.getByText(/Generated August 11, 2025/)).toBeInTheDocument();
  expect(screen.queryByText(/Today|one real comparison a day/)).not.toBeInTheDocument();
});

it('labels the fallback as invented sample content', () => {
  render(<ComparisonDemo example={null} />);
  expect(screen.getByText(/These outlet names and sample lines are invented/)).toBeInTheDocument();
  expect(screen.queryByText(/Generated/)).not.toBeInTheDocument();
});

it('does not present a legacy example as verified agreement', () => {
  render(<ComparisonDemo example={{ ...example, source_provenance_version: undefined }} />);
  expect(screen.getByText(/These outlet names and sample lines are invented/)).toBeInTheDocument();
  expect(screen.queryByText(/Reported by/)).not.toBeInTheDocument();
});
