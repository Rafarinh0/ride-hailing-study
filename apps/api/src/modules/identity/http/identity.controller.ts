import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { RegisterRider } from '../application/register-rider';
import { RegisterRiderDto, registerRiderSchema } from './dto/register-rider.dto';

/**
 * Borda HTTP do cadastro de passageiro. Fina de proposito: valida o payload
 * (pipe Zod) e delega ao use case. Sem regra de negocio aqui.
 */
@Controller('identity/riders')
export class IdentityController {
  constructor(private readonly registerRider: RegisterRider) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(registerRiderSchema))
  async register(@Body() body: RegisterRiderDto): Promise<{ id: string }> {
    return this.registerRider.execute(body);
  }
}
