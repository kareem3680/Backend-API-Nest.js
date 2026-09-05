import { Expose, Type } from 'class-transformer';

export class PaginationMetaDto {
  @Expose()
  currentPage!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalDocs!: number;

  @Expose()
  totalPages!: number;

  @Expose()
  next?: number;

  @Expose()
  prev?: number;
}

export class PaginatedResponseDto<T> {
  @Expose()
  results!: number;

  @Expose()
  data!: T[];

  @Expose()
  @Type(() => PaginationMetaDto)
  pagination!: PaginationMetaDto;
}
