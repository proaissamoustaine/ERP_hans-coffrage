import type { ComponentType } from 'react';
import { Activity } from 'lucide-react';
import { C } from '../../lib/theme';

type StubProps = {
  title: string;
  description: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
};

export function Stub({ title, description, icon: Icon = Activity }: StubProps) {
  return (
    <div className="text-center py-20">
      <div
        className="inline-flex p-5 rounded-full mb-4"
        style={{ backgroundColor: C.bgSoft }}
      >
        <Icon size={32} style={{ color: C.primary }} strokeWidth={1.5} />
      </div>
      <h3
        className="text-lg font-bold mb-2"
        style={{ color: C.text, fontFamily: 'Georgia, serif' }}
      >
        {title}
      </h3>
      <p className="text-sm max-w-md mx-auto" style={{ color: C.textMuted }}>
        {description}
      </p>
      <div
        className="mt-6 inline-block px-3 py-1 rounded text-[10px] uppercase tracking-wider font-semibold"
        style={{ backgroundColor: C.accentSoft, color: '#8B6914' }}
      >
        Vue à compléter — phase 2
      </div>
    </div>
  );
}
