export interface ApiFeaturesOptions {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  keyword?: string;
  searchFields?: string[];
  from?: Date;
  to?: Date;
  populate?: string[];
  filters?: FilterOperator;
  [key: string]: unknown;
}

export interface FilterOperator {
  [key: string]: {
    [operator: string]: string | number | Date | (string | number)[];
  };
}
