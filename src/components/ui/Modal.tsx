import type { ComponentType, ReactNode } from 'react';
import { X } from 'lucide-react';
import { C } from '../../lib/theme';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  children: ReactNode;
};

const widths: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'md',
  footer,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-start justify-between gap-3"
          style={{ borderColor: C.border, backgroundColor: C.primary }}
        >
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div
                className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Icon size={18} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-base text-white">{title}</h3>
              {subtitle && (
                <p className="text-xs mt-0.5" style={{ color: C.accent }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="px-5 py-3 border-t flex items-center justify-end gap-2 flex-wrap"
            style={{ borderColor: C.border, backgroundColor: C.bgSoft }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
