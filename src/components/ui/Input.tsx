import { forwardRef, type InputHTMLAttributes } from 'react';
import { C } from '../../lib/theme';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const { className, style, ...rest } = props;
  return (
    <input
      {...rest}
      ref={ref}
      className={`w-full px-3 py-2 border rounded text-sm outline-none transition-colors ${className ?? ''}`}
      style={{ borderColor: C.border, backgroundColor: '#FFF8E1', ...style }}
    />
  );
});
