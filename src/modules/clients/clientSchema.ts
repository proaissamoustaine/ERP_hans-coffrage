import { z } from 'zod';

export const clientSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  type: z.string().optional(),
  siret: z
    .union([z.string().regex(/^\d{14}$/, 'SIRET = 14 chiffres'), z.literal('')])
    .optional(),
  tva_intracom: z.string().optional(),
  pays: z.string().optional(),
  adresse: z.string().optional(),
  code_postal: z.string().optional(),
  ville: z.string().optional(),
  contact: z.string().optional(),
  tel: z.string().optional(),
  email: z.union([z.email('Email invalide'), z.literal('')]).optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
