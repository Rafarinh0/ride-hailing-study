import { expect, it } from 'vitest';
import { driverPosition, EARTH_RADIUS_M, Position } from '../src/domain/position';
import { PositionStore } from '../src/ports/position-store';

const NOW = new Date('2026-01-01T12:00:00Z');
const at = (secondsAgo: number) => new Date(NOW.getTime() - secondsAgo * 1000);

export const reading = (driverId: string, lat: number, secondsAgo: number, lng = -46.6) =>
  driverPosition({ driverId, lat, lng, recordedAt: at(secondsAgo) }, NOW);

// Busca por proximidade em Brasilia, longe dos pontos dos outros testes.
const CENTER = Position.create(-15.8, -47.9);
const METERS_PER_DEGREE = (EARTH_RADIUS_M * Math.PI) / 180;
/** Leitura `meters` ao norte (negativo: ao sul) de `center`, ao longo do meridiano. */
const near = (driverId: string, meters: number, secondsAgo = 10, center = CENTER) =>
  reading(driverId, center.lat + meters / METERS_PER_DEGREE, secondsAgo, center.lng);

/** O Redis arredonda as coordenadas (geohash): distancias batem ate ~2 m. */
const expectDistance = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThan(2);

/**
 * O que QUALQUER PositionStore precisa garantir. Cada implementacao chama esta funcao
 * no seu arquivo de teste: se as duas passam, quem usa a porta pode trocar uma pela
 * outra sem perceber (o L do SOLID, substituicao de Liskov).
 *
 * Coordenadas comparadas com toBeCloseTo(_, 5) (~1 m): o Redis GEO arredonda.
 */
export function positionStoreContract(getStore: () => PositionStore) {
  it('guarda a leitura e devolve a posicao e a hora', async () => {
    const id = '10000000-0000-4000-8000-000000000001';
    expect(await getStore().save(reading(id, -23.5, 30))).toBe(true);

    const found = (await getStore().find(id))!;
    expect(found.position.lat).toBeCloseTo(-23.5, 5);
    expect(found.position.lng).toBeCloseTo(-46.6, 5);
    expect(found.recordedAt).toEqual(at(30));
  });

  it('leitura mais nova substitui a anterior', async () => {
    const id = '10000000-0000-4000-8000-000000000002';
    await getStore().save(reading(id, -23.5, 30));
    expect(await getStore().save(reading(id, -23.6, 20))).toBe(true);
    expect((await getStore().find(id))!.position.lat).toBeCloseTo(-23.6, 5);
  });

  it('leitura atrasada (mais velha que a guardada) e ignorada', async () => {
    const id = '10000000-0000-4000-8000-000000000003';
    await getStore().save(reading(id, -10, 5));
    expect(await getStore().save(reading(id, -80, 15))).toBe(false);
    expect((await getStore().find(id))!.position.lat).toBeCloseTo(-10, 5);
  });

  it('leitura com a mesma hora da guardada nao sobrescreve', async () => {
    const id = '10000000-0000-4000-8000-000000000004';
    await getStore().save(reading(id, -10, 5));
    expect(await getStore().save(reading(id, -11, 5))).toBe(false);
  });

  it('find devolve null para motorista sem posicao', async () => {
    expect(await getStore().find('99999999-9999-4999-8999-999999999999')).toBeNull();
  });

  it('findNearby: so quem esta no raio, do mais perto ao mais longe, com a distancia', async () => {
    const ids = ['40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004'];
    await getStore().save(near(ids[0], 1_500));
    await getStore().save(near(ids[1], 100));
    await getStore().save(near(ids[2], -800)); // ao sul
    await getStore().save(near(ids[3], 3_000)); // fora do raio

    const found = await getStore().findNearby(CENTER, 2_000, 10);

    expect(found.map((d) => d.driverId)).toEqual([ids[1], ids[2], ids[0]]);
    expectDistance(found[0].distanceMeters, 100);
    expectDistance(found[1].distanceMeters, 800);
    expectDistance(found[2].distanceMeters, 1_500);
    expect(found[0].recordedAt).toEqual(at(10));

    // O limite corta nos mais proximos
    const two = await getStore().findNearby(CENTER, 2_000, 2);
    expect(two.map((d) => d.driverId)).toEqual([ids[1], ids[2]]);
  });

  it('findNearby: usa a posicao mais recente de cada motorista', async () => {
    const elsewhere = Position.create(-16.5, -47.9); // ~80 km do outro teste
    const id = '40000000-0000-4000-8000-000000000005';
    await getStore().save(near(id, 5_000, 20, elsewhere));
    await getStore().save(near(id, 50, 5, elsewhere)); // chegou perto

    const found = await getStore().findNearby(elsewhere, 2_000, 10);
    expect(found.map((d) => d.driverId)).toEqual([id]);
    expectDistance(found[0].distanceMeters, 50);
  });

  it('findNearby: ninguem no raio devolve lista vazia', async () => {
    expect(await getStore().findNearby(Position.create(-15.8, -30), 2_000, 10)).toEqual([]);
  });
}
