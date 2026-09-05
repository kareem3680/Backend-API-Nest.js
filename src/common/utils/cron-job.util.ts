import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { cleanOldLogs } from './log-cleanup.util';

const logDir = process.env.LOG_PATH || 'logs';

@Injectable()
export class CronJobUtil {
  private readonly logger = new Logger(CronJobUtil.name);

  @Cron('0 16 * * 1')
  handleLogCleanup(): void {
    this.logger.log('Daily log cleanup started (Every Monday at 4 PM)');
    try {
      cleanOldLogs(logDir);
      this.logger.log('Log cleanup completed successfully');
    } catch (error) {
      this.logger.error('Clean Old Logs failed', error as Error);
    }
  }
}
