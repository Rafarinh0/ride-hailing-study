import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3001),
  // Conexoes simultaneas com o Postgres. Botao de calibragem: o certo depende da
  // maquina e da carga, e so se descobre medindo (Etapa 2, Milestone 3).
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
