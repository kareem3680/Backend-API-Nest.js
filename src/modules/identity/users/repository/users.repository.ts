import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { BaseRepository } from '../../../../shared/database/base.repository';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: [
        'id',
        'name',
        'email',
        'password',
        'role',
        'companyId',
        'active',
        'fcmTokens',
        'refreshToken',
        'refreshTokenExpires',
        'changedPasswordAt',
      ],
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.repository.update(userId, {
      refreshToken,
      refreshTokenExpires: expiresAt,
    });
  }

  async countByCompany(companyId: string): Promise<number> {
    return this.repository.count({ where: { companyId } });
  }

  async countByRole(companyId: string | null, role: string): Promise<number> {
    const where: Record<string, unknown> = { role };
    if (companyId) {
      where.companyId = companyId;
    }
    return this.repository.count({ where });
  }

  async findAndPaginateUsers(
    query: Record<string, unknown>,
    companyId: string | null = null,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const queryBuilder = this.createQueryBuilder('user');

    if (companyId) {
      queryBuilder.andWhere('user.companyId = :companyId', { companyId });
    }

    return this.paginateWithFiltersAndDto(
      queryBuilder,
      query,
      UserResponseDto,
      ['user.name', 'user.email'],
    );
  }

  async findAndPaginateUsersByCompany(
    query: Record<string, unknown>,
    companyId: string,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const queryBuilder = this.createQueryBuilder('user');
    queryBuilder.andWhere('user.companyId = :companyId', { companyId });

    return this.paginateWithFiltersAndDto(
      queryBuilder,
      query,
      UserResponseDto,
      ['user.name', 'user.email'],
    );
  }

  async findUsersByIds(
    ids: string[],
    companyId: string | null,
  ): Promise<User[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids });

    if (companyId) {
      queryBuilder.andWhere('user.companyId = :companyId', { companyId });
    }

    return queryBuilder.getMany();
  }

  async findUsersByRoles(roles: string[], companyId: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles })
      .andWhere('user.companyId = :companyId', { companyId })
      .andWhere('user.active = :active', { active: true })
      .getMany();
  }
}
