import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FiltroExcepciones } from './comun/filtro-excepciones';
import { InterceptorRegistro } from './comun/interceptor-registro';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  const origen = process.env.WEB_ORIGIN ?? 'http://localhost:3180';
  app.enableCors({ origin: origen.split(','), credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalFilters(new FiltroExcepciones());
  app.useGlobalInterceptors(new InterceptorRegistro());

  // Un cierre limpio evita dejar el .docx a medio escribir si se apaga la app.
  app.enableShutdownHooks();

  const puerto = parseInt(process.env.PORT ?? '4180', 10);
  await app.listen(puerto);

  const log = new Logger('bootstrap');
  log.log(`API escuchando en http://localhost:${puerto}/api`);
  log.log(`Documentos: ${process.env.DOCS_ROOT ?? '(DOCS_ROOT sin definir)'}`);
}

bootstrap();
