import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Pipe reutilizavel: valida o payload da request contra um schema Zod ANTES de
 * chegar no controller. Se falhar, 400 com o detalhe. Se passar, devolve o dado
 * ja tipado. Valida forma de transporte (tipos, tamanho) — regra de dominio
 * (ex.: email valido) fica no value object, camada mais interna.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return result.data;
  }
}
