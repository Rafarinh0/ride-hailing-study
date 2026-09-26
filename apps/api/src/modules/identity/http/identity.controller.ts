import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { Login } from '../application/login';
import { RegisterDriver } from '../application/register-driver';
import { RegisterRider } from '../application/register-rider';
import { LoginDto, loginSchema, RegisterDto, registerSchema } from './dto/identity.dto';

/**
 * Borda HTTP do identity. Fina de proposito: valida o payload (pipe Zod) e
 * delega ao use case. Cadastro responde 201 (cria conta); login responde 200.
 */
@Controller('identity')
export class IdentityController {
  constructor(
    private readonly registerRider: RegisterRider,
    private readonly registerDriver: RegisterDriver,
    private readonly login: Login,
  ) {}

  @Post('riders')
  @HttpCode(201)
  signUpRider(@Body(new ZodValidationPipe(registerSchema)) body: RegisterDto) {
    return this.registerRider.execute(body);
  }

  @Post('drivers')
  @HttpCode(201)
  signUpDriver(@Body(new ZodValidationPipe(registerSchema)) body: RegisterDto) {
    return this.registerDriver.execute(body);
  }

  @Post('riders/login')
  @HttpCode(200)
  loginRider(@Body(new ZodValidationPipe(loginSchema)) body: LoginDto) {
    return this.login.execute('rider', body);
  }

  @Post('drivers/login')
  @HttpCode(200)
  loginDriver(@Body(new ZodValidationPipe(loginSchema)) body: LoginDto) {
    return this.login.execute('driver', body);
  }
}
