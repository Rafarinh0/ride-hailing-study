import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { DriverPosition } from './domain/position';
import { PositionStore } from './ports/position-store';

const DRIVER = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-01-01T12:00:00Z');

/** Store falso: so guarda. A regra "mais nova vence" e testada no store real. */
class FakeStore implements PositionStore {
  saved: DriverPosition[] = [];
  async save(reading: DriverPosition) {
    this.saved.push(reading);
    return true;
  }
  async find(driverId: string) {
    return this.saved.filter((r) => r.driverId === driverId).at(-1) ?? null;
  }
}

describe('location HTTP', () => {
  let store: FakeStore;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    store = new FakeStore();
    app = buildApp({ store, now: () => NOW });
  });

  // inject: o Fastify processa a request em memoria, sem abrir porta.
  const post = (payload: unknown, id = DRIVER) =>
    app.inject({ method: 'POST', url: `/drivers/${id}/location`, payload: payload as object });

  it('grava a leitura e devolve 204', async () => {
    const res = await post({ lat: -23.55, lng: -46.63, recordedAt: '2026-01-01T11:59:58Z' });
    expect(res.statusCode).toBe(204);
    expect(store.saved[0]).toMatchObject({ driverId: DRIVER, position: { lat: -23.55, lng: -46.63 } });
  });

  it('GET devolve a ultima posicao, e 404 sem posicao', async () => {
    await post({ lat: 1, lng: 2, recordedAt: '2026-01-01T11:59:58Z' });
    const found = await app.inject({ method: 'GET', url: `/drivers/${DRIVER}/location` });
    expect(found.json()).toMatchObject({ driverId: DRIVER, lat: 1, lng: 2 });

    const missing = await app.inject({ method: 'GET', url: '/drivers/99999999-9999-4999-8999-999999999999/location' });
    expect(missing.statusCode).toBe(404);
  });

  it.each([
    ['latitude impossivel', { lat: 91, lng: 0, recordedAt: '2026-01-01T11:59:58Z' }, 'InvalidPositionError'],
    ['leitura no futuro', { lat: 0, lng: 0, recordedAt: '2026-01-01T12:05:00Z' }, 'InvalidPositionError'],
    ['data mal formada', { lat: 0, lng: 0, recordedAt: 'ontem' }, 'ValidationError'],
    ['lat como texto', { lat: '1', lng: 0, recordedAt: '2026-01-01T11:59:58Z' }, 'ValidationError'],
  ])('%s -> 400', async (_label, payload, error) => {
    const res = await post(payload);
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe(error);
    expect(store.saved).toHaveLength(0);
  });

  it('id que nao e uuid -> 400', async () => {
    expect((await post({ lat: 0, lng: 0, recordedAt: '2026-01-01T11:59:58Z' }, 'abc')).statusCode).toBe(400);
  });
});
