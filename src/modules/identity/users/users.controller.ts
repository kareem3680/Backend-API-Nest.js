import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CompanyContextGuard } from '../../../common/guards/company-context.guard';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import type { Request } from '../../../common/interfaces/request.interface';

@Controller('admin-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, CompanyContextGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('super-admin', 'admin')
  async getUsers(
    @Req() req: Request,
    @Query() query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.getUsers(req.user!.role, req.companyId, query);
  }

  @Post()
  @Roles('super-admin', 'admin')
  async createUser(
    @Req() req: Request,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(
      req.user!.role,
      req.companyId,
      createUserDto,
    );
  }

  @Get(':id')
  @Roles('super-admin', 'admin')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.getUser(id, req.user!.role, req.companyId);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserRole(
      id,
      updateUserDto,
      req.user!.role,
      req.companyId,
    );
  }

  @Patch('deactivate/:id')
  @Roles('super-admin', 'admin')
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.usersService.deactivateUser(id, req.user!.role, req.companyId);
    return { message: 'User deactivated successfully' };
  }

  @Patch('activate/:id')
  @Roles('super-admin', 'admin')
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.usersService.activateUser(id, req.user!.role, req.companyId);
    return { message: 'User activated successfully' };
  }
}
