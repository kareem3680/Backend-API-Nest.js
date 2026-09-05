import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { Request } from '../../../common/interfaces/request.interface';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('me')
  async getMyProfile(@Req() req: Request): Promise<ProfileResponseDto> {
    return this.profileService.getMyProfile(req.user!._id);
  }

  @Patch('me')
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateMyProfile(req.user!._id, updateProfileDto);
  }
}
