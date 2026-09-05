import {
  Controller,
  Post,
  Put,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PasswordService } from './password.service';
import { SendResetCodeDto } from './dto/send-reset-code.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { Request } from '../../../common/interfaces/request.interface';

@Controller('forget-password')
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Public()
  @Post('send-reset-code')
  async sendResetCode(
    @Body() sendResetCodeDto: SendResetCodeDto,
  ): Promise<{ status: string; message: string }> {
    await this.passwordService.sendResetCode(sendResetCodeDto.email);
    return {
      status: 'success',
      message: 'Reset code sent to your email',
    };
  }

  @Public()
  @Post('resend-reset-code')
  async resendResetCode(
    @Body() sendResetCodeDto: SendResetCodeDto,
  ): Promise<{ status: string; message: string }> {
    await this.passwordService.resendResetCode(sendResetCodeDto.email);
    return {
      status: 'success',
      message: 'Reset code resent successfully',
    };
  }

  @Public()
  @Post('verify-reset-code')
  async verifyResetCode(
    @Body() verifyResetCodeDto: VerifyResetCodeDto,
  ): Promise<{ status: string; message: string }> {
    await this.passwordService.verifyResetCode(verifyResetCodeDto.resetCode);
    return {
      status: 'success',
      message: 'Reset code verified successfully',
    };
  }

  @Public()
  @Put('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{
    status: string;
    message: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const { accessToken, refreshToken } =
      await this.passwordService.resetPassword(
        resetPasswordDto.email,
        resetPasswordDto.newPassword,
        resetPasswordDto.confirmNewPassword,
      );
    return {
      status: 'success',
      message: 'Password has been reset successfully',
      accessToken,
      refreshToken,
    };
  }
}

@Controller('update-password')
export class UpdatePasswordController {
  constructor(private passwordService: PasswordService) {}

  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateMyPassword(
    @Req() req: Request,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{
    status: string;
    message: string;
    data: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
  }> {
    const result = await this.passwordService.updateMyPassword(
      req.user!._id,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword,
      updatePasswordDto.newPasswordConfirm,
    );
    return {
      status: 'success',
      message: 'Password updated successfully',
      data: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
