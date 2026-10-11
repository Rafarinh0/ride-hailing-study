import { SimDriver, step } from './driver';
import { Area } from './geo';
import { Rng } from './random';

export interface Reading {
  driverId: string;
  lat: number;
  lng: number;
  recordedAt: Date;
}

/** Manda uma leitura. Lanca erro se o servico recusar ou nao responder. */
export type Sender = (reading: Reading) => Promise<void>;

/** Contadores da janela atual. Zerados a cada relatorio. */
export interface Stats {
  ok: number;
  failed: number;
  /** Envio pulado porque o anterior do mesmo motorista ainda nao tinha voltado. */
  skipped: number;
  totalLatencyMs: number;
}

export const emptyStats = (): Stats => ({ ok: 0, failed: 0, skipped: 0, totalLatencyMs: 0 });

/**
 * Um motorista do simulador. Cada `tick` anda o equivalente a um intervalo e manda a
 * posicao. Nunca ha mais de um envio dele em voo: se o anterior nao voltou, este e
 * pulado (o carro anda mesmo assim). Assim um servico lento nao acumula requisicoes.
 */
export function driverLoop(initial: SimDriver, deps: { area: Area; intervalMs: number; rng: Rng; send: Sender; stats: Stats; now?: () => Date }) {
  const now = deps.now ?? (() => new Date());
  let driver = initial;
  let inFlight = false;

  return {
    get position(): SimDriver {
      return driver;
    },

    tick(): void {
      driver = step(driver, deps.intervalMs / 1000, deps.area, deps.rng);
      if (inFlight) {
        deps.stats.skipped++;
        return;
      }

      inFlight = true;
      const startedAt = performance.now();
      deps
        .send({ driverId: driver.id, lat: driver.lat, lng: driver.lng, recordedAt: now() })
        .then(
          () => {
            deps.stats.ok++;
            deps.stats.totalLatencyMs += performance.now() - startedAt;
          },
          () => {
            deps.stats.failed++;
          },
        )
        .finally(() => {
          inFlight = false;
        });
    },
  };
}
