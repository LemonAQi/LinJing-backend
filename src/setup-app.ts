import {
  ClassSerializerInterceptor,
  INestApplication,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

export function setupApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';

  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('app.corsOrigin') ?? '*',
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.get<string>('app.apiVersion') ?? '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new LoggingInterceptor(),
    new TransformInterceptor(reflector),
  );

  if (configService.get<boolean>('app.swaggerEnabled') !== false) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('app.name') ?? 'LinJing')
      .setDescription('临境后端 API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: false,
    });
  }
}
