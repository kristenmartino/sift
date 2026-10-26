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

it('does not promote an old saved comparison as the current demonstration', () => {
  render(<ComparisonDemo example={example} />);
  expect(screen.getByText(/No recent, source-accounted saved comparison is available/)).toBeInTheDocument();
  expect(screen.queryByText(/Generated August 11, 2025/)).not.toBeInTheDocument();
});
it('labels a recent source-accounted comparison with its full date', () => {
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2025-08-12T00:30:00Z'));
  render(<ComparisonDemo example={example} />);
  expect(screen.getByText(/Example comparison/)).toBeInTheDocument();
  expect(screen.getByText(/Generated August 11, 2025/)).toBeInTheDocument();
  jest.restoreAllMocks();
});

it('explains the process when there is no eligible saved comparison', () => {
  render(<ComparisonDemo example={null} />);
  expect(screen.getByText(/No recent, source-accounted saved comparison is available/)).toBeInTheDocument();
  expect(screen.queryByText(/Generated/)).not.toBeInTheDocument();
});

it('does not present a legacy example as verified agreement', () => {
  render(<ComparisonDemo example={{ ...example, source_provenance_version: undefined }} />);
  expect(screen.getByText(/No recent, source-accounted saved comparison is available/)).toBeInTheDocument();
  expect(screen.queryByText(/Reported by/)).not.toBeInTheDocument();
});
