import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { TripUseCases } from '../application/trip-use-cases';
import { AcceptTripDto, acceptTripSchema, RequestTripDto, requestTripSchema } from './dto/trip.dto';

/**
 * Cada transicao e um POST num sub-recurso (/trips/:id/accept...), nao um PATCH
 * de `status`. Um PATCH { status: 'finished' } deixaria o cliente "escolher" o
 * estado; aqui o cliente pede uma ACAO e o aggregate decide se ela e valida.
 *
 * O pipe Zod vai direto no @Body (e nao em @UsePipes, como no identity) porque
 * aqui tambem ha @Param: @UsePipes aplicaria o Zod no id da URL tambem.
 * Transicoes respondem 200 (nada novo e criado); so o POST /trips e 201.
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

  @Post(':id/accept')
  @HttpCode(200)
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(acceptTripSchema)) body: AcceptTripDto,
  ) {
    return this.trips.accept(id, body.driverId);
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
