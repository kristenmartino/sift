import { fireEvent, render, screen } from '@testing-library/react';
import TermLookup from '@/components/term/TermLookup';
import TermIndex from '@/components/term/TermIndex';
import type { TermListItem } from '@/lib/types';

jest.mock('@/components/landing/LandingMasthead', () => function Masthead() { return <header />; });
const terms: TermListItem[] = [
  { slug: 'filibuster', term: 'Filibuster', category: 'congress', definition: 'Extended debate in the Senate.', definitionSource: 'https://senate.gov/definition', aliases: [], articleCount: 10, outletCount: 3, unnamedCount: 2, computedAt: '2026-08-18' },
  { slug: 'initial-public-offering', term: 'Initial Public Offering', category: 'business', definition: 'The first sale of shares to the public.', definitionSource: 'https://sec.gov/definition', aliases: ['IPO'], articleCount: 20, outletCount: 4, unnamedCount: 3, computedAt: '2026-08-20' },
];
it('finds a definition by abbreviation or its words and retains the original source', () => {
  render(<TermLookup terms={terms} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ipo' } });
  expect(screen.getByRole('status')).toHaveTextContent('1 matching term');
  expect(screen.getByRole('link', { name: /Initial Public Offering/ })).toHaveAttribute('href', '/term/initial-public-offering');
  expect(screen.getByRole('link', { name: /Definition source/ })).toHaveAttribute('href', 'https://sec.gov/definition');
  expect(screen.queryByText('Filibuster →')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'senate' } });
  expect(screen.getByText('Filibuster →')).toBeInTheDocument();
});
it('offers a no-match state and resets focus when cleared', () => {
  render(<TermLookup terms={terms} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unfindable' } });
  expect(screen.getByText(/No matching terms/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(screen.getByRole('searchbox')).toHaveFocus();
  expect(screen.getByRole('status')).toHaveTextContent('2 terms');
});
it('does not show a definition without its source and keeps unfamiliar categories', () => {
  render(<TermLookup terms={[{ ...terms[0], category: null, definitionSource: null }, { ...terms[1], category: 'markets' }]} />);
  expect(screen.queryByText('Extended debate in the Senate.')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Other' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'markets' })).toBeInTheDocument();
});
it('keeps dated historical measurements below lookup in a closed disclosure', () => {
  render(<TermIndex terms={terms} heldCount={1} />);
  const disclosure = screen.getByText('Sources and historical coverage measurements').closest('details');
  expect(disclosure).not.toHaveAttribute('open');
  expect(disclosure).toHaveTextContent('Counts measured 2026-08-18');
  expect(disclosure).toHaveTextContent('not counts of distinct stories');
  expect(screen.getByRole('searchbox')).toBeVisible();
});
it('handles an empty published glossary without a broken lookup', () => {
  render(<TermIndex terms={[]} heldCount={0} />);
  expect(screen.getByText('No terms are curated yet.')).toBeInTheDocument();
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
});
