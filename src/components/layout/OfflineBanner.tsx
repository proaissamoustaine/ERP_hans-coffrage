// src/components/layout/OfflineBanner.tsx
import { useIsMutating } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { C } from '../../lib/theme';
import { useOnlineStatus } from '../../lib/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const enAttente = useIsMutating(); // mutations en cours/en pause
  if (online) return null;
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white"
      style={{ backgroundColor: C.danger }}
      role="status"
    >
      <WifiOff size={16} />
      <span>
        Hors ligne
        {enAttente > 0 ? ` — ${enAttente} opération${enAttente > 1 ? 's' : ''} en attente` : ''}
      </span>
    </div>
  );
}
