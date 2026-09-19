import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Controller, Get, Module, Post, Body } from '@nestjs/common';
import { IsString } from 'class-validator';
import { Public } from '../src/common/decorators/public.decorator';
import { setupApp } from '../src/setup-app';

class EchoDto {
  @IsString()
  name: string;
}

@Public()
@Controller({ path: 'ping', version: '1' })
class PingController {
  @Get()
  ping() {
    return { pong: true };
  }

  @Post()
  echo(@Body() dto: EchoDto) {
    return dto;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [
        () => ({
          app: {
            name: 'LinJing',
            env: 'test',
            port: 3000,
            apiPrefix: 'api',
            apiVersion: '1',
            corsOrigin: '*',
            swaggerEnabled: false,
          },
        }),
      ],
    }),
  ],
  controllers: [PingController],
})
class EnvelopeTestModule {}

describe('API envelope (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [EnvelopeTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps success payloads', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/ping')
      .expect(200);

    expect(response.body).toMatchObject({
      code: 0,
      message: 'ok',
      data: { pong: true },
    });
    expect(typeof (response.body as { timestamp: number }).timestamp).toBe(
      'number',
    );
  });

  it('rejects unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ping')
      .send({ name: 'linjing', extra: true })
      .expect(400);

    const body = response.body as { code: number; message: string };
    expect(body.code).toBe(42200);
    expect(body.message).toBe('Validation failed');
  });
});
