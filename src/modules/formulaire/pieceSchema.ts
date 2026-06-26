import { z } from 'zod';

export const pieceSchema = z.object({
  affaire_id: z.string().min(1),
  type: z.string().min(1),
  ref1: z.string().optional(),
  ref2: z.string().optional(),
  designation: z.string().optional(),
  matiere_code: z.string().optional(),
  section_finie: z.string().optional(),
  nb: z.number().min(0),
  geometrie: z.string().optional(),
  dimensions: z.record(z.string(), z.unknown()).optional(),
  prix: z.number().optional(),
  unite: z.string().optional(),
  pourcent_chute: z.number().int().min(0),
});

export type PieceInput = z.infer<typeof pieceSchema>;
