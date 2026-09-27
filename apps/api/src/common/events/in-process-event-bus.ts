import { Injectable } from '@nestjs/common';
import { DomainEvent, EventBus, EventHandler } from './event-bus';

/**
 * Barramento em processo. `publish` chama os handlers EM SERIE e espera cada um:
 * dentro de uma transacao, o handler grava na mesma transacao de quem publicou, e
 * um erro no handler sobe para quem publicou (e desfaz tudo).
 *
 * ponytail: sincrono e no mesmo processo. Nao sobrevive a queda e acopla o tempo de
 * resposta de quem publica ao de quem escuta. Kafka (Etapa 3) desacopla os dois.
 */
@Injectable()
export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler<DomainEvent>[]>();

  subscribe<E extends DomainEvent>(type: E['type'], handler: EventHandler<E>): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler as EventHandler<DomainEvent>);
    this.handlers.set(type, list);
  }

  async publish(event: DomainEvent): Promise<void> {
    for (const handler of this.handlers.get(event.type) ?? []) {
      await handler(event);
    }
  }
}
