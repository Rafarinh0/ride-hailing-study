// Popula a regiao com DRIVERS motoristas, cada um exatamente uma vez, em posicoes
// fixas (mesma semente = mesmas posicoes, em qualquer store). Passa pela API, pelo
// mesmo caminho de uma leitura de verdade.
//
// Aqui o objetivo e completar, nao medir: um numero fixo de iteracoes (nao taxa
// constante, que descartaria envios) e nova tentativa em falha de rede.
// RATE, neste script, e quantos envios em paralelo.
import http from 'k6/http';
import exec from 'k6/execution';
import { BASE_URL, driverId, DRIVERS, RATE, randomPointInRegion, recordStatus, summaryLine, summaryOptions } from './common.js';

export const options = {
  ...summaryOptions,
  scenarios: {
    seed: { executor: 'shared-iterations', vus: RATE, iterations: DRIVERS, maxDuration: '15m' },
  },
};

/** Gerador com semente (mulberry32): o motorista N sempre cai no mesmo ponto. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const params = { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST /drivers/:id/location' } };

export default function () {
  const n = exec.scenario.iterationInTest;
  const body = JSON.stringify({ ...randomPointInRegion(seeded(n + 1)), recordedAt: new Date().toISOString() });
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = http.post(`${BASE_URL}/drivers/${driverId(n)}/location`, body, params);
    if (res.status !== 0) break; // so repete falha de rede
  }
  recordStatus(res);
}

export const handleSummary = summaryLine;
