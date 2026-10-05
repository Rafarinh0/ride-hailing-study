/** Leitura de posicao que nao representa um lugar ou um momento possivel (400). */
export class InvalidPositionError extends Error {
  constructor(reason: string) {
    super(`posicao invalida: ${reason}`);
    this.name = 'InvalidPositionError';
  }
}
