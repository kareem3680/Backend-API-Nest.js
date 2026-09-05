import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './modules/identity/entities/user.entity';
import { seedConfig } from './config/seed.config';

async function seed(): Promise<void> {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const config = seedConfig(configService);

  const userRepository = dataSource.getRepository(User);

  const existingSuperAdmin = await userRepository.findOne({
    where: { role: 'super-admin' },
  });

  if (!existingSuperAdmin) {
    const superAdmin = userRepository.create({
      name: config.superAdminName,
      email: config.superAdminEmail,
      password: config.superAdminPassword,
      role: 'super-admin',
      active: true,
    });

    await userRepository.save(superAdmin);
    logger.log(`Super Admin created: ${config.superAdminEmail}`);
  } else {
    logger.log('Super Admin already exists');
  }

  await app.close();
}

seed().catch((error: Error) => {
  const logger = new Logger('Seed');
  logger.error(`Seed failed: ${error.message}`);
  process.exit(1);
});
