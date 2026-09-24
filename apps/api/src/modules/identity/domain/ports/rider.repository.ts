import { Rider } from '../rider';
import { Email } from '../value-objects/email';

/**
 * Porta de persistencia do aggregate Rider. O DOMINIO declara o que precisa
 * ("salvar", "achar por email") em termos de dominio (recebe/devolve Rider e
 * Email, nao linhas de tabela). A infraestrutura implementa (DIP: o D do SOLID).
 * Nenhum outro modulo importa isto.
 */
export interface RiderRepository {
  save(rider: Rider): Promise<void>;
  findByEmail(email: Email): Promise<Rider | null>;
}

/** Token de injecao — interface nao existe em runtime, entao usamos um Symbol. */
export const RIDER_REPOSITORY = Symbol('RIDER_REPOSITORY');
