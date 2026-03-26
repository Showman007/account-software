/** Common/shared types — Pagination, Query params */

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface QueryParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort?: string;
  order?: string;
  from_date?: string;
  to_date?: string;
  [key: string]: string | number | undefined;
}
