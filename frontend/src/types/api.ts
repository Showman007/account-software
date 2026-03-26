/** API-specific types — Resource API, Query Runner */

import type { QueryParams, PaginatedResponse } from './common.ts';

export interface ResourceApi<T> {
  getAll(params?: QueryParams): Promise<PaginatedResponse<T>>;
  getOne(id: number): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  duration_ms: number;
}

export interface TableInfo {
  name: string;
  columns: { name: string; type: string; nullable: boolean }[];
}
