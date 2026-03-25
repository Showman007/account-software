import { useQuery } from '@tanstack/react-query';
import {
  productsApi,
  unitsApi,
  expenseCategoriesApi,
  paymentModesApi,
  partiesApi,
} from '../api/resources.ts';
import type { Product, Unit, ExpenseCategory, PaymentMode, Party } from '../types/models.ts';

export function useReferenceData() {
  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsApi.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units', 'all'],
    queryFn: () => unitsApi.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: expenseCategoriesData } = useQuery({
    queryKey: ['expense_categories', 'all'],
    queryFn: () => expenseCategoriesApi.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: paymentModesData } = useQuery({
    queryKey: ['payment_modes', 'all'],
    queryFn: () => paymentModesApi.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: partiesData } = useQuery({
    queryKey: ['parties', 'all'],
    queryFn: () => partiesApi.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const products = productsData?.data ?? [];
  const units = unitsData?.data ?? [];
  const expenseCategories = expenseCategoriesData?.data ?? [];
  const paymentModes = paymentModesData?.data ?? [];
  const parties = partiesData?.data ?? [];

  const productMap = new Map<number, Product>();
  for (const p of products) productMap.set(p.id, p);

  const unitMap = new Map<number, Unit>();
  for (const u of units) unitMap.set(u.id, u);

  const expenseCategoryMap = new Map<number, ExpenseCategory>();
  for (const c of expenseCategories) expenseCategoryMap.set(c.id, c);

  const paymentModeMap = new Map<number, PaymentMode>();
  for (const m of paymentModes) paymentModeMap.set(m.id, m);

  const partyMap = new Map<number, Party>();
  for (const p of parties) partyMap.set(p.id, p);

  return {
    products,
    units,
    expenseCategories,
    paymentModes,
    parties,
    productMap,
    unitMap,
    expenseCategoryMap,
    paymentModeMap,
    partyMap,
  };
}
