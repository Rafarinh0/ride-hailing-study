import { beforeEach, describe, expect, it } from 'vitest';
import { Driver } from '../domain/driver';
import { InvalidCredentialsError } from '../domain/errors';
import { DriverRepository } from '../domain/ports/driver.repository';
import { RiderRepository } from '../domain/ports/rider.repository';
import { Rider } from '../domain/rider';
import { Email } from '../domain/value-objects/email';
import { Login } from './login';
import { PasswordHasher } from './ports/password-hasher';

/**
 * Teste de unidade da camada de aplicacao com FAKES em memoria no lugar das
 * portas. E exatamente o que a arquitetura hexagonal compra: o use case roda
 * sem banco e sem bcrypt, porque depende de interfaces.
 */
class InMemoryRepo<T extends { email: Email }> {
  items: T[] = [];
  async save(item: T) {
    this.items.push(item);
  }
  async findByEmail(email: Email) {
    return this.items.find((i) => i.email.equals(email)) ?? null;
  }
}

class FakeHasher implements PasswordHasher {
  compareCalls = 0;
  async hash(plain: string) {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string | null) {
    this.compareCalls++;
    return hash === `hashed:${plain}`;
  }
}

describe('Login', () => {
  let riders: InMemoryRepo<Rider>;
  let drivers: InMemoryRepo<Driver>;
  let hasher: FakeHasher;
  let login: Login;

  beforeEach(() => {
    riders = new InMemoryRepo<Rider>();
    drivers = new InMemoryRepo<Driver>();
    hasher = new FakeHasher();
    login = new Login(riders as RiderRepository, drivers as DriverRepository, hasher);

    riders.items.push(
      Rider.register({ name: 'Ana', email: Email.create('ana@example.com'), passwordHash: 'hashed:segredo123' }),
    );
  });

  it('devolve id e papel com credenciais certas', async () => {
    const result = await login.execute('rider', { email: 'ANA@example.com', password: 'segredo123' });
    expect(result).toEqual({ id: riders.items[0].id, role: 'rider' });
  });

  it('senha errada -> credenciais invalidas', async () => {
    await expect(login.execute('rider', { email: 'ana@example.com', password: 'errada' })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('email inexistente -> mesmo erro, e ainda assim compara (tempo igual)', async () => {
    await expect(login.execute('rider', { email: 'ninguem@example.com', password: 'x' })).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(hasher.compareCalls).toBe(1);
  });

  it('conta de passageiro nao loga como motorista', async () => {
    await expect(login.execute('driver', { email: 'ana@example.com', password: 'segredo123' })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});
