import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Health check mínimo. No expone versiones ni detalles internos.
  estado(): { status: string } {
    return { status: 'ok' };
  }
}
