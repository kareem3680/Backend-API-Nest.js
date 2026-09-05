import { Module, Global } from '@nestjs/common';
import { CronJobUtil } from './utils/cron-job.util';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
  providers: [CronJobUtil, JwtService],
  exports: [CronJobUtil, JwtService],
})
export class CommonModule {}
