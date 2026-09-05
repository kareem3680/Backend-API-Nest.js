import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { PasswordModule } from './password/password.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CompaniesModule,
    PasswordModule,
    ProfileModule,
  ],
})
export class IdentityModule {}
