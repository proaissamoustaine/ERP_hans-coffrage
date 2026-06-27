import { C } from '../../../lib/theme';

export function PrintView({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="print-overlay"
      style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 50, overflow: 'auto' }}
    >
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          gap: 8,
          padding: 12,
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.bgSoft,
        }}
      >
        <button
          onClick={() => window.print()}
          style={{ padding: '6px 12px', backgroundColor: C.primary, color: 'white', borderRadius: 6 }}
        >
          Imprimer
        </button>
        <button onClick={onClose} style={{ padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 6 }}>
          Fermer
        </button>
        <span style={{ alignSelf: 'center', fontWeight: 700 }}>{title}</span>
      </div>
      <div className="print-area">{children}</div>
    </div>
  );
}
