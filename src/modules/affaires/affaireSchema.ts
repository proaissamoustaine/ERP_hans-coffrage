import { z } from 'zod';

export const affaireSchema = z.object({
  mode: z.enum(['coffrage', 'prefa', 'mannequin', 'sateba', 'vente', 'usinage', 'decor', 'autre']),
  client_id: z.string().min(1, 'Client requis'),
  chantier: z.string().optional(),
  objet: z.string().optional(),
  total_ht: z.number().min(0),
  date_livraison: z.string().optional(),
});

export type AffaireInput = z.infer<typeof affaireSchema>;
