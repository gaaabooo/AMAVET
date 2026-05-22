import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Traduce los errores conocidos de Prisma a respuestas HTTP con el código
 * correcto. Sin esto, un conflicto de constraint (que es un 409) o un registro
 * inexistente (404) salen como 500 genérico, confundiendo al cliente y
 * ocultando que la causa fue su propio input.
 *
 * Nunca se devuelve el detalle interno de Prisma al cliente: el mensaje es
 * genérico y el detalle completo va solo al log del servidor.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const httpError = this.traducir(exception);

    this.logger.warn(
      `Prisma ${exception.code}: ${exception.message.replace(/\n/g, ' ')}`,
    );

    // Delegamos en el filtro base de Nest para formatear la respuesta de forma
    // consistente con el resto de las excepciones HTTP.
    super.catch(httpError, host);
  }

  private traducir(e: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (e.code) {
      // Violación de restricción única.
      case 'P2002':
        return new ConflictException('El recurso ya existe');
      // Registro requerido por la operación no encontrado.
      case 'P2025':
        return new NotFoundException('Recurso no encontrado');
      // Violación de clave foránea / restricción.
      case 'P2003':
      case 'P2004':
        return new BadRequestException(
          'La operación viola una restricción de datos',
        );
      // Valor demasiado largo para la columna.
      case 'P2000':
        return new BadRequestException(
          'Uno de los valores enviados es demasiado largo',
        );
      default:
        return new InternalServerErrorException(
          'Error al procesar la solicitud',
        );
    }
  }
}
