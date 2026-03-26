import { useState, useMemo } from 'react';
import { TextField } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../components/common/DataTable.tsx';
import FormDialog from '../components/common/FormDialog.tsx';
import { FormField, FormDateField } from '../components/common/FormField.tsx';
import { useCrud } from '../hooks/useCrud.ts';
import { millingBatchesApi } from '../api/resources.ts';
import { formatINR } from '../components/common/SummaryCard.tsx';
import type { MillingBatch } from '../types/operations.ts';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  { field: 'date', headerName: 'Date', width: 110 },
  { field: 'paddy_type', headerName: 'Paddy Type', width: 120 },
  { field: 'miller_name', headerName: 'Miller', width: 130 },
  { field: 'input_qty', headerName: 'Input Qty', width: 100 },
  { field: 'milling_cost', headerName: 'Milling Cost', width: 120, renderCell: (p) => formatINR(p.value as number) },
  { field: 'rice_main_qty', headerName: 'Rice Main', width: 100 },
  { field: 'broken_rice_qty', headerName: 'Broken Rice', width: 110 },
  { field: 'rice_bran_qty', headerName: 'Rice Bran', width: 100 },
  { field: 'husk_qty', headerName: 'Husk', width: 80 },
  { field: 'rice_flour_qty', headerName: 'Rice Flour', width: 100 },
  { field: 'total_output', headerName: 'Total Output', width: 110 },
  { field: 'loss_diff', headerName: 'Loss/Diff', width: 100 },
];

export default function MillingPage() {
  const crud = useCrud<MillingBatch>('milling_batches', millingBatchesApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MillingBatch | null>(null);

  const defaults = useMemo(() => {
    if (editing) {
      return {
        date: editing.date,
        paddy_type: editing.paddy_type,
        miller_name: editing.miller_name,
        input_qty: editing.input_qty,
        milling_cost: editing.milling_cost,
        rice_main_qty: editing.rice_main_qty,
        broken_rice_qty: editing.broken_rice_qty,
        rice_bran_qty: editing.rice_bran_qty,
        husk_qty: editing.husk_qty,
        rice_flour_qty: editing.rice_flour_qty,
      };
    }
    return { date: new Date().toISOString().slice(0, 10), input_qty: 0, milling_cost: 0, rice_main_qty: 0, broken_rice_qty: 0, rice_bran_qty: 0, husk_qty: 0, rice_flour_qty: 0 };
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<MillingBatch> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<MillingBatch>, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <>
      <DataTable
        title="Milling Batches"
        columns={columns}
        rows={crud.data}
        loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
        onDelete={(row) => { if (window.confirm('Delete this milling batch?')) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        mobileHiddenColumns={['id', 'milling_cost', 'broken_rice_qty', 'rice_bran_qty', 'husk_qty', 'rice_flour_qty', 'total_output', 'loss_diff']}
      />
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit Milling Batch' : 'Add Milling Batch'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <FormDateField name="date" label="Date" required />
          <FormField name="paddy_type" label="Paddy Type" required />
          <FormField name="miller_name" label="Miller Name" required />
          <FormField name="input_qty" label="Input Qty" type="number" required />
          <FormField name="milling_cost" label="Milling Cost" type="number" required />
          <FormField name="rice_main_qty" label="Rice Main Qty" type="number" />
          <FormField name="broken_rice_qty" label="Broken Rice Qty" type="number" />
          <FormField name="rice_bran_qty" label="Rice Bran Qty" type="number" />
          <FormField name="husk_qty" label="Husk Qty" type="number" />
          <FormField name="rice_flour_qty" label="Rice Flour Qty" type="number" />
          {editing && (
            <>
              <TextField label="Total Output" value={editing.total_output} disabled fullWidth />
              <TextField label="Loss/Diff" value={editing.loss_diff} disabled fullWidth />
            </>
          )}
        </FormDialog>
      )}
    </>
  );
}
