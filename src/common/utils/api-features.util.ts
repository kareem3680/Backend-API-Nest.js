import { ObjectLiteral, SelectQueryBuilder, Brackets } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  ApiFeaturesOptions,
  FilterOperator,
} from '../interfaces/api-features-options.interface';
import { PaginationResult } from '../interfaces/pagination-result.interface';

export class ApiFeatures<T extends ObjectLiteral> {
  private queryBuilder: SelectQueryBuilder<T>;
  private queryString: ApiFeaturesOptions;
  private paginationResult?: PaginationResult;
  private readonly entityAlias: string;
  private readonly excludedFields: string[] = [
    'page',
    'limit',
    'sort',
    'fields',
    'keyword',
    'searchFields',
    'from',
    'to',
    'populate',
    'filters',
  ];
  private readonly validOperators: string[] = [
    'gte',
    'gt',
    'lte',
    'lt',
    'eq',
    'ne',
    'in',
    'nin',
  ];

  constructor(
    queryBuilder: SelectQueryBuilder<T>,
    queryString: ApiFeaturesOptions,
  ) {
    this.queryBuilder = queryBuilder;
    this.queryString = queryString;
    this.entityAlias = this.queryBuilder.alias;
  }

  static fromRequest<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    query: Record<string, unknown>,
    searchFields: string[] = [],
  ): ApiFeatures<T> {
    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10;
    const sort = query.sort as string;
    const fields = query.fields as string;
    const keyword = query.keyword as string;
    const from = query.from ? new Date(query.from as string) : undefined;
    const to = query.to ? new Date(query.to as string) : undefined;
    const populate = query.populate
      ? (query.populate as string).split(',')
      : undefined;

    let filters: FilterOperator | undefined;

    Object.keys(query).forEach((key) => {
      const match = key.match(/^filters\[(.+?)\]\[(.+?)\]$/);
      if (match) {
        const [, field, operator] = match;
        if (!filters) filters = {};
        if (!filters[field]) filters[field] = {};
        const value = query[key];
        if (typeof value === 'string' && !isNaN(Number(value))) {
          filters[field][operator] = Number(value);
        } else {
          filters[field][operator] = value as string;
        }
      }
    });

    const dynamicFilters: Record<string, unknown> = {};
    Object.keys(query).forEach((key) => {
      if (
        ![
          'page',
          'limit',
          'sort',
          'fields',
          'keyword',
          'from',
          'to',
          'populate',
          'filters',
          'searchFields',
        ].includes(key) &&
        !key.startsWith('filters[')
      ) {
        dynamicFilters[key] = query[key];
      }
    });

    return new ApiFeatures<T>(queryBuilder, {
      page,
      limit,
      sort,
      fields,
      keyword,
      searchFields,
      from,
      to,
      populate,
      filters,
      ...dynamicFilters,
    });
  }

  private toSnakeCase(str: string): string {
    if (str.includes('_')) {
      return str;
    }
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private parseValue(value: unknown): string | number | boolean {
    if (typeof value === 'string') {
      if (!isNaN(Number(value))) {
        return Number(value);
      }
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
    return value as string;
  }

  filter(): this {
    if (
      this.queryString.keyword &&
      this.queryString.searchFields &&
      this.queryString.searchFields.length > 0
    ) {
      this.queryBuilder.andWhere(
        new Brackets((qb) => {
          this.queryString.searchFields!.forEach((field, index) => {
            let snakeField = this.toSnakeCase(field);
            if (!snakeField.includes('.')) {
              snakeField = `${this.entityAlias}.${snakeField}`;
            }
            const condition = `LOWER(${snakeField}) LIKE LOWER(:keyword${index})`;
            if (index === 0) {
              qb.where(condition, {
                [`keyword${index}`]: `%${this.queryString.keyword}%`,
              });
            } else {
              qb.orWhere(condition, {
                [`keyword${index}`]: `%${this.queryString.keyword}%`,
              });
            }
          });
        }),
      );
    }
    return this;
  }

  filterByFields(): this {
    const filterFields: Record<string, unknown> = {};

    Object.keys(this.queryString).forEach((key) => {
      if (key.includes('[') || key.includes(']')) {
        return;
      }

      if (
        !this.excludedFields.includes(key) &&
        this.queryString[key] !== undefined
      ) {
        filterFields[key] = this.queryString[key];
      }
    });

    if (this.queryString.filters) {
      Object.entries(this.queryString.filters).forEach(([field, operators]) => {
        Object.entries(operators).forEach(([operator, value]) => {
          if (this.validOperators.includes(operator)) {
            if (typeof value === 'object' && value !== null) {
              return;
            }
            this.applyOperator(field, operator, value);
          }
        });
      });
    }

    Object.entries(filterFields).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        let snakeField = this.toSnakeCase(field);
        if (!snakeField.includes('.')) {
          snakeField = `${this.entityAlias}.${snakeField}`;
        }
        const parsedValue = this.parseValue(value);
        this.queryBuilder.andWhere(`${snakeField} = :${field}`, {
          [field]: parsedValue,
        });
      }
    });

    return this;
  }

  private applyOperator(field: string, operator: string, value: unknown): void {
    const paramKey = `${field}_${operator}`;
    let snakeField = this.toSnakeCase(field);
    if (!snakeField.includes('.')) {
      snakeField = `${this.entityAlias}.${snakeField}`;
    }
    const parsedValue = this.parseValue(value);

    switch (operator) {
      case 'gte':
        this.queryBuilder.andWhere(`${snakeField} >= :${paramKey}`, {
          [paramKey]: parsedValue,
        });
        break;
      case 'gt':
        this.queryBuilder.andWhere(`${snakeField} > :${paramKey}`, {
          [paramKey]: parsedValue,
        });
        break;
      case 'lte':
        this.queryBuilder.andWhere(`${snakeField} <= :${paramKey}`, {
          [paramKey]: parsedValue,
        });
        break;
      case 'lt':
        this.queryBuilder.andWhere(`${snakeField} < :${paramKey}`, {
          [paramKey]: parsedValue,
        });
        break;
      case 'eq':
        this.queryBuilder.andWhere(`${snakeField} = :${paramKey}`, {
          [paramKey]: parsedValue,
        });
        break;
      case 'ne':
        this.queryBuilder.andWhere(`${snakeField} != :${paramKey}`, {
          [paramKey]: parsedValue,
        });
        break;
      case 'in':
        if (Array.isArray(value)) {
          this.queryBuilder.andWhere(`${snakeField} IN (:...${paramKey})`, {
            [paramKey]: value,
          });
        }
        break;
      case 'nin':
        if (Array.isArray(value)) {
          this.queryBuilder.andWhere(`${snakeField} NOT IN (:...${paramKey})`, {
            [paramKey]: value,
          });
        }
        break;
      default:
        throw new BadRequestException(`Invalid operator: ${operator}`);
    }
  }

  dateRange(): this {
    if (this.queryString.from && this.queryString.to) {
      this.queryBuilder.andWhere(
        `${this.entityAlias}.created_at BETWEEN :from AND :to`,
        {
          from: this.queryString.from,
          to: this.queryString.to,
        },
      );
    } else if (this.queryString.from) {
      this.queryBuilder.andWhere(`${this.entityAlias}.created_at >= :from`, {
        from: this.queryString.from,
      });
    } else if (this.queryString.to) {
      this.queryBuilder.andWhere(`${this.entityAlias}.created_at <= :to`, {
        to: this.queryString.to,
      });
    }
    return this;
  }

  sort(defaultSort: string = 'created_at'): this {
    if (this.queryString.sort && this.queryString.sort.trim() !== '') {
      const sortItems = this.queryString.sort
        .split(',')
        .map((field) => {
          const trimmed = field.trim();
          if (!trimmed) return null;
          const isDesc = trimmed.startsWith('-');
          let fieldName = isDesc ? trimmed.substring(1) : trimmed;
          fieldName = this.toSnakeCase(fieldName);
          if (!fieldName.includes('.')) {
            fieldName = `${this.entityAlias}.${fieldName}`;
          }
          return { fieldName, isDesc };
        })
        .filter(
          (item): item is { fieldName: string; isDesc: boolean } =>
            item !== null,
        );

      if (sortItems.length > 0) {
        const first = sortItems[0];
        this.queryBuilder.orderBy(
          first.fieldName,
          first.isDesc ? 'DESC' : 'ASC',
        );

        for (let i = 1; i < sortItems.length; i++) {
          const item = sortItems[i];
          this.queryBuilder.addOrderBy(
            item.fieldName,
            item.isDesc ? 'DESC' : 'ASC',
          );
        }
      } else {
        this.queryBuilder.orderBy(`${this.entityAlias}.${defaultSort}`, 'DESC');
      }
    } else {
      this.queryBuilder.orderBy(`${this.entityAlias}.${defaultSort}`, 'DESC');
    }
    return this;
  }

  select(): this {
    if (this.queryString.fields) {
      const fields = this.queryString.fields
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f !== '');

      if (!fields.includes('id')) {
        fields.unshift('id');
      }

      const selectedFields = fields.map(
        (f) => `${this.entityAlias}.${this.toSnakeCase(f)}`,
      );
      this.queryBuilder.select(selectedFields);
    }
    return this;
  }

  populate(): this {
    if (this.queryString.populate && this.queryString.populate.length > 0) {
      this.queryString.populate.forEach((relation) => {
        const snakeRelation = this.toSnakeCase(relation);
        this.queryBuilder.leftJoinAndSelect(
          `${this.entityAlias}.${snakeRelation}`,
          snakeRelation,
        );
      });
    }
    return this;
  }

  async paginate(): Promise<this> {
    const page = this.queryString.page || 1;
    const limit = this.queryString.limit || 10;
    const skip = (page - 1) * limit;

    const totalDocs = await this.queryBuilder.getCount();
    const totalPages = Math.ceil(totalDocs / limit);

    this.paginationResult = {
      currentPage: page,
      limit,
      totalDocs,
      totalPages,
      next: page < totalPages ? page + 1 : undefined,
      prev: page > 1 ? page - 1 : undefined,
    };

    this.queryBuilder.skip(skip).take(limit);
    return this;
  }

  build(): this {
    return this.filterByFields()
      .filter()
      .dateRange()
      .populate()
      .sort()
      .select();
  }

  async getManyAndCount(): Promise<[T[], number]> {
    this.build();
    await this.paginate();
    const data = await this.queryBuilder.getMany();
    return [data, this.paginationResult?.totalDocs || 0];
  }

  getQueryBuilder(): SelectQueryBuilder<T> {
    return this.queryBuilder;
  }

  getPaginationResult(): PaginationResult | undefined {
    return this.paginationResult;
  }
}
