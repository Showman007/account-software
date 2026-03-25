import { useState, useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../components/common/DataTable.tsx';
import FormDialog from '../components/common/FormDialog.tsx';
import { FormField } from '../components/common/FormField.tsx';
import { useCrud } from '../hooks/useCrud.ts';
import { unitsApi } from '../api/resources.ts';
import type { Unit } from '../types/models.ts';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'abbreviation', headerName: 'Abbreviation', width: 150 },
];

export default function UnitsPage() {
  const crud = useCrud<Unit>('units', unitsApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);

  const defaults = useMemo(() => {
    if (editing) return { name: editing.name, abbreviation: editing.abbreviation };
    return {};
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<Unit> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<Unit>, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <>
      <DataTable
        title="Units"
        columns={columns}
        rows={crud.data}
        loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
        onDelete={(row) => { if (window.confirm(`Delete unit "${row.name}"?`)) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        mobileHiddenColumns={['id']}
      />
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit Unit' : 'Add Unit'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <FormField name="name" label="Name" required />
          <FormField name="abbreviation" label="Abbreviation" required />
        </FormDialog>
      )}
    </>
  );
}
