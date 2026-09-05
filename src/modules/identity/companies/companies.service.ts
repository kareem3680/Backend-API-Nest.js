import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CompaniesRepository } from './repository/companies.repository';
import { UsersRepository } from '../users/repository/users.repository';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { LoggerService } from '../../../common/utils/logger.util';
import { User } from '../entities/user.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new LoggerService('company');

  constructor(
    private companiesRepository: CompaniesRepository,
    private usersRepository: UsersRepository,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createCompany(
    createCompanyDto: CreateCompanyDto,
    userId: string,
  ): Promise<CompanyResponseDto> {
    const existingName = await this.companiesRepository.findByName(
      createCompanyDto.name,
    );
    if (existingName) {
      throw new BadRequestException(
        `Company with name "${createCompanyDto.name}" already exists`,
      );
    }

    const existingEmail = await this.companiesRepository.findByEmail(
      createCompanyDto.email,
    );
    if (existingEmail) {
      throw new BadRequestException(
        `Company with email "${createCompanyDto.email}" already exists`,
      );
    }

    const existingCommercial =
      await this.companiesRepository.findByCommercialRegisterNumber(
        createCompanyDto.commercialRegisterNumber,
      );
    if (existingCommercial) {
      throw new BadRequestException(
        `Company with commercial register number "${createCompanyDto.commercialRegisterNumber}" already exists`,
      );
    }

    const existingTax = await this.companiesRepository.findByTaxNumber(
      createCompanyDto.taxNumber,
    );
    if (existingTax) {
      throw new BadRequestException(
        `Company with tax number "${createCompanyDto.taxNumber}" already exists`,
      );
    }

    const company = await this.companiesRepository.create({
      ...createCompanyDto,
      createdBy: userId,
    });

    this.logger.info('Company created', { companyId: company.id });

    return plainToInstance(CompanyResponseDto, company, {
      excludeExtraneousValues: true,
    });
  }

  async getAllCompanies(
    query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<CompanyResponseDto>> {
    return this.companiesRepository.findAndPaginateCompanies(query);
  }

  async getCompanyById(id: string): Promise<CompanyResponseDto> {
    const company = await this.companiesRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    this.logger.info('Fetched company', { id });

    return plainToInstance(CompanyResponseDto, company, {
      excludeExtraneousValues: true,
    });
  }

  async updateCompany(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const existing = await this.companiesRepository.findByName(
        updateCompanyDto.name,
      );
      if (existing && existing.id !== id) {
        throw new BadRequestException('Company name already exists');
      }
    }

    if (updateCompanyDto.email && updateCompanyDto.email !== company.email) {
      const existing = await this.companiesRepository.findByEmail(
        updateCompanyDto.email,
      );
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (
      updateCompanyDto.commercialRegisterNumber &&
      updateCompanyDto.commercialRegisterNumber !==
        company.commercialRegisterNumber
    ) {
      const existing =
        await this.companiesRepository.findByCommercialRegisterNumber(
          updateCompanyDto.commercialRegisterNumber,
        );
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          'Commercial register number already exists',
        );
      }
    }

    if (
      updateCompanyDto.taxNumber &&
      updateCompanyDto.taxNumber !== company.taxNumber
    ) {
      const existing = await this.companiesRepository.findByTaxNumber(
        updateCompanyDto.taxNumber,
      );
      if (existing && existing.id !== id) {
        throw new BadRequestException('Tax number already exists');
      }
    }

    const updateData = { ...updateCompanyDto, updatedBy: userId };
    const updatedCompany = await this.companiesRepository.update(
      id,
      updateData,
    );

    if (!updatedCompany) {
      throw new NotFoundException('Company not found');
    }

    this.logger.info('Company updated', { id });

    return plainToInstance(CompanyResponseDto, updatedCompany, {
      excludeExtraneousValues: true,
    });
  }

  async deleteCompany(id: string): Promise<void> {
    const company = await this.companiesRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.userRepository.delete({ companyId: id });
    await this.companiesRepository.delete(id);

    this.logger.info('Company deleted', { id });
  }

  async deactivateCompany(id: string, userId: string): Promise<void> {
    const company = await this.companiesRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!company.active) {
      throw new BadRequestException('Company already inactive');
    }

    await this.companiesRepository.update(id, {
      active: false,
      updatedBy: userId,
      legalState: 'suspended',
    });
    await this.userRepository.update({ companyId: id }, { active: false });

    this.logger.info('Company deactivated', { id });
  }

  async activateCompany(id: string, userId: string): Promise<void> {
    const company = await this.companiesRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.active) {
      throw new BadRequestException('Company already active');
    }

    await this.companiesRepository.update(id, {
      active: true,
      updatedBy: userId,
      legalState: 'active',
    });
    await this.userRepository.update({ companyId: id }, { active: true });

    this.logger.info('Company activated', { id });
  }

  async getCompanyUsers(
    companyId: string,
    query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const company = await this.companiesRepository.findOne(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.usersRepository.findAndPaginateUsersByCompany(query, companyId);
  }
}
