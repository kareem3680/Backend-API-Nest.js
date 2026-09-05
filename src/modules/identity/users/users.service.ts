import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { UsersRepository } from './repository/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../common/utils/logger.util';
import { isGlobalRole, GLOBAL_ROLES } from '../../../common/constants';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new LoggerService('admin');

  constructor(
    private usersRepository: UsersRepository,
    private emailService: EmailService,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async createUser(
    requesterRole: string,
    requesterCompanyId: string | null | undefined,
    createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const {
      role,
      companyId: bodyCompanyId,
      password,
      passwordConfirmation,
      ...rest
    } = createUserDto;

    if (password !== passwordConfirmation) {
      throw new BadRequestException(
        'Password confirmation does not match password',
      );
    }

    if (role === 'admin' && requesterRole !== 'super-admin') {
      throw new ForbiddenException('Only super admin can create admin user');
    }

    let companyIdToUse: string | null = null;
    const isRequesterGlobal = isGlobalRole(requesterRole);

    if (isRequesterGlobal) {
      if ((GLOBAL_ROLES as readonly string[]).includes(role)) {
        companyIdToUse = null;
      } else {
        if (!bodyCompanyId) {
          throw new BadRequestException(
            'Company ID is required for global roles',
          );
        }
        companyIdToUse = bodyCompanyId;
      }
    } else {
      if (!requesterCompanyId) {
        throw new BadRequestException('Company context is required');
      }
      companyIdToUse = requesterCompanyId;
    }

    if (companyIdToUse) {
      const company = await this.companyRepository.findOne({
        where: { id: companyIdToUse },
      });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    // Email validation for all users
    if (!rest.email) {
      throw new BadRequestException('Email is required');
    }

    const existingEmail = await this.usersRepository.findByEmail(rest.email);
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    const userData: Partial<User> = {
      ...rest,
      role,
      companyId: companyIdToUse,
      password,
    };

    const newUser = await this.usersRepository.create(userData);

    // Send welcome email
    this.emailService
      .sendEmail({
        email: newUser.email!,
        subject: 'Welcome to Backend API!',
        message:
          'Your account has been successfully created!\nThank you for joining us.',
      })
      .catch((err: Error) =>
        this.logger.error('Email sending failed', { error: err.message }),
      );

    this.logger.info('User created', {
      userId: newUser.id,
      companyId: companyIdToUse,
      role: role,
    });

    return plainToInstance(UserResponseDto, newUser, {
      excludeExtraneousValues: true,
    });
  }

  async getUsers(
    requesterRole: string,
    requesterCompanyId: string | null | undefined,
    query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const isGlobal = isGlobalRole(requesterRole);
    const companyId = isGlobal ? null : requesterCompanyId;

    return this.usersRepository.findAndPaginateUsers(query, companyId);
  }

  async getUser(
    id: string,
    requesterRole: string,
    requesterCompanyId: string | null | undefined,
  ): Promise<UserResponseDto> {
    const isGlobal = isGlobalRole(requesterRole);

    let user: User | null;
    if (isGlobal) {
      user = await this.usersRepository.findOne(id);
    } else {
      const whereCondition: FindOptionsWhere<User> = {
        id,
        companyId: requesterCompanyId ?? undefined,
      };
      user = await this.usersRepository.findOneByCondition(whereCondition);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.info('Fetched user', { id });

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async updateUserRole(
    id: string,
    updateUserDto: UpdateUserDto,
    requesterRole: string,
    requesterCompanyId: string | null | undefined,
  ): Promise<UserResponseDto> {
    if (!updateUserDto.role) {
      throw new BadRequestException('Role is required');
    }

    const isGlobal = isGlobalRole(requesterRole);

    let user: User | null;
    if (isGlobal) {
      user = await this.usersRepository.findOne(id);
    } else {
      const whereCondition: FindOptionsWhere<User> = {
        id,
        companyId: requesterCompanyId ?? undefined,
      };
      user = await this.usersRepository.findOneByCondition(whereCondition);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = updateUserDto.role;
    const updatedUser = await this.usersRepository.getRepository().save(user);

    this.logger.info('User role updated', { id, role: updateUserDto.role });
    return plainToInstance(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async deactivateUser(
    id: string,
    requesterRole: string,
    requesterCompanyId: string | null | undefined,
  ): Promise<void> {
    const isGlobal = isGlobalRole(requesterRole);

    let user: User | null;
    if (isGlobal) {
      user = await this.usersRepository.findOne(id);
    } else {
      const whereCondition: FindOptionsWhere<User> = {
        id,
        companyId: requesterCompanyId ?? undefined,
      };
      user = await this.usersRepository.findOneByCondition(whereCondition);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.active = false;
    await this.usersRepository.getRepository().save(user);

    this.logger.info('User deactivated', { id });
  }

  async activateUser(
    id: string,
    requesterRole: string,
    requesterCompanyId: string | null | undefined,
  ): Promise<void> {
    const isGlobal = isGlobalRole(requesterRole);

    let user: User | null;
    if (isGlobal) {
      user = await this.usersRepository.findOne(id);
    } else {
      const whereCondition: FindOptionsWhere<User> = {
        id,
        companyId: requesterCompanyId ?? undefined,
      };
      user = await this.usersRepository.findOneByCondition(whereCondition);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.active = true;
    await this.usersRepository.getRepository().save(user);

    this.logger.info('User activated', { id });
  }
}
