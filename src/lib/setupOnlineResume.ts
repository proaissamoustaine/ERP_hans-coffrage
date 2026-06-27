// src/lib/setupOnlineResume.ts
import type { QueryClient } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';

/**
 * S'abonne à l'état réseau et rejoue explicitement les mutations mises en file
 * dès que la connexion revient — sans attendre un reload. Garantit le cas atelier
 * courant : le wifi tombe puis revient alors que l'app reste ouverte.
 * Retourne la fonction de désabonnement.
 */
export function setupOnlineResume(qc: QueryClient): () => void {
  return onlineManager.subscribe((online: boolean) => {
    if (online) {
      void qc.resumePausedMutations();
    }
  });
}
