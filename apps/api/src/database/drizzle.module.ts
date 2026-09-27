import { Global, Module } from '@nestjs/common';
import { UNIT_OF_WORK } from '../common/unit-of-work';
import { loadEnv } from '../config/env';
import { createDatabase, DRIZZLE } from './drizzle.provider';
import { DrizzleUnitOfWork } from './transaction';

/**
 * Postgres unico compartilhado pela app. Cada modulo isola seu dado num schema
 * proprio (pgSchema). Global para nao precisar reimportar em cada modulo.
 */
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => createDatabase(loadEnv().DATABASE_URL),
    },
    { provide: UNIT_OF_WORK, useClass: DrizzleUnitOfWork },
  ],
  exports: [DRIZZLE, UNIT_OF_WORK],
})
export class DrizzleModule {}
