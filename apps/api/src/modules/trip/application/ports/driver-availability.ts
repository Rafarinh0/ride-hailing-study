/**
 * Quem esta disponivel para receber corrida agora. Porta porque a troca ja esta
 * no roteiro: hoje fica em memoria, na Etapa 2 vai para o Redis.
 *
 * Estados de um motorista aqui: offline (ausente), available, busy.
 */
export interface DriverAvailability {
  /** offline -> available. Se ja estiver em corrida, nao muda nada. */
  goOnline(driverId: string): Promise<void>;
  /** available -> offline. Em corrida: lanca DriverBusyError. */
  goOffline(driverId: string): Promise<void>;
  /** Livres, em ordem de espera (quem esta livre ha mais tempo primeiro). */
  listAvailable(): Promise<string[]>;
  /**
   * available -> busy, de forma ATOMICA. Devolve false se o motorista ja nao estava
   * livre (outro pedido reservou antes). E o que impede dar o mesmo motorista para
   * duas corridas.
   */
  claim(driverId: string): Promise<boolean>;
  /** busy -> available (volta para o fim da fila). */
  release(driverId: string): Promise<void>;
}

export const DRIVER_AVAILABILITY = Symbol('DRIVER_AVAILABILITY');
