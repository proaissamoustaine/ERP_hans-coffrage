import type { ComponentType, CSSProperties } from 'react';
import { C } from '../../lib/theme';

type KPIProps = {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  label: string;
  value: string;
  color?: string;
  sub?: string;
};

export function KPI({ icon: Icon, label, value, color = C.primary, sub }: KPIProps) {
  return (
    <div
      className="bg-white border rounded-lg p-5 transition-all hover:shadow-sm"
      style={{ borderColor: C.border }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div
        className="text-2xl font-bold mb-0.5"
        style={{ color: C.text, fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div
        className="text-[10px] uppercase tracking-[0.15em] font-semibold"
        style={{ color: C.textMuted }}
      >
        {label}
      </div>
      {sub && (
        <div className="text-[11px] mt-1" style={{ color: C.textLight }}>
          {sub}
        </div>
      )}
    </div>
  );
}
