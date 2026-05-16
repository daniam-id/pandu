import { describe, it, expect } from 'vitest';
import { formatDistance } from '../utils/formatDistance';

describe('formatDistance', () => {
  it('returns "0 m" for negative values', () => {
    expect(formatDistance(-100)).toBe('0 m');
  });

  it('returns "0 m" for Infinity', () => {
    expect(formatDistance(Infinity)).toBe('0 m');
  });

  it('returns meters for values below 1000', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('returns km for values at or above 1000', () => {
    expect(formatDistance(1000)).toBe('1 km');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(2340)).toBe('2.3 km');
  });

  it('strips trailing .0 in km', () => {
    expect(formatDistance(2000)).toBe('2 km');
    expect(formatDistance(5000)).toBe('5 km');
  });
});
