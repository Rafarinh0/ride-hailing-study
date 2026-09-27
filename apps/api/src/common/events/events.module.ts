import { Global, Module } from '@nestjs/common';
import { EVENT_BUS } from './event-bus';
import { InProcessEventBus } from './in-process-event-bus';

/** Um barramento unico para a app inteira: quem publica e quem escuta usam o mesmo. */
@Global()
@Module({
  providers: [{ provide: EVENT_BUS, useClass: InProcessEventBus }],
  exports: [EVENT_BUS],
})
export class EventsModule {}
