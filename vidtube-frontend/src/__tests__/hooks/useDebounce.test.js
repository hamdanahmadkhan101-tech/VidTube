import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebounce from '../../hooks/useDebounce.js';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    act(() => {
      rerender({ value: 'updated', delay: 500 });
    });
    
    // Should still be initial before delay
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should now be updated after delay
    expect(result.current).toBe('updated');
  });

  it('should use custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'start', delay: 1000 } }
    );

    act(() => {
      rerender({ value: 'end', delay: 1000 });
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // Should still be start after 500ms (delay is 1000ms)
    expect(result.current).toBe('start');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should now be end after full 1000ms delay
    expect(result.current).toBe('end');
  });
});
