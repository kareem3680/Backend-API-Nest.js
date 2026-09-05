import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
  IsUUID,
  IsIn,
} from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsString()
  refId?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  importance?: string;

  @IsOptional()
  @IsUUID()
  from?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toRole?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  toUser?: string[];

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
