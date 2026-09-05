import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompaniesRepository } from './repository/companies.repository';
import { UsersRepository } from '../users/repository/users.repository';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User])],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository, UsersRepository],
  exports: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}
