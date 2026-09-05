export interface PaginationResult {
  currentPage: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  next?: number;
  prev?: number;
}
