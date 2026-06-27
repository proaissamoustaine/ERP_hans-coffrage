// src/components/layout/OfflineBanner.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { OfflineBanner } from './OfflineBanner';

afterEach(() => onlineManager.setOnline(true));

function renderBanner() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <OfflineBanner />
    </QueryClientProvider>,
  );
}

describe('OfflineBanner', () => {
  it('cachée quand en ligne', () => {
    act(() => onlineManager.setOnline(true));
    renderBanner();
    expect(screen.queryByText(/Hors ligne/i)).toBeNull();
  });
  it('affichée quand hors ligne', () => {
    renderBanner();
    act(() => onlineManager.setOnline(false));
    expect(screen.getByText(/Hors ligne/i)).toBeInTheDocument();
  });
});
