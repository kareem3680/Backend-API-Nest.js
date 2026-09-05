import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../../common/utils/logger.util';

@Injectable()
export class DatabaseService {
  private readonly logger = new LoggerService(DatabaseService.name);

  constructor(private dataSource: DataSource) {}

  async testConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.info('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed', {
        stack: (error as Error).stack,
      });
      return false;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      await this.dataSource.runMigrations();
      this.logger.info('Migrations run successfully');
    } catch (error) {
      this.logger.error('Migrations failed', { stack: (error as Error).stack });
      throw error;
    }
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
