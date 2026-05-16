import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelative, formatClock, isSameDay, formatGroupKey } from '../utils/formatTime';

describe('formatTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isSameDay', () => {
    it('returns true for same day', () => {
      expect(isSameDay(new Date('2025-01-15T10:00:00'), new Date('2025-01-15T23:59:59'))).toBe(true);
    });

    it('returns false for different days', () => {
      expect(isSameDay(new Date('2025-01-15'), new Date('2025-01-16'))).toBe(false);
    });

    it('returns false for different years', () => {
      expect(isSameDay(new Date('2024-01-15'), new Date('2025-01-15'))).toBe(false);
    });
  });

  describe('formatRelative', () => {
    it('returns "just now" for < 60 seconds ago', () => {
      const now = new Date('2025-06-01T12:00:00');
      vi.setSystemTime(now);
      expect(formatRelative(new Date('2025-06-01T11:59:30'))).toBe('just now');
    });

    it('returns "Xm ago" for minutes', () => {
      vi.setSystemTime(new Date('2025-06-01T12:05:00'));
      expect(formatRelative(new Date('2025-06-01T12:00:00'))).toBe('5m ago');
    });

    it('returns "Xh ago" for hours', () => {
      vi.setSystemTime(new Date('2025-06-01T15:00:00'));
      expect(formatRelative(new Date('2025-06-01T12:00:00'))).toBe('3h ago');
    });

    it('returns "Yesterday" for previous day', () => {
      vi.setSystemTime(new Date('2025-06-02T12:00:00'));
      expect(formatRelative(new Date('2025-06-01T12:00:00'))).toBe('Yesterday');
    });

    it('returns formatted date for same year', () => {
      vi.setSystemTime(new Date('2025-06-10T12:00:00'));
      // Respects en-GB locale: "Sun, 1 Jun"
      const result = formatRelative(new Date('2025-06-01T12:00:00'));
      expect(result).toContain('Jun');
      expect(result).toContain('1');
    });

    it('returns formatted date with year for previous year', () => {
      vi.setSystemTime(new Date('2025-06-01T12:00:00'));
      const result = formatRelative(new Date('2024-01-15T12:00:00'));
      expect(result).toContain('2024');
    });
  });

  describe('formatClock', () => {
    it('returns 24h time format', () => {
      // id-ID locale, hour12: false
      const result = formatClock(new Date('2025-06-01T14:30:00'));
      expect(result).toBe('14.30');
    });
  });

  describe('formatGroupKey', () => {
    it('returns "Today" for current day', () => {
      vi.setSystemTime(new Date('2025-06-01T12:00:00'));
      expect(formatGroupKey(new Date('2025-06-01T08:00:00'))).toBe('Today');
    });

    it('returns "Yesterday" for previous day', () => {
      vi.setSystemTime(new Date('2025-06-02T12:00:00'));
      expect(formatGroupKey(new Date('2025-06-01T18:00:00'))).toBe('Yesterday');
    });

    it('returns locale date string for older dates', () => {
      vi.setSystemTime(new Date('2025-06-05T12:00:00'));
      const result = formatGroupKey(new Date('2025-06-01T12:00:00'));
      expect(result).toContain('Minggu');
      expect(result).toContain('Juni');
    });
  });
});
