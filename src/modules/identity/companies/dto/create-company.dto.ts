import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import * as constants from '../../../../common/constants';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameAr!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  whatsapp!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(50)
  commercialRegisterNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  politicalManager!: string;

  @IsOptional()
  @IsString()
  activityType?: string;

  @IsOptional()
  @IsString()
  legalData?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(50)
  taxNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalEntityName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsIn(constants.COMPANY_LEGAL_STATES)
  legalState?: constants.CompanyLegalState;
}
