import { Card } from '../components/ui/Card';
import { C } from '../lib/theme';

export default function ComingSoonPage() {
  return (
    <div className="flex items-center justify-center min-h-full py-12">
      <Card className="text-center max-w-sm w-full">
        <p className="text-lg font-semibold" style={{ color: C.text }}>
          Bientôt disponible
        </p>
        <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
          Cette section est en cours de développement.
        </p>
      </Card>
    </div>
  );
}
