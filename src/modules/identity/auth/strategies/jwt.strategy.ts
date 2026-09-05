/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { UsersRepository } from '../../users/repository/users.repository';
import { isGlobalRole } from '../../../../common/constants';
import { JwtPayload } from '../../../../common/interfaces/jwt-payload.interface';
import { JwtUserResponseDto } from '../dto/jwt-user-response.dto';
import { jwtConfig } from '../../../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersRepository: UsersRepository,
  ) {
    const config = jwtConfig(configService);
    const secretOrKey = config.secret;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUserResponseDto> {
    const user = await this.usersRepository.findOne(payload.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.active) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact support.',
      );
    }

    if (user.changedPasswordAt) {
      const changedTime = Math.floor(user.changedPasswordAt.getTime() / 1000);
      if (payload.iat && changedTime > payload.iat) {
        throw new UnauthorizedException(
          'Password changed recently. Please login again.',
        );
      }
    }

    if (!isGlobalRole(user.role) && user.companyId !== payload.companyId) {
      throw new UnauthorizedException('Company mismatch');
    }

    return plainToInstance(JwtUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
