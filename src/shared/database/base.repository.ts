import {
  Repository,
  ObjectLiteral,
  FindOptionsWhere,
  SelectQueryBuilder,
} from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { ApiFeatures } from '../../common/utils/api-features.util';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  PaginatedResponseDto,
  PaginationMetaDto,
} from '../../common/dto/paginated-response.dto';
import { ClassConstructor } from '../../common/interfaces/class-constructor.interface';

export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as T);
    return this.repository.save(entity);
  }

  async findOne(id: string): Promise<T | null> {
    const whereClause = { id } as unknown as FindOptionsWhere<T>;
    return this.repository.findOne({ where: whereClause });
  }

  async findOneByCondition(condition: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where: condition });
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  async paginate(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    searchFields: string[] = [],
  ): Promise<PaginatedResponseDto<T>> {
    const apiFeatures = new ApiFeatures<T>(queryBuilder, {
      page: paginationDto.page,
      limit: paginationDto.limit,
      sort: paginationDto.sort,
      fields: paginationDto.fields,
      keyword: paginationDto.keyword,
      searchFields,
    });

    const [data, total] = await apiFeatures.build().getManyAndCount();
    const paginationResult = apiFeatures.getPaginationResult();

    const paginationMeta = new PaginationMetaDto();
    paginationMeta.currentPage =
      paginationResult?.currentPage ?? paginationDto.page;
    paginationMeta.limit = paginationResult?.limit ?? paginationDto.limit;
    paginationMeta.totalDocs = total;
    paginationMeta.totalPages = paginationResult?.totalPages ?? 1;
    paginationMeta.next = paginationResult?.next;
    paginationMeta.prev = paginationResult?.prev;

    const response = new PaginatedResponseDto<T>();
    response.data = data;
    response.results = data.length;
    response.pagination = paginationMeta;

    return response;
  }

  async paginateWithDto<DTO>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    dtoClass: ClassConstructor<DTO>,
    searchFields: string[] = [],
  ): Promise<PaginatedResponseDto<DTO>> {
    const apiFeatures = new ApiFeatures<T>(queryBuilder, {
      page: paginationDto.page,
      limit: paginationDto.limit,
      sort: paginationDto.sort,
      fields: paginationDto.fields,
      keyword: paginationDto.keyword,
      searchFields,
    });

    const [data, total] = await apiFeatures.build().getManyAndCount();
    const paginationResult = apiFeatures.getPaginationResult();

    const paginationMeta = new PaginationMetaDto();
    paginationMeta.currentPage =
      paginationResult?.currentPage ?? paginationDto.page;
    paginationMeta.limit = paginationResult?.limit ?? paginationDto.limit;
    paginationMeta.totalDocs = total;
    paginationMeta.totalPages = paginationResult?.totalPages ?? 1;
    paginationMeta.next = paginationResult?.next;
    paginationMeta.prev = paginationResult?.prev;

    const response = new PaginatedResponseDto<DTO>();
    response.data = plainToInstance(dtoClass, data, {
      excludeExtraneousValues: true,
    });
    response.results = data.length;
    response.pagination = paginationMeta;

    return response;
  }

  async paginateWithFilters(
    queryBuilder: SelectQueryBuilder<T>,
    query: Record<string, unknown>,
    searchFields: string[] = [],
  ): Promise<PaginatedResponseDto<T>> {
    const apiFeatures = ApiFeatures.fromRequest<T>(
      queryBuilder,
      query,
      searchFields,
    );

    const [data, total] = await apiFeatures.getManyAndCount();
    const paginationResult = apiFeatures.getPaginationResult();

    const paginationMeta = new PaginationMetaDto();
    paginationMeta.currentPage = paginationResult?.currentPage ?? 1;
    paginationMeta.limit = paginationResult?.limit ?? 10;
    paginationMeta.totalDocs = total;
    paginationMeta.totalPages = paginationResult?.totalPages ?? 1;
    paginationMeta.next = paginationResult?.next;
    paginationMeta.prev = paginationResult?.prev;

    const response = new PaginatedResponseDto<T>();
    response.data = data;
    response.results = data.length;
    response.pagination = paginationMeta;

    return response;
  }

  async paginateWithFiltersAndDto<DTO>(
    queryBuilder: SelectQueryBuilder<T>,
    query: Record<string, unknown>,
    dtoClass: ClassConstructor<DTO>,
    searchFields: string[] = [],
  ): Promise<PaginatedResponseDto<DTO>> {
    const apiFeatures = ApiFeatures.fromRequest<T>(
      queryBuilder,
      query,
      searchFields,
    );

    const [data, total] = await apiFeatures.getManyAndCount();
    const paginationResult = apiFeatures.getPaginationResult();

    const paginationMeta = new PaginationMetaDto();
    paginationMeta.currentPage = paginationResult?.currentPage ?? 1;
    paginationMeta.limit = paginationResult?.limit ?? 10;
    paginationMeta.totalDocs = total;
    paginationMeta.totalPages = paginationResult?.totalPages ?? 1;
    paginationMeta.next = paginationResult?.next;
    paginationMeta.prev = paginationResult?.prev;

    const response = new PaginatedResponseDto<DTO>();
    response.data = plainToInstance(dtoClass, data, {
      excludeExtraneousValues: true,
    });
    response.results = data.length;
    response.pagination = paginationMeta;

    return response;
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
}
