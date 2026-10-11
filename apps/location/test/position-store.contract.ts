import { expect, it } from 'vitest';
import { driverPosition } from '../src/domain/position';
import { PositionStore } from '../src/ports/position-store';

const NOW = new Date('2026-01-01T12:00:00Z');
const at = (secondsAgo: number) => new Date(NOW.getTime() - secondsAgo * 1000);

export const reading = (driverId: string, lat: number, secondsAgo: number) =>
  driverPosition({ driverId, lat, lng: -46.6, recordedAt: at(secondsAgo) }, NOW);

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
}
