/**
 * Porta de hashing de senha. Fica na camada APPLICATION (nao no domain) porque
 * hashear e um servico tecnico que o use case usa — o aggregate Rider nunca toca
 * senha em texto puro. A infra implementa (bcrypt hoje, argon2 amanha) sem o use
 * case saber qual. DIP de novo.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
