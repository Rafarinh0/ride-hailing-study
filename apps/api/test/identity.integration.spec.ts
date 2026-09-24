import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Rider } from '../src/modules/identity/domain/rider';
import { Email } from '../src/modules/identity/domain/value-objects/email';
import { DrizzleRiderRepository } from '../src/modules/identity/infrastructure/drizzle-rider.repository';
import { startPostgres } from './postgres';

/**
 * Integracao do repositorio contra um Postgres real. Instanciamos a classe
 * direto (new ...), sem o Nest — ela e so uma classe; o @Inject so importa quando
 * o container de DI monta o grafo.
 */
describe('DrizzleRiderRepository (integracao)', () => {
  let pg: Awaited<ReturnType<typeof startPostgres>>;
  let repo: DrizzleRiderRepository;

  beforeAll(async () => {
    pg = await startPostgres();
    repo = new DrizzleRiderRepository(pg.db);
  }, 120_000);

  afterAll(async () => {
    await pg?.stop();
  });

  it('salva e recupera um rider pelo email (normalizado)', async () => {
    const rider = Rider.register({
      name: 'Ana',
      email: Email.create('Ana@Example.com'),
      passwordHash: 'hash-fake',
    });
    await repo.save(rider);

    const found = await repo.findByEmail(Email.create('ana@example.com'));
    expect(found).not.toBeNull();
    expect(found!.id).toBe(rider.id);
    expect(found!.name).toBe('Ana');
    expect(found!.email.value).toBe('ana@example.com');
  });

  it('devolve null quando o email nao existe', async () => {
    expect(await repo.findByEmail(Email.create('ninguem@example.com'))).toBeNull();
  });
});
