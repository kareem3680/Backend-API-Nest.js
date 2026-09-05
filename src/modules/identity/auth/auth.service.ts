import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import ms from 'ms';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersRepository } from '../users/repository/users.repository';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../common/utils/logger.util';
import { User } from '../entities/user.entity';
import { jwtConfig } from '../../../config/jwt.config';

@Injectable()
export class AuthService {
  private readonly logger = new LoggerService('auth');

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ _id: string; role: string; companyId?: string | null } | null> {
    const user = await this.usersRepository.findByEmailWithPassword(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.active) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact support.',
      );
    }

    return {
      _id: user.id,
      role: user.role,
      companyId: user.companyId,
    };
  }

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    if (signupDto.password !== signupDto.passwordConfirmation) {
      throw new ConflictException(
        'Password confirmation does not match password',
      );
    }

    const existingUser = await this.usersRepository.findByEmail(
      signupDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordConfirmation, ...userData } = signupDto;
    const user = await this.usersRepository.create({
      ...userData,
      role: 'admin',
    });

    const accessToken = this.createAccessToken(user);
    const refreshTokenObj = await this.createRefreshToken(user);

    await this.usersRepository.updateRefreshToken(
      user.id,
      refreshTokenObj.hashed,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    this.emailService
      .sendEmail({
        email: user.email!,
        subject: 'Welcome to Backend API!',
        message:
          'Your account has been successfully created!\nThank you for joining us.',
      })
      .catch((err: Error) =>
        this.logger.error('Email sending failed', { error: err.message }),
      );

    this.logger.info('User registered successfully', { email: user.email });

    const response = new AuthResponseDto();
    response.user = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    response.accessToken = accessToken;
    response.refreshToken = refreshTokenObj.token;

    return response;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const validatedUser = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!validatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersRepository.findOne(validatedUser._id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (loginDto.fcmToken && !user.fcmTokens.includes(loginDto.fcmToken)) {
      user.fcmTokens.push(loginDto.fcmToken);
      await this.usersRepository.update(user.id, { fcmTokens: user.fcmTokens });
    }

    const accessToken = this.createAccessToken(user);
    const refreshTokenObj = await this.createRefreshToken(user);

    await this.usersRepository.updateRefreshToken(
      user.id,
      refreshTokenObj.hashed,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    this.logger.info('User logged in successfully', { userId: user.id });

    const response = new AuthResponseDto();
    response.user = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    response.accessToken = accessToken;
    response.refreshToken = refreshTokenObj.token;

    return response;
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    if (!token) {
      throw new UnauthorizedException('Refresh token required');
    }

    let decoded: { userId: string };
    try {
      decoded = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findOne(decoded.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await user.compareRefreshToken(token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.createAccessToken(user);

    return { accessToken };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersRepository.updateRefreshToken(userId, null, null);
    return { message: 'Logged out successfully' };
  }

  private createAccessToken(user: User): string {
    const config = jwtConfig(this.configService);
    const expiresInSeconds = ms(config.accessExpiresIn as ms.StringValue);

    return this.jwtService.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      { expiresIn: Math.floor(expiresInSeconds / 1000) },
    );
  }

  private async createRefreshToken(
    user: User,
  ): Promise<{ token: string; hashed: string }> {
    const config = jwtConfig(this.configService);
    const expiresInSeconds = ms(config.refreshExpiresIn as ms.StringValue);

    const token = this.jwtService.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      { expiresIn: Math.floor(expiresInSeconds / 1000) },
    );
    const hashed = await bcrypt.hash(token, 12);
    return { token, hashed };
  }
}
