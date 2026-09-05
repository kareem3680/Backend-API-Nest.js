import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  if (configService.get('DATABASE_URL')) {
    return {
      type: 'postgres',
      url: configService.get('DATABASE_URL'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: !isProduction,
      // logging: !isProduction,
      logging: false,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'Backend'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction,
    // logging: !isProduction,
    logging: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};
