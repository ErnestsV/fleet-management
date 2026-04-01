import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/lib/utils/format';

describe('format utilities', () => {
  it('formats bare YYYY-MM-DD values without timezone shifting', () => {
    expect(formatDate('2026-04-01')).toBe('01 Apr 2026');
  });

  it('formats datetime values for display', () => {
    expect(formatDateTime('2026-04-01T15:30:00')).toContain('01/04/2026');
  });

  it('formats numbers with units', () => {
    expect(formatNumber(12500, 'km')).toBe('12,500 km');
  });

  it('formats currency with fallback currency code', () => {
    expect(formatCurrency(249.99, 'EUR')).toContain('249.99');
  });
});
