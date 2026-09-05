import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import * as constants from '../../../../common/constants';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn?: string;

  @IsOptional()
  @IsString()
  companyImage?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  commercialRegisterNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  politicalManager?: string;

  @IsOptional()
  @IsString()
  activityType?: string;

  @IsOptional()
  @IsString()
  legalData?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  taxNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalEntityName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsIn(constants.COMPANY_LEGAL_STATES)
  legalState?: constants.CompanyLegalState;
}
