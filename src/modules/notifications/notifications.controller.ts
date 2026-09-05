import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyContextGuard } from '../../common/guards/company-context.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import type { Request } from '../../common/interfaces/request.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard, CompanyContextGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @Roles('super-admin', 'admin')
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() req: Request,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(
      createNotificationDto,
      req.user!._id,
      req.companyId ?? null,
    );
  }

  @Post('send')
  @Roles('super-admin', 'admin')
  async createAndSendNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() req: Request,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.createAndSendNotification(
      createNotificationDto,
      req.user!._id,
      req.companyId ?? null,
    );
  }

  @Get()
  async getMyNotifications(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
    @Query() query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const allQuery = { ...paginationDto, ...query };
    return this.notificationsService.getUserNotifications(
      req.user!._id,
      req.user!.role,
      req.companyId ?? null,
      paginationDto,
      allQuery,
    );
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req: Request): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(req.user!._id);
    return { count };
  }

  @Patch('mark/:id')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, req.user!._id);
  }

  @Patch('mark-all')
  async markAllAsRead(@Req() req: Request): Promise<{ modifiedCount: number }> {
    return this.notificationsService.markAllAsRead(req.user!._id);
  }
}
