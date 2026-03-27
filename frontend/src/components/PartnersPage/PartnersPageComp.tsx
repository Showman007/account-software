import { useState, useMemo } from 'react';
import { Chip } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable.tsx';
import FormDialog from '../common/FormDialog.tsx';
import { FormField, FormDateField, FormSelectField } from '../common/FormField.tsx';
import { useCrud } from '../../hooks/useCrud.ts';
import { partnersApi } from '../../api/resources.ts';
import ExportButton from '../common/ExportButton.tsx';
import FilterBar from '../common/FilterBar.tsx';
import type { FilterFieldConfig } from '../common/FilterBar.tsx';
import type { Partner } from '../../types/partners.ts';

const shareTypeOptions = [{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed' }];
const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

const filterConfig: FilterFieldConfig[] = [
  { type: 'select', name: 'status', label: 'Status', options: statusOptions },
];

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'phone', headerName: 'Phone', width: 130 },
  { field: 'date_joined', headerName: 'Date Joined', width: 120 },
  { field: 'profit_share_type', headerName: 'Share Type', width: 120 },
  { field: 'profit_share_rate', headerName: 'Share Rate', width: 110 },
  { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => <Chip label={(p.value as string).toUpperCase()} color={p.value === 'active' ? 'success' : 'default'} size="small" /> },
];

const PartnersPageComp = () => {
  const crud = useCrud<Partner>('partners', partnersApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);

  const defaults = useMemo(() => {
    if (editing) return { name: editing.name, phone: editing.phone, date_joined: editing.date_joined, profit_share_type: editing.profit_share_type, profit_share_rate: editing.profit_share_rate, status: editing.status };
    return { date_joined: new Date().toISOString().slice(0, 10), profit_share_type: 'percentage', profit_share_rate: 0, status: 'active' };
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) crud.updateMutation.mutate({ id: editing.id, data: data as Partial<Partner> }, { onSuccess: () => setDialogOpen(false) });
    else crud.createMutation.mutate(data as Partial<Partner>, { onSuccess: () => setDialogOpen(false) });
  };

  return (
    <>
      <FilterBar filters={filterConfig} params={crud.params} updateParams={crud.updateParams} />
      <DataTable title="Partners" columns={columns} rows={crud.data} loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
        onDelete={(row) => { if (window.confirm(`Delete partner "${row.name}"?`)) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        searchPlaceholder="Search by partner name..."
        mobileHiddenColumns={['id', 'date_joined', 'profit_share_rate']}
        actions={<ExportButton exportType="partners" params={crud.params} />}
      />
      {dialogOpen && (
        <FormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit}
          title={editing ? 'Edit Partner' : 'Add Partner'} defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}>
          <FormField name="name" label="Name" required />
          <FormField name="phone" label="Phone" />
          <FormDateField name="date_joined" label="Date Joined" required />
          <FormSelectField name="profit_share_type" label="Profit Share Type" options={shareTypeOptions} required />
          <FormField name="profit_share_rate" label="Profit Share Rate" type="number" required />
          <FormSelectField name="status" label="Status" options={statusOptions} required />
        </FormDialog>
      )}
    </>
  );
};

export default PartnersPageComp;
