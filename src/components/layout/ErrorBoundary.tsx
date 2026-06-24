import { Component, type ReactNode, type ErrorInfo } from 'react';
import { C } from '../../lib/theme';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: C.bgSoft }}
        >
          <div
            className="max-w-md w-full rounded-2xl p-10 text-center shadow-lg"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
          >
            <p className="text-xl font-semibold" style={{ color: C.danger }}>
              Une erreur est survenue
            </p>
            <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
              Veuillez recharger la page pour réessayer.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition"
              style={{ backgroundColor: C.primary }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
