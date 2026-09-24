import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnv } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { PORT } = loadEnv();
  await app.listen(PORT);
}

void bootstrap();
