import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersRepository } from '../users/repository/users.repository';
import { User } from '../entities/user.entity';
import ms from 'ms';
import { jwtConfig } from '../../../config/jwt.config';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = jwtConfig(configService);
        const expiresInSeconds = ms(config.accessExpiresIn as ms.StringValue);
        return {
          secret: config.secret,
          signOptions: {
            expiresIn: Math.floor(expiresInSeconds / 1000),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, UsersRepository],
  exports: [AuthService],
})
export class AuthModule {}
