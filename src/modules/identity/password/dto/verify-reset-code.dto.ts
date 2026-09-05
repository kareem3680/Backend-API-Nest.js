import { IsString } from 'class-validator';

export class VerifyResetCodeDto {
  @IsString()
  resetCode!: string;
}
