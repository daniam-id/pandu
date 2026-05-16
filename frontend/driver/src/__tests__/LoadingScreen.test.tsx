import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from '../components/LoadingScreen';

describe('LoadingScreen', () => {
  it('renders default message "Memuat..."', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Memuat...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingScreen message="Menghitung rute..." />);
    expect(screen.getByText('Menghitung rute...')).toBeInTheDocument();
  });

  it('renders a spinning loader icon', () => {
    const { container } = render(<LoadingScreen />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
