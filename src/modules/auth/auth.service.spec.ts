import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/constants/error-code';
import { BusinessException } from '../../common/exceptions/business.exception';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../users/users.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import * as hash from '../../common/utils/hash';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const redisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'jwt.accessSecret': 'access-secret-value',
        'jwt.refreshSecret': 'refresh-secret-value',
        'jwt.accessExpires': '15m',
        'jwt.refreshExpires': '7d',
      };
      return map[key];
    }),
  };

  const user = {
    id: 'user-1',
    username: 'linjing',
    passwordHash: 'hashed',
    nickname: 'linjing',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.resetAllMocks();
    configService.getOrThrow.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        'jwt.accessSecret': 'access-secret-value',
        'jwt.refreshSecret': 'refresh-secret-value',
        'jwt.accessExpires': '15m',
        'jwt.refreshExpires': '7d',
      };
      return map[key];
    });
    jwtService.signAsync
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('refresh');
  });

  it('registers a new user and stores refresh token', async () => {
    usersService.findByUsername.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    jest.spyOn(hash, 'hashPassword').mockResolvedValue('hashed');

    const tokens = await service.register({
      username: 'linjing',
      password: 'Passw0rd!',
    });

    expect(tokens).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: '15m',
    });
    expect(redisService.set).toHaveBeenCalledWith(
      'auth:refresh:user-1',
      'refresh',
      604800,
    );
  });

  it('rejects duplicate username', async () => {
    usersService.findByUsername.mockResolvedValue(user);

    await expect(
      service.register({ username: 'linjing', password: 'Passw0rd!' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.USER_EXISTS });
  });

  it('rejects invalid login credentials', async () => {
    usersService.findByUsername.mockResolvedValue(user);
    jest.spyOn(hash, 'comparePassword').mockResolvedValue(false);

    await expect(
      service.login({ username: 'linjing', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(BusinessException);
  });
});
