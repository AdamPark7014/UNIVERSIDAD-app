import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';

/**
 * Registra cada petición con su duración. Sin esto no hay forma de saber si
 * algo va lento, y con 496 documentos las consultas pesadas se notan.
 * Las lecturas rápidas no se anotan, para que la bitácora sirva de algo.
 */
@Injectable()
export class InterceptorRegistro implements NestInterceptor {
  private readonly log = new Logger('HTTP');

  intercept(ctx: ExecutionContext, siguiente: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const inicio = Date.now();

    return siguiente.handle().pipe(
      tap(() => {
        const ms = Date.now() - inicio;
        const esLectura = req.method === 'GET';
        // Las mutaciones siempre; las lecturas solo si tardaron.
        if (!esLectura || ms > 400) {
          this.log.log(`${req.method} ${req.originalUrl} — ${ms} ms`);
        }
      }),
    );
  }
}
