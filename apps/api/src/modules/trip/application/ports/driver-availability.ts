/**
 * Quem esta disponivel para receber corrida agora. Porta porque a troca ja esta
 * no roteiro: hoje fica em memoria, na Etapa 2 vai para o Redis.
 *
 * Estados de um motorista aqui: offline (ausente), available, busy (com uma corrida).
 */
export interface DriverAvailability {
  /** offline -> available. Se ja estiver em corrida, nao muda nada. */
  goOnline(driverId: string): Promise<void>;
  /** available -> offline. Em corrida: lanca DriverBusyError. */
  goOffline(driverId: string): Promise<void>;
  /** Livres, em ordem de espera (quem esta livre ha mais tempo primeiro). */
  listAvailable(): Promise<string[]>;
  /**
   * available -> busy com `tripId`, de forma ATOMICA. Devolve false se o motorista
   * ja nao estava livre (outro pedido reservou antes). E o que impede dar o mesmo
   * motorista para duas corridas.
   */
  claim(driverId: string, tripId: string): Promise<boolean>;
  /**
   * busy -> available (fim da fila), SO se ele estiver ocupado com `tripId`. Uma
   * liberacao atrasada de outra corrida nao solta um motorista que esta dirigindo.
   */
  release(driverId: string, tripId: string): Promise<void>;
}

export const DRIVER_AVAILABILITY = Symbol('DRIVER_AVAILABILITY');
