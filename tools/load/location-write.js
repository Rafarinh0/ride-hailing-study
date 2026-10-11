// Carga de escrita no location: posicoes de uma frota fixa, em taxa constante.
// Se o servico ficar lento, o k6 abre mais VUs; se nem MAX_VUS bastar, conta
// `dropped_iterations` em vez de diminuir a carga em silencio.
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, constantRate, driverId, DRIVERS, recordStatus, summaryLine, summaryOptions } from './common.js';

export const options = {
  ...summaryOptions,
  scenarios: { writes: constantRate(__ENV.DURATION || '30s') },
};

// `name` agrupa as metricas: sem ele, cada id na URL vira uma serie separada.
const params = { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST /drivers/:id/location' } };

export default function () {
  const body = JSON.stringify({
    lat: -23.5505 + (Math.random() - 0.5) * 0.09, // ~10 km em volta do centro de SP
    lng: -46.6333 + (Math.random() - 0.5) * 0.09,
    recordedAt: new Date().toISOString(),
  });
  const res = http.post(`${BASE_URL}/drivers/${driverId(Math.floor(Math.random() * DRIVERS))}/location`, body, params);
  check(res, { 'status 204': (r) => r.status === 204 });
  recordStatus(res);
}

export const handleSummary = summaryLine;
