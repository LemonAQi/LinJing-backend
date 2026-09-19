import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCode } from '../../../common/constants/error-code';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../users/entities/user.entity';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        'Account is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
    return user;
  }
}
