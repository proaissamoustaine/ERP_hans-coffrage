import type { ReactNode } from 'react';
import { C } from '../../lib/theme';

type FieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  full?: boolean;
  children: ReactNode;
};

export function Field({ label, error, required, hint, full, children }: FieldProps) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label
        className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1"
        style={{ color: C.textMuted }}
      >
        {label}
        {required && <span style={{ color: C.danger }}>*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && (
        <div className="text-[10px] mt-1" style={{ color: C.textLight }}>
          {hint}
        </div>
      )}
      {error && (
        <p className="text-xs mt-0.5" style={{ color: C.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
