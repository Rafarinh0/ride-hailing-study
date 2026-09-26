import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../application/ports/password-hasher';

/**
 * Adapter da porta PasswordHasher com bcryptjs (JS puro, sem build nativo — roda
 * igual no CI). Custo controlado pelo numero de rounds (fator de trabalho): mais
 * rounds = mais lento pra atacar por forca bruta, mais lento pra logar.
 *
 * ponytail: bcryptjs escolhido por zero-compile. Upgrade natural e argon2id
 * (recomendado pra senha) quando quiser — troca so este arquivo, vira ADR.
 */
@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds = 10;

  // Hash de um valor aleatorio, gerado uma vez por processo. Quando a conta nao
  // existe, comparamos contra ele: mesmo custo de CPU, resultado sempre false.
  private readonly dummyHash = bcrypt.hashSync(randomUUID(), this.rounds);

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hash: string | null): Promise<boolean> {
    const matches = await bcrypt.compare(plain, hash ?? this.dummyHash);
    return hash !== null && matches;
  }
}
