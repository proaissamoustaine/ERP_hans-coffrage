import type { ReactNode } from 'react';
import { C } from '../../lib/theme';

type FieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: C.text }}>
        {label}
        {required && (
          <span className="ml-1" style={{ color: C.danger }}>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: C.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
