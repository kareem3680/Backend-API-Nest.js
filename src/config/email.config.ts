import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export interface EmailConfig {
  apiKey: string;
  from: string;
  brand: string;
}

export const emailConfig = (configService: ConfigService): EmailConfig => ({
  apiKey: configService.get<string>('BREVO_API_KEY', ''),
  from: configService.get<string>('EMAIL_FROM', 'noreply@test.com'),
  brand: configService.get<string>('EMAIL_BRAND_NAME', 'Backend API'),
});

export default registerAs('email', () => ({
  apiKey: process.env.BREVO_API_KEY || '',
  from: process.env.EMAIL_FROM || 'noreply@test.com',
  brand: process.env.EMAIL_BRAND_NAME || 'Backend API',
}));
