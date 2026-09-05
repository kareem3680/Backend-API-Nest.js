import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import type { Request } from '../../../common/interfaces/request.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Post()
  @Roles('super-admin')
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @Req() req: Request,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.createCompany(createCompanyDto, req.user!._id);
  }

  @Get()
  @Roles('super-admin')
  async getCompanies(
    @Query() query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<CompanyResponseDto>> {
    return this.companiesService.getAllCompanies(query);
  }

  @Get(':id')
  @Roles('super-admin')
  async getCompany(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.getCompanyById(id);
  }

  @Patch(':id')
  @Roles('super-admin')
  async updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() req: Request,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.updateCompany(
      id,
      updateCompanyDto,
      req.user!._id,
    );
  }

  @Delete(':id')
  @Roles('super-admin')
  async deleteCompany(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ status: string; message: string }> {
    await this.companiesService.deleteCompany(id);
    return {
      status: 'success',
      message: 'Company and all associated data deleted successfully',
    };
  }

  @Patch('deactivate/:id')
  @Roles('super-admin')
  async deactivateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ status: string; message: string }> {
    await this.companiesService.deactivateCompany(id, req.user!._id);
    return {
      status: 'success',
      message: 'Company deactivated successfully',
    };
  }

  @Patch('activate/:id')
  @Roles('super-admin')
  async activateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ status: string; message: string }> {
    await this.companiesService.activateCompany(id, req.user!._id);
    return {
      status: 'success',
      message: 'Company activated successfully',
    };
  }

  @Get(':companyId/users')
  @Roles('super-admin')
  async getCompanyUsers(
    @Param('companyId') companyId: string,
    @Query() query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.companiesService.getCompanyUsers(companyId, query);
  }
}
