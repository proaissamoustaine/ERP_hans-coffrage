import type { ComponentType, ButtonHTMLAttributes } from 'react';
import { C } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'danger';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ComponentType<{ size?: number }>;
};

const styles: Record<Variant, { backgroundColor?: string; color: string; border?: string }> = {
  primary: { backgroundColor: C.primary, color: '#ffffff' },
  secondary: { backgroundColor: 'transparent', color: C.primary, border: `1.5px solid ${C.primary}` },
  danger: { backgroundColor: C.danger, color: '#ffffff' },
};

export function Btn({ variant = 'primary', icon: Icon, children, className = '', ...rest }: BtnProps) {
  const s = styles[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${className}`}
      style={s}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
