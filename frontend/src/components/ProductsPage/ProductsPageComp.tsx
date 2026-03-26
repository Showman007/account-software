import { useState, useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable.tsx';
import FormDialog from '../common/FormDialog.tsx';
import { FormField, FormSelectField } from '../common/FormField.tsx';
import { useCrud } from '../../hooks/useCrud.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { productsApi } from '../../api/resources.ts';
import type { Product } from '../../types/masters.ts';

const directionOptions = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'both', label: 'Both' },
];

const ProductsPageComp = () => {
  const crud = useCrud<Product>('products', productsApi);
  const { units } = useReferenceData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const unitOptions = useMemo(() => units.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })), [units]);
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'category', headerName: 'Category', width: 130 },
    { field: 'direction', headerName: 'Direction', width: 120 },
    { field: 'default_unit_id', headerName: 'Default Unit', width: 120, renderCell: (p) => { const u = units.find((u) => u.id === p.value); return u ? u.abbreviation : p.value; } },
  ];
  const defaults = useMemo(() => {
    if (editing) return { name: editing.name, category: editing.category, direction: editing.direction, default_unit_id: editing.default_unit_id };
    return { direction: 'inbound' };
  }, [editing]);
  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) crud.updateMutation.mutate({ id: editing.id, data: data as Partial<Product> }, { onSuccess: () => setDialogOpen(false) });
    else crud.createMutation.mutate(data as Partial<Product>, { onSuccess: () => setDialogOpen(false) });
  };
  return (
    <>
      <DataTable title="Products" columns={columns} rows={crud.data} loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
        onDelete={(row) => { if (window.confirm(`Delete product "${row.name}"?`)) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        mobileHiddenColumns={['id', 'default_unit_id']}
      />
      {dialogOpen && (
        <FormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit}
          title={editing ? 'Edit Product' : 'Add Product'} defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}>
          <FormField name="name" label="Name" required />
          <FormField name="category" label="Category" />
          <FormSelectField name="direction" label="Direction" options={directionOptions} required />
          <FormSelectField name="default_unit_id" label="Default Unit" options={unitOptions} />
        </FormDialog>
      )}
    </>
  );
};
export default ProductsPageComp;
