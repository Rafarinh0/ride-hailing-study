import { describe, expect, it } from 'vitest';
import { createFleet } from './driver';
import { areaAround } from './geo';
import { describeError, driverLoop, emptyStats, Reading } from './loop';
import { seededRng } from './random';

const area = areaAround({ lat: -23.5505, lng: -46.6333 }, 5_000);

function setup(send: (r: Reading) => Promise<void>) {
  const rng = seededRng(1);
  const stats = emptyStats();
  const [driver] = createFleet(1, area, 8, rng);
  return { stats, loop: driverLoop(driver, { area, intervalMs: 2_000, rng, send, stats }) };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('driverLoop', () => {
  it('manda a posicao nova a cada tick e conta o sucesso', async () => {
    const sent: Reading[] = [];
    const { loop, stats } = setup(async (r) => {
      sent.push(r);
    });

    loop.tick();
    await flush();
    loop.tick();
    await flush();

    expect(sent).toHaveLength(2);
    expect(sent[1].lat).not.toBe(sent[0].lat); // andou entre os dois
    expect(stats.ok).toBe(2);
  });

  it('com o envio anterior em voo, pula o envio mas o carro continua andando', async () => {
    let release!: () => void;
    const { loop, stats } = setup(() => new Promise<void>((resolve) => (release = resolve)));

    loop.tick();
    const before = loop.position;
    loop.tick();
    loop.tick();

    expect(stats.skipped).toBe(2);
    expect(loop.position).not.toEqual(before);

    release();
    await flush();
    loop.tick(); // voltou: este envia
    expect(stats.skipped).toBe(2);
  });

  it('servico recusando conta como falha e libera o proximo envio', async () => {
    const { loop, stats } = setup(async () => {
      throw new Error('HTTP 500');
    });

    loop.tick();
    await flush();
    loop.tick();
    await flush();

    expect(stats).toMatchObject({ ok: 0, failed: 2, skipped: 0, lastError: 'HTTP 500' });
  });
});

describe('describeError', () => {
  it('erro de rede do fetch mostra o codigo que vem em cause', () => {
    const refused = new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
    expect(describeError(refused)).toBe('ECONNREFUSED');
  });

  it('timeout vira uma frase legivel', () => {
    expect(describeError(new DOMException('aborted', 'TimeoutError'))).toBe('sem resposta dentro do limite de tempo');
  });
});
