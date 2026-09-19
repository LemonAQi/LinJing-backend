import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../../redis/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  checks: {
    postgres: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const postgres = await this.checkPostgres();
    const redis = await this.checkRedis();
    const status = postgres === 'up' && redis === 'up' ? 'ok' : 'error';

    return {
      status,
      checks: { postgres, redis },
    };
  }

  private async checkPostgres(): Promise<'up' | 'down'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      const pong = await this.redisService.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
