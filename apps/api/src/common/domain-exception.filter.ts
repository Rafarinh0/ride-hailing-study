import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import {
  ConflictError,
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './domain-error';

// Tipo minimo da resposta (evita depender de @types/express). O adapter Express
// do Nest expoe status().json().
interface HttpResponse {
  status(code: number): { json(body: unknown): unknown };
}

/**
 * Traduz erro de dominio -> status HTTP na saida. Um unico lugar faz o mapa
 * categoria semantica -> codigo. Registrado global no app.module (APP_FILTER).
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();

    const status =
      error instanceof ValidationError ? 400 :
      error instanceof ConflictError ? 409 :
      error instanceof NotFoundError ? 404 :
      error instanceof UnauthorizedError ? 401 :
      400;

    response.status(status).json({ error: error.name, message: error.message });
  }
}
