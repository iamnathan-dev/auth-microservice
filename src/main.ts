import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const server = app.getHttpServer();
  const router = server._events.request._router;
  console.log(router?.stack.map((r: any) => r.route).filter(Boolean));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
