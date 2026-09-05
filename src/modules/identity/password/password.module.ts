import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  PasswordController,
  UpdatePasswordController,
} from './password.controller';
import { PasswordService } from './password.service';
import { User } from '../entities/user.entity';
import { jwtConfig } from '../../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = jwtConfig(configService);
        return {
          secret: config.secret,
        };
      },
    }),
  ],
  controllers: [PasswordController, UpdatePasswordController],
  providers: [PasswordService],
})
export class PasswordModule {}
