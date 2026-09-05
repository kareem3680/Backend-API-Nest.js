import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { appConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const config = appConfig(configService);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: config.allowedOrigins.split(','),
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
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(config.port);
  logger.log(`Environment: ${config.nodeEnv}`);
  logger.log(`Server running on port ${config.port}`);
}

bootstrap().catch((error: Error) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Bootstrap failed: ${error.message}`);
  process.exit(1);
});
