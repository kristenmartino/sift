import { fireEvent, render, screen } from '@testing-library/react';
import FeedControls from '@/components/FeedControls';

it('discloses mobile controls and offers a complete reset with selection context', () => {
  const onOrder = jest.fn(), onWindow = jest.fn(), onFormat = jest.fn();
  render(<FeedControls order='latest' window='day' format='opinion' total={70} visible={3} onOrder={onOrder} onWindow={onWindow} onFormat={onFormat} />);
  expect(screen.getByText('Latest · Past 24 hours · Includes opinion')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('3 of 70 stories');
  const button = screen.getByRole('button', { name: /Filters/ });
  expect(button).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(button);
  expect(button).toHaveAttribute('aria-expanded', 'true');
  fireEvent.change(screen.getByLabelText('Feed order'), { target: { value: 'recommended' } });
  expect(onOrder).toHaveBeenCalledWith('recommended');
  fireEvent.change(screen.getByLabelText('Publication date filter'), { target: { value: 'all' } });
  expect(onWindow).toHaveBeenCalledWith('all');
  fireEvent.change(screen.getByLabelText('Story format filter'), { target: { value: 'video' } });
  expect(onFormat).toHaveBeenCalledWith('video');
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(onOrder).toHaveBeenLastCalledWith('recommended');
  expect(onWindow).toHaveBeenLastCalledWith('all');
  expect(onFormat).toHaveBeenLastCalledWith('all');
});

it('states the loaded pool rather than promising a complete news archive', () => {
  render(<FeedControls order='recommended' window='all' format='all' total={70} visible={70} onOrder={jest.fn()} onWindow={jest.fn()} onFormat={jest.fn()} />);
  expect(screen.getByRole('status')).toHaveTextContent('70 stories in this view');
  expect(screen.queryByRole('button', { name: 'Reset filters' })).not.toBeInTheDocument();
});
