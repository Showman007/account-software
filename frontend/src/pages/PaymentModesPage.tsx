import { useState, useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../components/common/DataTable.tsx';
import FormDialog from '../components/common/FormDialog.tsx';
import { FormField } from '../components/common/FormField.tsx';
import { useCrud } from '../hooks/useCrud.ts';
import { paymentModesApi } from '../api/resources.ts';
import type { PaymentMode } from '../types/masters.ts';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  { field: 'name', headerName: 'Name', flex: 1 },
];

export default function PaymentModesPage() {
  const crud = useCrud<PaymentMode>('payment_modes', paymentModesApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMode | null>(null);

  const defaults = useMemo(() => {
    if (editing) return { name: editing.name };
    return {};
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<PaymentMode> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<PaymentMode>, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <>
      <DataTable
        title="Payment Modes"
        columns={columns}
        rows={crud.data}
        loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
        onDelete={(row) => { if (window.confirm(`Delete payment mode "${row.name}"?`)) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        mobileHiddenColumns={['id']}
      />
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit Payment Mode' : 'Add Payment Mode'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <FormField name="name" label="Name" required />
        </FormDialog>
      )}
    </>
  );
}
