import type { ReactNode } from 'react';
import { C } from '../../lib/theme';

type PageHeaderProps = {
  section?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ section, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 lg:mb-6">
      <div className="min-w-0">
        {section && (
          <div
            className="text-[10px] uppercase tracking-[0.25em] mb-1.5 font-semibold"
            style={{ color: C.accent }}
          >
            {section}
          </div>
        )}
        <h1
          className="text-xl lg:text-2xl font-bold"
          style={{ color: C.primary, fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs lg:text-sm mt-1" style={{ color: C.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2 flex-shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
