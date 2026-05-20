import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

// Construye un error conocido de Prisma con el código indicado.
function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('mensaje interno', {
    code,
    clientVersion: '7.8.0',
  });
}

describe('PrismaExceptionFilter', () => {
  // El filtro necesita un httpAdapter; para probar solo el mapeo de códigos
  // accedemos al método privado traducir con un cast acotado.
  const filter = new PrismaExceptionFilter({} as never);
  const traducir = (e: Prisma.PrismaClientKnownRequestError): HttpException =>
    (filter as unknown as { traducir: (e: unknown) => HttpException }).traducir(e);

  it('mapea P2002 (unique) a 409 Conflict', () => {
    expect(traducir(prismaError('P2002'))).toBeInstanceOf(ConflictException);
  });

  it('mapea P2025 (no encontrado) a 404 Not Found', () => {
    expect(traducir(prismaError('P2025'))).toBeInstanceOf(NotFoundException);
  });

  it('mapea P2003 (clave foránea) a 400 Bad Request', () => {
    expect(traducir(prismaError('P2003'))).toBeInstanceOf(BadRequestException);
  });

  it('mapea P2000 (valor muy largo) a 400 Bad Request', () => {
    expect(traducir(prismaError('P2000'))).toBeInstanceOf(BadRequestException);
  });

  it('mapea un código desconocido a 500 Internal Server Error', () => {
    expect(traducir(prismaError('P9999'))).toBeInstanceOf(InternalServerErrorException);
  });

  it('no expone el mensaje interno de Prisma en la respuesta', () => {
    const httpError = traducir(prismaError('P2002'));
    expect(JSON.stringify(httpError.getResponse())).not.toContain('mensaje interno');
  });
});
