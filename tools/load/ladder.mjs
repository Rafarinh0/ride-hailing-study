// Escada de carga: roda um script k6 (via Docker) em varias taxas, uma depois da
// outra, e imprime uma tabela. Node puro, para funcionar igual no PowerShell e no bash.
//
//   node tools/load/ladder.mjs --rates 500,1000,2000 --duration 20s
//   node tools/load/ladder.mjs --script location-nearby.js --rates 1000,2000
//   node tools/load/ladder.mjs --script location-seed.js --rates 200 --drivers 200000   (rates = envios em paralelo)
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    script: { type: 'string', default: 'location-write.js' },
    rates: { type: 'string', default: '500,1000,2000,3000,4000,5000' },
    duration: { type: 'string', default: '20s' },
    drivers: { type: 'string', default: '1000' },
    label: { type: 'string', default: '' },
  },
});

// A pasta dos scripts vai montada no container: assim eles podem importar o common.js.
const scriptsDir = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]$/, '');
const rows = [];

for (const rate of values.rates.split(',').map(Number)) {
  process.stderr.write(`rodando ${values.script} a ${rate} req/s...\n`);
  const run = spawnSync(
    'docker',
    ['run', '--rm', '-v', `${scriptsDir}:/scripts:ro`,
      '-e', `RATE=${rate}`, '-e', `DURATION=${values.duration}`, '-e', `DRIVERS=${values.drivers}`,
      'grafana/k6', 'run', '--quiet', `/scripts/${values.script}`],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  const line = (run.stdout ?? '').trim().split('\n').reverse().find((l) => l.startsWith('{'));
  if (!line) {
    console.error(run.stderr || run.stdout || run.error);
    process.exit(1);
  }
  rows.push(JSON.parse(line));

  // Quando uma requisicao falha na rede, o k6 avisa no stderr: mostra os motivos distintos.
  const warnings = new Set(
    (run.stderr ?? '').split('\n').filter((l) => l.includes('level=warning')).map((l) => l.replace(/.*msg="([^"]*)".*/, '$1').replace(/[0-9a-f-]{36}/g, '<id>')),
  );
  for (const w of [...warnings].slice(0, 3)) process.stderr.write(`  aviso do k6: ${w}\n`);
}

const ms = (n) => n.toFixed(1);
console.log(`\n${values.label}`);
console.log('| pedido (req/s) | entregue (req/s) | mediana (ms) | p95 (ms) | p99 (ms) | max (ms) | falhas (rede/4xx/5xx) | descartadas | VUs |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  const e = r.errors;
  console.log(
    `| ${r.rate} | ${r.achieved.toFixed(0)} | ${ms(r.med)} | ${ms(r.p95)} | ${ms(r.p99)} | ${ms(r.max)} | ` +
      `${(r.failed * 100).toFixed(2)}% (${e.network}/${e['4xx']}/${e['5xx']}) | ${r.dropped} | ${r.vus} |`,
  );
}
