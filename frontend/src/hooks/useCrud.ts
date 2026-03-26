import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { ResourceApi } from '../api/resources.ts';
import type { QueryParams, PaginationMeta } from '../types/common.ts';

export interface UseCrudReturn<T> {
  data: T[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: Error | null;
  params: QueryParams;
  setParams: (p: QueryParams) => void;
  updateParams: (p: Partial<QueryParams>) => void;
  createMutation: ReturnType<typeof useMutation<T, Error, Partial<T>>>;
  updateMutation: ReturnType<typeof useMutation<T, Error, { id: number; data: Partial<T> }>>;
  deleteMutation: ReturnType<typeof useMutation<void, Error, number>>;
}

export function useCrud<T extends { id: number }>(
  resourceName: string,
  api: ResourceApi<T>
): UseCrudReturn<T> {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<QueryParams>({ page: 1, per_page: 25 });

  const updateParams = useCallback((p: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...p }));
  }, []);

  const queryKey = [resourceName, params];

  const { data: response, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => api.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: (newData: Partial<T>) => api.create(newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceName] });
      toast.success('Record created successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to create: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<T> }) => api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceName] });
      toast.success('Record updated successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceName] });
      toast.success('Record deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  return {
    data: response?.data ?? [],
    meta: response?.meta ?? null,
    isLoading,
    error: error as Error | null,
    params,
    setParams,
    updateParams,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
