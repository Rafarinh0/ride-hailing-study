import { describe, expect, it } from 'vitest';
import { InProcessEventBus } from './in-process-event-bus';

describe('InProcessEventBus', () => {
  it('entrega o evento a todos os inscritos no tipo, na ordem de inscricao', async () => {
    const bus = new InProcessEventBus();
    const calls: string[] = [];
    bus.subscribe('x.happened', async () => {
      calls.push('a');
    });
    bus.subscribe('x.happened', async () => {
      calls.push('b');
    });
    bus.subscribe('outro.tipo', async () => {
      calls.push('nao');
    });

    await bus.publish({ type: 'x.happened' });

    expect(calls).toEqual(['a', 'b']);
  });

  it('sem inscritos, publicar nao faz nada', async () => {
    await expect(new InProcessEventBus().publish({ type: 'ninguem.ouve' })).resolves.toBeUndefined();
  });

  it('erro no handler sobe para quem publicou', async () => {
    const bus = new InProcessEventBus();
    bus.subscribe('x.happened', async () => {
      throw new Error('falhou');
    });
    await expect(bus.publish({ type: 'x.happened' })).rejects.toThrow('falhou');
  });
});
