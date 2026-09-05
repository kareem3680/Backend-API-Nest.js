import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export interface SeedConfig {
  superAdminName: string;
  superAdminEmail: string;
  superAdminPassword: string;
}

export const seedConfig = (configService: ConfigService): SeedConfig => ({
  superAdminName: configService.get<string>('SUPER_ADMIN_NAME', 'Super Admin'),
  superAdminEmail: configService.get<string>(
    'SUPER_ADMIN_EMAIL',
    'admin@test.com',
  ),
  superAdminPassword: configService.get<string>(
    'SUPER_ADMIN_PASSWORD',
    'Admin@123456',
  ),
});

export default registerAs(
  'seed',
  (): SeedConfig => ({
    superAdminName: process.env.SUPER_ADMIN_NAME || 'Super Admin',
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'admin@test.com',
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
  }),
);
