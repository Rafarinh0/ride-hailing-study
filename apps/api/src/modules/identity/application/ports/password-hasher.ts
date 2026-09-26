/**
 * Porta de hashing de senha. Fica na camada APPLICATION (nao no domain) porque
 * hashear e um servico tecnico que o use case usa — o aggregate nunca toca senha
 * em texto puro. A infra implementa (bcrypt hoje, argon2 amanha) sem o use case
 * saber qual. DIP de novo.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  /**
   * `hash` null = conta nao encontrada. A implementacao deve gastar o mesmo tempo
   * de uma comparacao real e devolver false, para que o tempo de resposta do login
   * nao revele se o email existe.
   */
  compare(plain: string, hash: string | null): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
