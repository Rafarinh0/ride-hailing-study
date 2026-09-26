import { describe, expect, it } from 'vitest';
import { InvalidTripTransitionError } from './errors';
import { Trip } from './trip';
import { TRIP_STATUSES, TripStatus } from './trip-status';

const RIDER = '11111111-1111-4111-8111-111111111111';
const DRIVER = '22222222-2222-4222-8222-222222222222';

/** Leva uma corrida nova ate `status` pelo caminho LEGAL (sem rehydrate). */
function tripIn(status: TripStatus): Trip {
  const trip = Trip.request(RIDER);
  const path: Record<TripStatus, (t: Trip) => void> = {
    requested: () => {},
    accepted: (t) => t.accept(DRIVER),
    in_progress: (t) => {
      t.accept(DRIVER);
      t.start();
    },
    finished: (t) => {
      t.accept(DRIVER);
      t.start();
      t.finish();
    },
    cancelled: (t) => t.cancel(),
  };
  path[status](trip);
  return trip;
}

const actions = {
  accept: (t: Trip) => t.accept(DRIVER),
  start: (t: Trip) => t.start(),
  finish: (t: Trip) => t.finish(),
  cancel: (t: Trip) => t.cancel(),
};
type Action = keyof typeof actions;

// Especificacao escrita a mao, INDEPENDENTE de TRIP_TRANSITIONS. Se o teste
// derivasse o esperado da propria tabela, passaria mesmo com a regra errada.
const expected: Record<TripStatus, Record<Action, TripStatus | 'throws'>> = {
  requested: { accept: 'accepted', start: 'throws', finish: 'throws', cancel: 'cancelled' },
  accepted: { accept: 'throws', start: 'in_progress', finish: 'throws', cancel: 'cancelled' },
  in_progress: { accept: 'throws', start: 'throws', finish: 'finished', cancel: 'throws' },
  finished: { accept: 'throws', start: 'throws', finish: 'throws', cancel: 'throws' },
  cancelled: { accept: 'throws', start: 'throws', finish: 'throws', cancel: 'throws' },
};

describe('Trip (maquina de estados)', () => {
  for (const from of TRIP_STATUSES) {
    for (const action of Object.keys(actions) as Action[]) {
      const outcome = expected[from][action];

      it(`${from} --${action}--> ${outcome}`, () => {
        const trip = tripIn(from);

        if (outcome === 'throws') {
          expect(() => actions[action](trip)).toThrow(InvalidTripTransitionError);
          expect(trip.status).toBe(from); // transicao ilegal nao muda nada
        } else {
          actions[action](trip);
          expect(trip.status).toBe(outcome);
        }
      });
    }
  }

  it('nasce solicitada, com o passageiro e sem motorista', () => {
    const trip = Trip.request(RIDER);
    expect(trip.status).toBe('requested');
    expect(trip.riderId).toBe(RIDER);
    expect(trip.driverId).toBeNull();
  });

  it('accept registra o motorista e o horario', () => {
    const trip = tripIn('accepted');
    expect(trip.driverId).toBe(DRIVER);
    expect(trip.toSnapshot().acceptedAt).toBeInstanceOf(Date);
  });

  it('accept ilegal nao sobrescreve o motorista ja atribuido', () => {
    const trip = tripIn('in_progress');
    expect(() => trip.accept('33333333-3333-4333-8333-333333333333')).toThrow(InvalidTripTransitionError);
    expect(trip.driverId).toBe(DRIVER);
  });

  it('o snapshot e uma copia: mexer nele nao altera a corrida', () => {
    const trip = Trip.request(RIDER);
    trip.toSnapshot().status = 'finished';
    expect(trip.status).toBe('requested');
  });
});
