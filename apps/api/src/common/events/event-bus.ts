/** Um fato que ja aconteceu, com nome no passado: `trip.finished`. */
export interface DomainEvent {
  readonly type: string;
}

export type EventHandler<E extends DomainEvent> = (event: E) => Promise<void>;

/**
 * Porta do barramento de eventos. Quem publica nao sabe quem escuta: o trip anuncia
 * `trip.finished` sem saber que o payment existe. Hoje em processo; na Etapa 3 a
 * implementacao vira Kafka e os modulos nao mudam.
 */
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<E extends DomainEvent>(type: E['type'], handler: EventHandler<E>): void;
}

export const EVENT_BUS = Symbol('EVENT_BUS');
