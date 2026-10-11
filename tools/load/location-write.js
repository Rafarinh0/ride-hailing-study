// Script k6 (roda no k6, nao no Node). Carga de escrita no servico location.
//
// Taxa constante ("open loop"): o k6 dispara RATE requisicoes por segundo, tenham as
// anteriores voltado ou nao, como celulares de verdade. Se o servico ficar lento, a
// latencia sobe e o k6 precisa de mais VUs (usuarios virtuais) em paralelo; se nem
// MAX_VUS bastar, ele conta `dropped_iterations` em vez de diminuir a carga em silencio.
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

// "falhou" sozinho nao diz o que fazer: separa rede (status 0), 4xx e 5xx.
const networkErrors = new Counter('errors_network');
const clientErrors = new Counter('errors_4xx');
const serverErrors = new Counter('errors_5xx');

const RATE = Number(__ENV.RATE || 500);
const DURATION = __ENV.DURATION || '30s';
const DRIVERS = Number(__ENV.DRIVERS || 1000);
const MAX_VUS = Number(__ENV.MAX_VUS || 2000);
// De dentro do container, a maquina hospedeira (onde o location roda) e host.docker.internal.
const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3001';

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
  scenarios: {
    writes: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: Math.min(RATE, 500),
      maxVUs: MAX_VUS,
    },
  },
};

// Frota fixa: as mesmas DRIVERS linhas recebem todos os upserts, como na vida real.
const ids = Array.from({ length: DRIVERS }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
const headers = { 'Content-Type': 'application/json' };

export default function () {
  const id = ids[Math.floor(Math.random() * DRIVERS)];
  const body = JSON.stringify({
    lat: -23.5505 + (Math.random() - 0.5) * 0.09, // ~10 km em volta do centro de SP
    lng: -46.6333 + (Math.random() - 0.5) * 0.09,
    recordedAt: new Date().toISOString(),
  });
  const res = http.post(`${BASE_URL}/drivers/${id}/location`, body, { headers });
  check(res, { 'status 204': (r) => r.status === 204 });
  if (res.status === 0) networkErrors.add(1);
  else if (res.status >= 500) serverErrors.add(1);
  else if (res.status >= 400) clientErrors.add(1);
}

// Uma linha de JSON por rodada, para o ladder.mjs montar a tabela.
export function handleSummary(data) {
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
        dropped: m.dropped_iterations ? m.dropped_iterations.values.count : 0,
        vus: m.vus_max.values.max,
      }) + '\n',
  };
}
