import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities/company.entity';
import { BaseRepository } from '../../../../shared/database/base.repository';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class CompaniesRepository extends BaseRepository<Company> {
  constructor(
    @InjectRepository(Company)
    repository: Repository<Company>,
  ) {
    super(repository);
  }

  async findByName(name: string): Promise<Company | null> {
    return this.repository.findOne({ where: { name } });
  }

  async findByEmail(email: string): Promise<Company | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByCommercialRegisterNumber(
    number: string,
  ): Promise<Company | null> {
    return this.repository.findOne({
      where: { commercialRegisterNumber: number },
    });
  }

  async findByTaxNumber(number: string): Promise<Company | null> {
    return this.repository.findOne({ where: { taxNumber: number } });
  }

  async countCompanies(): Promise<number> {
    return this.repository.count();
  }

  async countActive(): Promise<number> {
    return this.repository.count({ where: { active: true } });
  }

  async countInactive(): Promise<number> {
    return this.repository.count({ where: { active: false } });
  }

  async findAndPaginateCompanies(
    query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<CompanyResponseDto>> {
    const queryBuilder = this.createQueryBuilder('company');

    return this.paginateWithFiltersAndDto(
      queryBuilder,
      query,
      CompanyResponseDto,
      ['company.name', 'company.email'],
    );
  }
}
