import { z } from 'zod';

export const clientSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  type: z.string().optional(),
  ville: z.string().optional(),
  contact: z.string().optional(),
  tel: z.string().optional(),
  email: z.union([z.email('Email invalide'), z.literal('')]).optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
