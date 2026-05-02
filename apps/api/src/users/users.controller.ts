import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('usuarios')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('tutores')
  listarTutores() {
    return this.usersService.listarTutores();
  }
}
