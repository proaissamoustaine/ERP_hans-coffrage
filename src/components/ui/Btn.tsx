import type { ComponentType, ButtonHTMLAttributes } from 'react';
import { C } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ComponentType<{ size?: number }>;
  size?: Size;
};

const variantStyles: Record<Variant, { bg: string; color: string; border: string }> = {
  primary:   { bg: C.primary,     color: 'white',   border: C.primary },
  secondary: { bg: 'white',       color: C.text,    border: C.border },
  accent:    { bg: C.accent,      color: 'white',   border: C.accent },
  ghost:     { bg: 'transparent', color: C.text,    border: 'transparent' },
  danger:    { bg: C.danger,      color: 'white',   border: C.danger },
};

export function Btn({
  variant = 'primary',
  icon: Icon,
  size = 'md',
  children,
  className = '',
  disabled,
  ...rest
}: BtnProps) {
  const s = variantStyles[variant];
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`${sizing} rounded font-semibold flex items-center gap-1.5 border transition-all hover:opacity-90 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children}
    </button>
  );
}
