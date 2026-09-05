import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private dataSource: DataSource) {}

  async testConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed', error as Error);
      return false;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      await this.dataSource.runMigrations();
      this.logger.log('Migrations run successfully');
    } catch (error) {
      this.logger.error('Migrations failed', error as Error);
      throw error;
    }
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
