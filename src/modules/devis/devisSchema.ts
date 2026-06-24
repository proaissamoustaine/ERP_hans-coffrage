import { z } from 'zod';

export const devisSchema = z.object({
  mode: z.enum([
    'coffrage',
    'prefa',
    'mannequin',
    'sateba',
    'vente',
    'usinage',
    'decor',
    'autre',
  ]),
  client_id: z.string().optional(),
  chantier: z.string().optional(),
  objet: z.string().optional(),
  total_ht: z.number().min(0, 'total_ht doit être ≥ 0'),
  frais_transport: z.number().min(0, 'frais_transport doit être ≥ 0').default(0),
});

export type DevisInput = z.infer<typeof devisSchema>;
