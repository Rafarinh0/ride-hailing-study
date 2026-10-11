import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    // Onde guardar as posicoes. As duas implementacoes passam no mesmo teste de
    // contrato. Redis por padrao, pela medicao do ADR 0005; Postgres fica para
    // repetir a comparacao.
    POSITION_STORE: z.enum(['postgres', 'redis']).default('redis'),
    DATABASE_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    // Conexoes simultaneas com o Postgres, POR PROCESSO. Botao de calibragem: o certo
    // depende da maquina e da carga, e so se descobre medindo.
    DB_POOL_MAX: z.coerce.number().int().positive().default(10),
    // Processos do servico. O Node executa JavaScript numa thread so: um processo usa
    // no maximo um nucleo. Varios processos dividem a mesma porta (modulo cluster).
    WORKERS: z.coerce.number().int().positive().default(1),
  })
  .refine((env) => env.POSITION_STORE !== 'postgres' || env.DATABASE_URL, {
    message: 'DATABASE_URL e obrigatoria com POSITION_STORE=postgres',
    path: ['DATABASE_URL'],
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
