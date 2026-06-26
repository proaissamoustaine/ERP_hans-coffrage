import { C } from '../../lib/theme';

export function ProgressBar({
  value,
  height = 4,
  color = C.accent,
}: {
  value: number;
  height?: number;
  color?: string;
}) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ backgroundColor: C.border, height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}
