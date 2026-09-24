import { z } from 'zod';

// TODO(dominio): descreva o payload da cobranca.
export const chargeSchema = z.object({});
export type ChargeDto = z.infer<typeof chargeSchema>;
