import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { LoggerService } from '../../../common/utils/logger.util';

@Injectable()
export class ProfileService {
  private readonly logger = new LoggerService('profile');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getMyProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`No user found with ID: ${userId}`);
    }

    this.logger.info('Fetched user profile', { userId });
    return plainToInstance(ProfileResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async updateMyProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const { name, email, phone, profileImage } = updateData;

    if (email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingEmail && existingEmail.id !== userId) {
        throw new BadRequestException('This email is already in use.');
      }
    }

    const updateFields: Record<string, unknown> = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (email) updateFields.email = email;
    if (profileImage) updateFields.profileImage = profileImage;

    await this.userRepository.update(userId, updateFields);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`No user found with ID: ${userId}`);
    }

    this.logger.info('Updated user profile', { userId });
    return plainToInstance(ProfileResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
