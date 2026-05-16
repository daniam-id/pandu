import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Timestamp } from 'firebase/firestore';
import { formatTime } from '../utils/formatTime';

function ts(secondsAgo: number): Timestamp {
  const seconds = Math.floor((Date.now() - secondsAgo * 1000) / 1000);
  return {
    seconds,
    nanoseconds: 0,
    toMillis: () => seconds * 1000,
    toDate: () => new Date(seconds * 1000),
    isEqual: () => false,
    toJSON: () => ({ seconds, nanoseconds: 0 }),
  } as unknown as Timestamp;
}

describe('formatTime (driver)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "-" for undefined', () => {
    expect(formatTime(undefined)).toBe('-');
  });

  it('returns "Baru saja" for < 10 seconds', () => {
    // Use real system time — the ts helper calculates secondsAgo from Date.now()
    const recent = ts(5);
    expect(formatTime(recent)).toBe('Baru saja');
  });

  it('returns "X detik lalu" for 10–59 seconds', () => {
    const t = ts(30);
    const result = formatTime(t);
    // May be "30 detik lalu" or "29 detik lalu" due to timing — check pattern
    expect(result).toMatch(/^\d+ detik lalu$/);
  });

  it('returns "X menit lalu" for 1–59 minutes', () => {
    const t = ts(90); // 1.5 minutes ago
    const result = formatTime(t);
    expect(result).toMatch(/^\d+ menit lalu$/);
  });

  it('returns "X jam lalu" for 1–23 hours', () => {
    const t = ts(3600 * 5); // 5 hours ago
    const result = formatTime(t);
    expect(result).toMatch(/^\d+ jam lalu$/);
  });

  it('returns "X hari lalu" for 1–6 days', () => {
    const t = ts(3600 * 24 * 2); // 2 days ago
    const result = formatTime(t);
    expect(result).toMatch(/^\d+ hari lalu$/);
  });

  it('returns "X minggu lalu" for 7+ days', () => {
    const t = ts(3600 * 24 * 14); // 2 weeks ago
    const result = formatTime(t);
    expect(result).toMatch(/^\d+ minggu lalu$/);
  });
});
