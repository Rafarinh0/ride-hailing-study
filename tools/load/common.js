// Partes comuns dos scripts k6 (roda no k6, nao no Node).
import { Counter } from 'k6/metrics';

// De dentro do container, a maquina hospedeira (onde o location roda) e host.docker.internal.
export const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3001';
export const RATE = Number(__ENV.RATE || 500);
export const DRIVERS = Number(__ENV.DRIVERS || 1000);

/** Mesmos ids em todos os scripts: o motorista N e sempre o mesmo uuid. */
export function driverId(n) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

/**
 * Regiao da Grande Sao Paulo: quadrado de ~200 x 200 km. Grande o bastante para que
 * um raio de 2 km pegue uma fracao pequena da frota, como numa cidade real.
 */
export const REGION = { lat: -23.5505, lng: -46.6333, dLat: 0.9, dLng: 0.98 };

export function randomPointInRegion(rand = Math.random) {
  return {
    lat: REGION.lat + (rand() * 2 - 1) * REGION.dLat,
    lng: REGION.lng + (rand() * 2 - 1) * REGION.dLng,
  };
}

/** Executor de taxa constante: dispara RATE por segundo, tenham as anteriores voltado ou nao. */
export function constantRate(duration) {
  return {
    executor: 'constant-arrival-rate',
    rate: RATE,
    timeUnit: '1s',
    duration,
    preAllocatedVUs: Math.min(RATE, 500),
    maxVUs: Number(__ENV.MAX_VUS || 2000),
  };
}

// "falhou" sozinho nao diz o que fazer: separa rede (status 0), 4xx e 5xx.
const networkErrors = new Counter('errors_network');
const clientErrors = new Counter('errors_4xx');
const serverErrors = new Counter('errors_5xx');

export function recordStatus(res) {
  if (res.status === 0) networkErrors.add(1);
  else if (res.status >= 500) serverErrors.add(1);
  else if (res.status >= 400) clientErrors.add(1);
}

export const summaryOptions = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
};

/** Uma linha de JSON por rodada, para o ladder.mjs montar a tabela. */
export function summaryLine(data) {
  const m = data.metrics;
  const duration = m.http_req_duration.values;
  const count = (name) => (m[name] ? m[name].values.count : 0);
  return {
    stdout:
      JSON.stringify({
        rate: RATE,
        achieved: m.http_reqs.values.rate,
        med: duration.med,
        p95: duration['p(95)'],
        p99: duration['p(99)'],
        max: duration.max,
        failed: m.http_req_failed.values.rate,
        errors: { network: count('errors_network'), '4xx': count('errors_4xx'), '5xx': count('errors_5xx') },
        dropped: count('dropped_iterations'),
        vus: m.vus_max.values.max,
      }) + '\n',
  };
}
