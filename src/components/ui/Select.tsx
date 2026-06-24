import { forwardRef, type SelectHTMLAttributes } from 'react';
import { C } from '../../lib/theme';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  return (
    <select
      {...props}
      ref={ref}
      className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${props.className ?? ''}`}
      style={{ borderColor: C.border, color: C.text, backgroundColor: C.bg, ...props.style }}
    />
  );
});
