import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { cleanOldLogs } from './log-cleanup.util';
import { LoggerService } from '../../common/utils/logger.util';

const logDir = process.env.LOG_PATH || 'logs';

@Injectable()
export class CronJobUtil {
  private readonly logger = new LoggerService(CronJobUtil.name);

  @Cron('0 16 * * 1')
  handleLogCleanup(): void {
    this.logger.info('Daily log cleanup started (Every Monday at 4 PM)');
    try {
      cleanOldLogs(logDir);
      this.logger.info('Log cleanup completed successfully');
    } catch (error) {
      this.logger.error('Clean Old Logs failed', {
        stack: (error as Error).stack,
      });
    }
  }
}
