import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { appConfig } from './config/configuration';
import { LoggerService } from './common/utils/logger.util';

const logger = new LoggerService('Bootstrap');

async function bootstrap(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const config = appConfig(configService);

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: config.allowedOrigins.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableShutdownHooks();

  await app.listen(config.port);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Server running on port ${config.port}`);
}

process.on('unhandledRejection', (reason: unknown) => {
  logger.error(
    `Unhandled Rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
  );
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

bootstrap().catch((error: Error) => {
  logger.error(`Bootstrap failed: ${error.message}`, { stack: error.stack });
  process.exit(1);
});
