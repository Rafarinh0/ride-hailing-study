import { z } from 'zod';

// TODO(dominio): descreva os payloads das transicoes da corrida.
export const requestTripSchema = z.object({});
export type RequestTripDto = z.infer<typeof requestTripSchema>;
