import { Global, Module } from '@nestjs/common';
import { loadEnv } from '../config/env';
import { createDatabase, DRIZZLE } from './drizzle.provider';

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
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
