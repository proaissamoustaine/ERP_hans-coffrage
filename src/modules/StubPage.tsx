import { useLocation } from 'react-router-dom';
import { Stub } from '../components/ui/Stub';
import { findNavItem } from '../components/nav';

export default function StubPage() {
  const location = useLocation();
  const found = findNavItem(location.pathname);

  const title = found?.item.label ?? 'Module';
  const Icon = found?.item.icon;

  return (
    <Stub
      title={title}
      description="Ce module sera disponible prochainement."
      icon={Icon}
    />
  );
}
