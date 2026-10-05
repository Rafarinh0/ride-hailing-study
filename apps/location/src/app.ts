import Fastify, { FastifyInstance } from 'fastify';
import { z, ZodError } from 'zod';
import { InvalidPositionError } from './domain/errors';
import { driverPosition } from './domain/position';
import { PositionStore } from './ports/position-store';

const params = z.object({ id: z.string().uuid() });

const body = z.object({
  lat: z.number(),
  lng: z.number(),
  recordedAt: z
    .string()
    .datetime({ offset: true })
    .transform((s) => new Date(s)),
});

/**
 * Servico de caminho quente: recebe a posicao de cada motorista a cada poucos
 * segundos. Por isso Fastify (menos overhead por request que o Nest) e nenhuma
 * camada de aplicacao: a rota valida, monta o dado de dominio e chama a porta.
 * Quando houver logica de verdade (publicar evento, Etapa 3), ela ganha um use case.
 *
 * `buildApp` recebe as dependencias, em vez de cria-las: o teste passa um store
 * falso, o main.ts passa o do Postgres.
 */
export function buildApp(deps: { store: PositionStore; now?: () => Date }): FastifyInstance {
  const now = deps.now ?? (() => new Date());
  const app = Fastify({ logger: false });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'ValidationError', issues: error.issues });
    }
    if (error instanceof InvalidPositionError) {
      return reply.code(400).send({ error: error.name, message: error.message });
    }
    return reply.send(error);
  });

  // 204 mesmo quando a leitura e ignorada por ser atrasada: para o celular nao ha
  // nada a fazer, a posicao mais nova ja esta guardada.
  app.post('/drivers/:id/location', async (request, reply) => {
    const { id } = params.parse(request.params);
    const { lat, lng, recordedAt } = body.parse(request.body);
    await deps.store.save(driverPosition({ driverId: id, lat, lng, recordedAt }, now()));
    return reply.code(204).send();
  });

  app.get('/drivers/:id/location', async (request, reply) => {
    const { id } = params.parse(request.params);
    const found = await deps.store.find(id);
    if (!found) {
      return reply.code(404).send({ error: 'PositionNotFound', message: `sem posicao para o motorista ${id}` });
    }
    return { driverId: found.driverId, lat: found.position.lat, lng: found.position.lng, recordedAt: found.recordedAt };
  });

  return app;
}
