import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketGateway } from './socket.gateway';
import { UsersRepository } from '../../modules/identity/users/repository/users.repository';
import { User } from '../../modules/identity/entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [SocketGateway, UsersRepository],
  exports: [SocketGateway],
})
export class SocketModule implements OnModuleDestroy {
  constructor(private socketGateway: SocketGateway) {}

  onModuleDestroy(): void {
    this.socketGateway.destroy();
  }
}
