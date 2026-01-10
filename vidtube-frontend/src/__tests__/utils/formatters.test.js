import { describe, it, expect } from 'vitest';
import { formatDuration, formatViews } from '../../utils/formatters.js';

describe('Formatters', () => {
  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3665)).toBe('61:05'); // Format is MM:SS, not HH:MM:SS
    });

    it('handles NaN and invalid values', () => {
      expect(formatDuration(NaN)).toBe('0:00');
      expect(formatDuration(null)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
    });
  });

  describe('formatViews', () => {
    it('formats view counts correctly', () => {
      expect(formatViews(0)).toBe('0');
      expect(formatViews(999)).toBe('999');
      expect(formatViews(1000)).toBe('1.0K'); // Implementation uses .toFixed(1)
      expect(formatViews(1500)).toBe('1.5K');
      expect(formatViews(1000000)).toBe('1.0M'); // Implementation uses .toFixed(1)
      expect(formatViews(1500000)).toBe('1.5M');
    });
  });

});
