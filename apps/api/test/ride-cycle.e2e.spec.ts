import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { startPostgres } from './postgres';

/**
 * Criterio de pronto da Etapa 1: o ciclo completo da corrida, do cadastro ate a
 * cobranca aparecer no ledger, pela API de verdade. Sobe o AppModule real (DI do
 * Nest, rotas, pipes Zod, filtro de erros, evento trip.finished) contra um Postgres
 * real. Nada e montado a mao: se a fiacao quebrar, este teste quebra.
 *
 * E um teste so, e lento (segundos), de proposito: o topo da piramide.
 */
describe('ciclo completo da corrida (e2e)', () => {
  let pg: Awaited<ReturnType<typeof startPostgres>>;
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    pg = await startPostgres(); // ja aplica as migrations
    process.env.DATABASE_URL = pg.container.getConnectionUri();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0); // porta livre qualquer
    base = (await app.getUrl()).replace('[::1]', 'localhost');
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await pg?.stop();
  });

  async function call(method: 'GET' | 'POST', path: string, body?: unknown) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  }

  it('cadastro -> motorista online -> corrida -> embarque -> fim -> cobranca no ledger', async () => {
    // 1. Contas (identity)
    const rider = await call('POST', '/identity/riders', { name: 'Ana', email: 'ana@example.com', password: 'segredo123' });
    expect(rider.status).toBe(201);
    const driver = await call('POST', '/identity/drivers', { name: 'Bia', email: 'bia@example.com', password: 'segredo123' });
    expect(driver.status).toBe(201);

    const login = await call('POST', '/identity/drivers/login', { email: 'bia@example.com', password: 'segredo123' });
    expect(login.body).toEqual({ id: driver.body.id, role: 'driver' });

    // 2. Despacho (trip): o motorista fica disponivel e o pedido ja sai aceito
    expect((await call('POST', `/drivers/${driver.body.id}/online`)).status).toBe(204);

    const trip = await call('POST', '/trips', { riderId: rider.body.id });
    expect(trip.status).toBe(201);
    expect(trip.body).toMatchObject({ status: 'accepted', riderId: rider.body.id, driverId: driver.body.id });
    const tripId: string = trip.body.id;

    // Sem corrida finalizada, nao ha cobranca. Confere o ERRO, nao so o 404: uma
    // rota inexistente tambem responde 404.
    const noCharge = await call('GET', `/payments/trips/${tripId}`);
    expect(noCharge.status).toBe(404);
    expect(noCharge.body.error).toBe('ChargeNotFoundError');

    // 3. Embarque e fim da viagem
    expect((await call('POST', `/trips/${tripId}/start`)).body.status).toBe('in_progress');
    expect((await call('POST', `/trips/${tripId}/finish`)).body.status).toBe('finished');

    // 4. Cobranca (payment), gerada pelo evento trip.finished
    const charge = await call('GET', `/payments/trips/${tripId}`);
    expect(charge.status).toBe(200);
    expect(charge.body.amountCents).toBe(550); // bandeirada R$ 5,00 + 1 minuto
    expect(charge.body.entries).toEqual([
      { account: 'rider', accountId: rider.body.id, amountCents: -550 },
      { account: 'driver', accountId: driver.body.id, amountCents: 440 },
      { account: 'platform', accountId: null, amountCents: 110 },
    ]);

    // 5. O motorista voltou para a fila: o proximo pedido e dele
    const next = await call('POST', '/trips', { riderId: rider.body.id });
    expect(next.body).toMatchObject({ status: 'accepted', driverId: driver.body.id });
  });

  it('as regras do dominio chegam ate o cliente como status HTTP', async () => {
    const rider = await call('POST', '/identity/riders', { name: 'Caio', email: 'caio@example.com', password: 'segredo123' });

    // Finalizar sem ter embarcado: conflito com o estado (409). Vale com ou sem
    // motorista atribuido, entao o teste nao depende do estado da fila que o
    // teste anterior deixou.
    const trip = await call('POST', '/trips', { riderId: rider.body.id });
    const early = await call('POST', `/trips/${trip.body.id}/finish`);
    expect(early.status).toBe(409);
    expect(early.body.error).toBe('InvalidTripTransitionError');

    // Email repetido: 409. Payload invalido: 400.
    expect((await call('POST', '/identity/riders', { name: 'X', email: 'CAIO@example.com', password: 'segredo123' })).status).toBe(409);
    expect((await call('POST', '/trips', { riderId: 'nao-e-uuid' })).status).toBe(400);
  });
});
