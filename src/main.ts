import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './enviroment';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });
  app.setGlobalPrefix('api/v1');
  await app.listen(PORT);
}
bootstrap();
