import { forwardRef, type SelectHTMLAttributes } from 'react';
import { C } from '../../lib/theme';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  const { className, style, children, ...rest } = props;
  return (
    <select
      {...rest}
      ref={ref}
      className={`w-full px-3 py-2 border rounded text-sm outline-none bg-white ${className ?? ''}`}
      style={{ borderColor: C.border, ...style }}
    >
      {children}
    </select>
  );
});
