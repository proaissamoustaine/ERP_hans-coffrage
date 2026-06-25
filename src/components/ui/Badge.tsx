import type { ReactNode } from 'react';
import { C } from '../../lib/theme';

type BadgeProps = {
  children: ReactNode;
  color?: string;
  bg?: string;
  size?: 'sm' | 'md';
};

export function Badge({ children, color = 'white', bg = C.primary, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-semibold rounded uppercase tracking-wider ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
      style={{ color, backgroundColor: bg }}
    >
      {children}
    </span>
  );
}
