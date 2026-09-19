import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { RedisService } from '../../redis/redis.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const dataSource = { query: jest.fn() };
  const redisService = { ping: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(HealthService);
    jest.resetAllMocks();
  });

  it('returns ok when postgres and redis are up', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    redisService.ping.mockResolvedValue('PONG');

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      checks: { postgres: 'up', redis: 'up' },
    });
  });

  it('returns error when a dependency is down', async () => {
    dataSource.query.mockRejectedValue(new Error('db down'));
    redisService.ping.mockResolvedValue('PONG');

    await expect(service.check()).resolves.toEqual({
      status: 'error',
      checks: { postgres: 'down', redis: 'up' },
    });
  });
});
