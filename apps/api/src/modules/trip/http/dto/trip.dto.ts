import { z } from 'zod';

export const requestTripSchema = z.object({
  riderId: z.string().uuid(),
});
export type RequestTripDto = z.infer<typeof requestTripSchema>;
