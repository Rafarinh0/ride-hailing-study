import { parseArgs } from 'node:util';
import { createFleet } from './driver';
import { areaAround } from './geo';
import { httpSender } from './http-sender';
import { driverLoop, emptyStats } from './loop';
import { seededRng } from './random';

const REPORT_EVERY_MS = 5_000;

const { values } = parseArgs({
  options: {
    drivers: { type: 'string', default: '100' },
    interval: { type: 'string', default: '2000' }, // ms entre leituras de cada motorista
    url: { type: 'string', default: 'http://localhost:3001' },
    seed: { type: 'string', default: '42' },
    speed: { type: 'string', default: '30' }, // km/h, transito urbano
    duration: { type: 'string' }, // segundos; sem valor, roda ate Ctrl+C
  },
});

function positive(name: string, raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`--${name} precisa ser um numero positivo (recebi "${raw}")`);
  }
  return n;
}

const drivers = positive('drivers', values.drivers);
const intervalMs = positive('interval', values.interval);
const speedMps = positive('speed', values.speed) / 3.6;
const durationS = values.duration === undefined ? undefined : positive('duration', values.duration);

// Centro de Sao Paulo, quadrado de 10 x 10 km.
const area = areaAround({ lat: -23.5505, lng: -46.6333 }, 5_000);
const seed = positive('seed', values.seed);
const rng = seededRng(seed);
const send = httpSender(values.url!);

const stats = emptyStats();
// Cada motorista tem o proprio gerador: o trajeto dele depende so da semente, e nao
// da ordem em que os timers disparam. Mesma semente = mesma frota, mesmos trajetos.
const loops = createFleet(drivers, area, speedMps, rng).map((driver, i) =>
  driverLoop(driver, { area, intervalMs, rng: seededRng(seed * 100_003 + i), send, stats }),
);

// Cada motorista comeca num instante sorteado dentro do intervalo: sem isso, todos
// mandariam juntos, num pico a cada intervalo e silencio no resto do tempo.
const timers: NodeJS.Timeout[] = [];
for (const loop of loops) {
  const start = setTimeout(() => {
    loop.tick();
    timers.push(setInterval(() => loop.tick(), intervalMs));
  }, rng() * intervalMs);
  timers.push(start);
}

const expectedPerSecond = (drivers * 1000) / intervalMs;
console.log(`${drivers} motoristas, 1 leitura a cada ${intervalMs} ms -> esperado ${expectedPerSecond.toFixed(0)} req/s em ${values.url}`);

let elapsedS = 0;
const reporter = setInterval(() => {
  elapsedS += REPORT_EVERY_MS / 1000;
  const seconds = REPORT_EVERY_MS / 1000;
  const avgMs = stats.ok ? (stats.totalLatencyMs / stats.ok).toFixed(1) : '-';
  console.log(
    `[${String(elapsedS).padStart(4)}s] ok ${(stats.ok / seconds).toFixed(0).padStart(5)}/s | ` +
      `falhas ${stats.failed} | pulados ${stats.skipped} | latencia media ${avgMs} ms`,
  );
  Object.assign(stats, emptyStats()); // zera no lugar: todos os motoristas apontam para este objeto
}, REPORT_EVERY_MS);

function stop() {
  timers.forEach(clearTimeout); // clearTimeout tambem limpa setInterval
  clearInterval(reporter);
  console.log('simulador parado');
}

process.on('SIGINT', stop);
if (durationS !== undefined) {
  setTimeout(stop, durationS * 1000);
}
