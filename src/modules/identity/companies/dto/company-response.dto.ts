import { Expose, Transform } from 'class-transformer';
import { Company } from '../../entities/company.entity';

export class CompanyResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.companyImage)
  companyImage?: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.nameAr)
  nameAr!: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.nameEn)
  nameEn!: string;

  @Expose()
  email!: string;

  @Expose()
  phone!: string;

  @Expose()
  whatsapp!: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.commercialRegisterNumber)
  commercialRegisterNumber!: string;

  @Expose()
  country!: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.politicalManager)
  politicalManager!: string;

  @Expose()
  activityType?: string;

  @Expose()
  legalData?: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.taxNumber)
  taxNumber!: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.legalEntityName)
  legalEntityName!: string;

  @Expose()
  city!: string;

  @Expose()
  legalState!: string;

  @Expose()
  active!: boolean;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.createdBy)
  createdBy?: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.updatedBy)
  updatedBy?: string;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.createdAt)
  createdAt!: Date;

  @Expose()
  @Transform(({ obj }: { obj: Company }) => obj.updatedAt)
  updatedAt!: Date;
}
