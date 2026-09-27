import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { TripUseCases } from '../application/trip-use-cases';
import { RequestTripDto, requestTripSchema } from './dto/trip.dto';

/**
 * Cada transicao e um POST num sub-recurso (/trips/:id/finish...), nao um PATCH
 * de `status`: o cliente pede uma ACAO e o aggregate decide se ela e valida.
 *
 * Nao ha rota de "aceitar": quem atribui o motorista e o matching, dentro do
 * POST /trips. A resposta ja volta `accepted` (com driverId) ou `requested`.
 *
 * O pipe Zod vai direto no @Body porque ha @Param nas mesmas rotas: @UsePipes
 * aplicaria o Zod no id da URL tambem. Transicoes respondem 200; so o POST /trips e 201.
 */
@Controller('trips')
export class TripController {
  constructor(private readonly trips: TripUseCases) {}

  @Post()
  @HttpCode(201)
  request(@Body(new ZodValidationPipe(requestTripSchema)) body: RequestTripDto) {
    return this.trips.request(body.riderId);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.trips.get(id);
  }

  @Post(':id/start')
  @HttpCode(200)
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.trips.start(id);
  }

  @Post(':id/finish')
  @HttpCode(200)
  finish(@Param('id', ParseUUIDPipe) id: string) {
    return this.trips.finish(id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.trips.cancel(id);
  }
}
