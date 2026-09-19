import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`LinJing API is running on http://localhost:${port}`);
  if (configService.get<boolean>('app.swaggerEnabled') !== false) {
    logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }
}

void bootstrap();
