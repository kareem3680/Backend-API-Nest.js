import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export interface FcmConfig {
  type: string;
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
  authProviderCertUrl: string;
  clientCertUrl: string;
}

export const fcmConfig = (configService: ConfigService): FcmConfig => ({
  type: configService.get<string>('FIREBASE_TYPE', ''),
  projectId: configService.get<string>('FIREBASE_PROJECT_ID', ''),
  privateKeyId: configService.get<string>('FIREBASE_PRIVATE_KEY_ID', ''),
  privateKey: configService.get<string>('FIREBASE_PRIVATE_KEY', ''),
  clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL', ''),
  clientId: configService.get<string>('FIREBASE_CLIENT_ID', ''),
  authUri: configService.get<string>('FIREBASE_AUTH_URI', ''),
  tokenUri: configService.get<string>('FIREBASE_TOKEN_URI', ''),
  authProviderCertUrl: configService.get<string>(
    'FIREBASE_AUTH_PROVIDER_CERT_URL',
    '',
  ),
  clientCertUrl: configService.get<string>('FIREBASE_CLIENT_CERT_URL', ''),
});

export default registerAs(
  'fcm',
  (): FcmConfig => ({
    type: process.env.FIREBASE_TYPE || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    clientId: process.env.FIREBASE_CLIENT_ID || '',
    authUri: process.env.FIREBASE_AUTH_URI || '',
    tokenUri: process.env.FIREBASE_TOKEN_URI || '',
    authProviderCertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || '',
    clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL || '',
  }),
);
