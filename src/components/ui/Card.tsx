import type { ReactNode } from 'react';
import { C } from '../../lib/theme';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl p-6 shadow-sm ${className}`}
      style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
    >
      {children}
    </div>
  );
}
