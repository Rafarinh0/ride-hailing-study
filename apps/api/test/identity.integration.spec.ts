import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Driver } from '../src/modules/identity/domain/driver';
import { EmailAlreadyInUseError } from '../src/modules/identity/domain/errors';
import { Rider } from '../src/modules/identity/domain/rider';
import { Email } from '../src/modules/identity/domain/value-objects/email';
import { DrizzleDriverRepository } from '../src/modules/identity/infrastructure/drizzle-driver.repository';
import { DrizzleRiderRepository } from '../src/modules/identity/infrastructure/drizzle-rider.repository';
import { startPostgres } from './postgres';

/**
 * Integracao dos repositorios contra um Postgres real. Instanciamos as classes
 * direto (new ...), sem o Nest — sao so classes; o @Inject so importa quando o
 * container de DI monta o grafo.
 */
describe('Repositorios de identity (integracao)', () => {
  let pg: Awaited<ReturnType<typeof startPostgres>>;
  let riders: DrizzleRiderRepository;
  let drivers: DrizzleDriverRepository;

  beforeAll(async () => {
    pg = await startPostgres();
    riders = new DrizzleRiderRepository(pg.db);
    drivers = new DrizzleDriverRepository(pg.db);
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
    await riders.save(rider);

    const found = await riders.findByEmail(Email.create('ana@example.com'));
    expect(found).not.toBeNull();
    expect(found!.id).toBe(rider.id);
    expect(found!.name).toBe('Ana');
    expect(found!.email.value).toBe('ana@example.com');
  });

  it('devolve null quando o email nao existe', async () => {
    expect(await riders.findByEmail(Email.create('ninguem@example.com'))).toBeNull();
  });

  it('salva e recupera um driver', async () => {
    const driver = Driver.register({ name: 'Bia', email: Email.create('bia@example.com'), passwordHash: 'h' });
    await drivers.save(driver);
    expect((await drivers.findByEmail(Email.create('bia@example.com')))!.id).toBe(driver.id);
  });

  // Simula o perdedor de dois cadastros simultaneos: o check do use case ja passou,
  // e so o UNIQUE do banco segura. Tem de virar erro de dominio (409), nao 500.
  it('rider com email repetido que passa pelo check vira EmailAlreadyInUseError', async () => {
    const email = Email.create('repetido@example.com');
    await riders.save(Rider.register({ name: 'A', email, passwordHash: 'h' }));
    await expect(riders.save(Rider.register({ name: 'B', email, passwordHash: 'h' }))).rejects.toThrow(
      EmailAlreadyInUseError,
    );
  });

  it('driver com email repetido que passa pelo check vira EmailAlreadyInUseError', async () => {
    const email = Email.create('repetido@example.com');
    await drivers.save(Driver.register({ name: 'A', email, passwordHash: 'h' }));
    await expect(drivers.save(Driver.register({ name: 'B', email, passwordHash: 'h' }))).rejects.toThrow(
      EmailAlreadyInUseError,
    );
  });

  it('violacao de outra constraint (id repetido) nao vira EmailAlreadyInUseError', async () => {
    const first = Rider.register({ name: 'A', email: Email.create('pk1@example.com'), passwordHash: 'h' });
    await riders.save(first);
    const sameId = Rider.rehydrate({
      id: first.id,
      name: 'B',
      email: Email.create('pk2@example.com'),
      passwordHash: 'h',
      createdAt: new Date(),
    });
    await expect(riders.save(sameId)).rejects.not.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('o mesmo email pode ser passageiro e motorista (unicidade por papel)', async () => {
    const email = Email.create('dupla@example.com');
    await riders.save(Rider.register({ name: 'Caio', email, passwordHash: 'h' }));
    await drivers.save(Driver.register({ name: 'Caio', email, passwordHash: 'h' }));

    expect(await riders.findByEmail(email)).not.toBeNull();
    expect(await drivers.findByEmail(email)).not.toBeNull();
  });
});
