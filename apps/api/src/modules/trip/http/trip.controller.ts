import { Controller } from '@nestjs/common';

/**
 * Borda HTTP do modulo trip: solicitar, aceitar, iniciar, finalizar e cancelar
 * corrida. TODO(dominio): a maquina de estados vive no aggregate (domain/),
 * nao aqui.
 */
@Controller('trips')
export class TripController {}
