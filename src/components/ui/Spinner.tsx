import { C } from '../../lib/theme';

export function Spinner() {
  return (
    <div
      className="h-8 w-8 animate-spin rounded-full border-4"
      style={{ borderColor: C.border, borderTopColor: 'transparent' }}
      role="status"
      aria-label="Chargement…"
    />
  );
}
