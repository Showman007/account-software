/** Common/shared types — Pagination, Query params, Attachment */

export interface Attachment {
  id: number;
  drive_file_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  drive_url: string;
  uploaded_by_id: number | null;
  created_at: string;
}

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
