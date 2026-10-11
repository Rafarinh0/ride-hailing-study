// Carga de leitura: "motoristas a ate 2 km daqui", de pontos aleatorios da regiao,
// em taxa constante. Rodar depois do location-seed.js.
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, constantRate, randomPointInRegion, recordStatus, summaryLine, summaryOptions } from './common.js';

const RADIUS = Number(__ENV.RADIUS || 2000);

export const options = {
  ...summaryOptions,
  scenarios: { reads: constantRate(__ENV.DURATION || '30s') },
};

export default function () {
  const { lat, lng } = randomPointInRegion();
  const res = http.get(`${BASE_URL}/drivers/nearby?lat=${lat}&lng=${lng}&radius=${RADIUS}&limit=10`, {
    tags: { name: 'GET /drivers/nearby' }, // agrupa as metricas: cada ponto e uma URL diferente
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  recordStatus(res);
}

export const handleSummary = summaryLine;
