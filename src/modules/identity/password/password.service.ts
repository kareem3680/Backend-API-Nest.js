/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import ms from 'ms';
import { User } from '../entities/user.entity';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../common/utils/logger.util';
import { jwtConfig } from '../../../config/jwt.config';

@Injectable()
export class PasswordService {
  private readonly logger = new LoggerService('forget-password');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async sendResetCode(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`No user found with this email: ${email}`);
    }

    const now = Date.now();
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.passwordResetCode = hashed;
    user.passwordResetCodeExpiresAt = new Date(now + 10 * 60 * 1000);
    user.passwordResetCodeVerified = false;
    user.lastResetCodeSentAt = new Date(now);

    const requests = user.resetCodeRequests || [];
    requests.push(new Date(now));
    user.resetCodeRequests = requests;

    await this.userRepository.save(user);

    try {
      await this.emailService.sendEmail({
        email: user.email!,
        subject: 'Reset your password',
        message: `Hello ${user.name}, your reset code is ${resetCode}. It expires in 10 minutes.`,
      });
      this.logger.info('Reset code sent successfully', { email });
    } catch {
      user.passwordResetCode = null;
      user.passwordResetCodeExpiresAt = null;
      user.passwordResetCodeVerified = null;
      await this.userRepository.save(user);
      throw new BadRequestException('Failed to send reset email');
    }
  }

  async resendResetCode(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`No user found with this email: ${email}`);
    }

    const now = Date.now();

    if (!user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
      throw new BadRequestException(
        "You haven't requested a reset code yet. Please request a code first.",
      );
    }

    if (
      user.lastResetCodeSentAt &&
      now - user.lastResetCodeSentAt.getTime() < 2 * 60 * 1000
    ) {
      const wait = Math.ceil(
        (2 * 60 * 1000 - (now - user.lastResetCodeSentAt.getTime())) / 1000,
      );
      throw new BadRequestException(
        `Please wait ${wait} seconds before requesting a new code`,
      );
    }

    const oneHourAgo = now - 60 * 60 * 1000;
    const recentRequests = (user.resetCodeRequests || []).filter(
      (t) => t.getTime() > oneHourAgo,
    );

    if (recentRequests.length >= 5) {
      throw new BadRequestException(
        'You have reached the limit reset code requests, try again later',
      );
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.passwordResetCode = hashed;
    user.passwordResetCodeExpiresAt = new Date(now + 10 * 60 * 1000);
    user.passwordResetCodeVerified = false;
    user.lastResetCodeSentAt = new Date(now);

    const requests = user.resetCodeRequests || [];
    requests.push(new Date(now));
    user.resetCodeRequests = requests;

    await this.userRepository.save(user);

    try {
      await this.emailService.sendEmail({
        email: user.email!,
        subject: 'Reset your password (Resent Code)',
        message: `Hello ${user.name}, your new reset code is ${resetCode}. It expires in 10 minutes.`,
      });
      this.logger.info('Reset code resent successfully', { email });
    } catch {
      throw new BadRequestException('Failed to resend reset email');
    }
  }

  async verifyResetCode(code: string): Promise<void> {
    const hashed = crypto.createHash('sha256').update(code).digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        passwordResetCode: hashed,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    if (
      user.passwordResetCodeExpiresAt &&
      user.passwordResetCodeExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    user.passwordResetCodeVerified = true;
    await this.userRepository.save(user);

    this.logger.info('Reset code verified successfully', { email: user.email });
  }

  async resetPassword(
    email: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`No user found with this email: ${email}`);
    }

    if (!user.passwordResetCodeVerified) {
      throw new BadRequestException('Reset code is not verified');
    }

    user.password = newPassword;
    user.passwordResetCode = null;
    user.passwordResetCodeExpiresAt = null;
    user.passwordResetCodeVerified = null;
    user.changedPasswordAt = new Date();

    const config = jwtConfig(this.configService);
    const expiresInSeconds = ms(config.accessExpiresIn as ms.StringValue);
    const refreshExpiresInSeconds = ms(
      config.refreshExpiresIn as ms.StringValue,
    );

    const accessToken = this.jwtService.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      { expiresIn: Math.floor(expiresInSeconds / 1000) },
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      { expiresIn: Math.floor(refreshExpiresInSeconds / 1000) },
    );

    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefresh;
    user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.userRepository.save(user);

    this.logger.info('Password reset successful', { email });

    return { accessToken, refreshToken };
  }

  async updateMyPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
  ): Promise<{
    user: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
  }> {
    if (newPassword !== newPasswordConfirm) {
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'name',
        'email',
        'password',
        'role',
        'companyId',
        'active',
        'refreshToken',
        'refreshTokenExpires',
        'changedPasswordAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is invalid');
    }

    user.password = newPassword;
    user.changedPasswordAt = new Date();

    const config = jwtConfig(this.configService);
    const expiresInSeconds = ms(config.accessExpiresIn as ms.StringValue);
    const refreshExpiresInSeconds = ms(
      config.refreshExpiresIn as ms.StringValue,
    );

    const accessToken = this.jwtService.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      { expiresIn: Math.floor(expiresInSeconds / 1000) },
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      { expiresIn: Math.floor(refreshExpiresInSeconds / 1000) },
    );

    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefresh;
    user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.userRepository.save(user);

    this.logger.info('Password updated successfully', { userId: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
