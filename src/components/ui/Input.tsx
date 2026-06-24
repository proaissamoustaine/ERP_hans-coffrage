import { forwardRef, type InputHTMLAttributes } from 'react';
import { C } from '../../lib/theme';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  return (
    <input
      {...props}
      ref={ref}
      className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${props.className ?? ''}`}
      style={{ borderColor: C.border, color: C.text, backgroundColor: C.bg, ...props.style }}
    />
  );
});
