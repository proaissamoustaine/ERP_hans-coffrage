import type { ReactNode } from 'react';
import { C } from '../../lib/theme';

type CardProps = {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
};

export function Card({ children, className = '', noPadding }: CardProps) {
  // Allow legacy className="... p-0 ..." to suppress default padding
  const hasPaddingOverride = /\bp-0\b/.test(className);
  const addPadding = !noPadding && !hasPaddingOverride;
  return (
    <div
      className={`bg-white border rounded-lg ${addPadding ? 'p-5' : ''} ${className}`}
      style={{ borderColor: C.border }}
    >
      {children}
    </div>
  );
}
