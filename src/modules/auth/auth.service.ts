import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '../../common/constants/error-code';
import { BusinessException } from '../../common/exceptions/business.exception';
import {
  parseDurationToSeconds,
  toJwtExpiresIn,
} from '../../common/utils/duration';
import { comparePassword, hashPassword } from '../../common/utils/hash';
import { RedisService } from '../../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existed = await this.usersService.findByUsername(dto.username);
    if (existed) {
      throw new BusinessException(
        ErrorCode.USER_EXISTS,
        'Username already exists',
      );
    }

    const user = await this.usersService.create({
      username: dto.username,
      passwordHash: await hashPassword(dto.password),
      nickname: dto.nickname ?? dto.username,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const matched = await comparePassword(dto.password, user.passwordHash);
    if (!matched) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.redisService.get(this.refreshKey(payload.sub));
    if (!stored || stored !== refreshToken) {
      throw new BusinessException(
        ErrorCode.TOKEN_INVALID,
        'Refresh token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new BusinessException(
        ErrorCode.TOKEN_INVALID,
        'Refresh token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.redisService.del(this.refreshKey(userId));
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessExpires =
      this.configService.getOrThrow<string>('jwt.accessExpires');
    const refreshExpires =
      this.configService.getOrThrow<string>('jwt.refreshExpires');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: toJwtExpiresIn(accessExpires),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: toJwtExpiresIn(refreshExpires),
      }),
    ]);

    await this.redisService.set(
      this.refreshKey(user.id),
      refreshToken,
      parseDurationToSeconds(refreshExpires),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpires,
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new BusinessException(
        ErrorCode.TOKEN_INVALID,
        'Refresh token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private refreshKey(userId: string): string {
    return `auth:refresh:${userId}`;
  }
}
