import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Product } from '../types/masters.ts';

/** Hardcoded category options for Inbound/Outbound entries */
export const CATEGORY_OPTIONS = [
  { value: 'paddy', label: 'Paddy' },
  { value: 'rice', label: 'Rice' },
  { value: 'by_product', label: 'By-Product' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Other' },
];

/**
 * Invisible component that watches `product_id` in a react-hook-form context
 * and auto-fills the `category` field from the selected product's category.
 *
 * Place inside a <FormProvider> (e.g. inside <FormDialog>).
 */
export function ProductCategorySync({ productMap }: { productMap: Map<number, Product> }) {
  const { watch, setValue } = useFormContext();
  const productId = watch('product_id');

  useEffect(() => {
    if (productId) {
      const product = productMap.get(Number(productId));
      if (product?.category) {
        setValue('category', product.category);
      }
    }
  }, [productId, productMap, setValue]);

  return null;
}
