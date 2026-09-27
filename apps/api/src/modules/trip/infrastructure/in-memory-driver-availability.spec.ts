import { beforeEach, describe, expect, it } from 'vitest';
import { DriverBusyError } from '../domain/errors';
import { InMemoryDriverAvailability } from './in-memory-driver-availability';

describe('InMemoryDriverAvailability', () => {
  let availability: InMemoryDriverAvailability;

  beforeEach(() => {
    availability = new InMemoryDriverAvailability();
  });

  it('lista os livres na ordem em que ficaram online', async () => {
    await availability.goOnline('d1');
    await availability.goOnline('d2');
    expect(await availability.listAvailable()).toEqual(['d1', 'd2']);
  });

  it('claim reserva uma vez so', async () => {
    await availability.goOnline('d1');
    expect(await availability.claim('d1', 't1')).toBe(true);
    expect(await availability.claim('d1', 't2')).toBe(false);
    expect(await availability.listAvailable()).toEqual([]);
  });

  it('claim de motorista offline falha', async () => {
    expect(await availability.claim('ninguem', 't1')).toBe(false);
  });

  it('release devolve o motorista para o FIM da fila', async () => {
    await availability.goOnline('d1');
    await availability.goOnline('d2');
    await availability.claim('d1', 't1');
    await availability.release('d1', 't1');
    expect(await availability.listAvailable()).toEqual(['d2', 'd1']);
  });

  it('release de outra corrida nao solta o motorista', async () => {
    await availability.goOnline('d1');
    await availability.claim('d1', 't2');
    await availability.release('d1', 't1');
    expect(await availability.listAvailable()).toEqual([]);
  });

  it('motorista em corrida nao fica offline', async () => {
    await availability.goOnline('d1');
    await availability.claim('d1', 't1');
    await expect(availability.goOffline('d1')).rejects.toThrow(DriverBusyError);
  });

  it('ficar online de novo durante a corrida nao o libera', async () => {
    await availability.goOnline('d1');
    await availability.claim('d1', 't1');
    await availability.goOnline('d1');
    expect(await availability.listAvailable()).toEqual([]);
  });

  it('offline tira da fila', async () => {
    await availability.goOnline('d1');
    await availability.goOffline('d1');
    expect(await availability.listAvailable()).toEqual([]);
  });
});
