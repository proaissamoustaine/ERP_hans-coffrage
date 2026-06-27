// src/lib/useOnlineStatus.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { useOnlineStatus } from './useOnlineStatus';

afterEach(() => onlineManager.setOnline(true));

describe('useOnlineStatus', () => {
  it('reflète onlineManager', () => {
    act(() => onlineManager.setOnline(true));
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
    act(() => onlineManager.setOnline(false));
    expect(result.current).toBe(false);
  });
});
