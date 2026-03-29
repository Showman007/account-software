import { useState, useMemo, useRef } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable.tsx';
import FormDialog from '../common/FormDialog.tsx';
import { FormField, FormDateField, FormSelectField } from '../common/FormField.tsx';
import { useCrud } from '../../hooks/useCrud.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { expensesApi, uploadAttachment } from '../../api/resources.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import FileAttachment from '../common/FileAttachment.tsx';
import AttachmentChip from '../common/AttachmentChip.tsx';
import ExportButton from '../common/ExportButton.tsx';
import FilterBar from '../common/FilterBar.tsx';
import type { FilterFieldConfig } from '../common/FilterBar.tsx';
import type { Expense } from '../../types/operations.ts';

const ExpensesPageComp = () => {
  const crud = useCrud<Expense>('expenses', expensesApi);
  const { expenseCategories, paymentModes, expenseCategoryMap, paymentModeMap } = useReferenceData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const stagedFileRef = useRef<File | null>(null);

  const categoryOptions = useMemo(() => expenseCategories.map((c) => ({ value: c.id, label: c.name })), [expenseCategories]);
  const modeOptions = useMemo(() => paymentModes.map((m) => ({ value: m.id, label: m.name })), [paymentModes]);

  const filterConfig: FilterFieldConfig[] = useMemo(() => [
    { type: 'select', name: 'category_id', label: 'Category', options: categoryOptions },
    { type: 'date_range' },
    { type: 'numeric', name: 'amount', label: 'Amount' },
  ], [categoryOptions]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'category_id', headerName: 'Category', width: 130, renderCell: (p) => expenseCategoryMap.get(p.value as number)?.name ?? p.value },
    { field: 'paid_to', headerName: 'Paid To', width: 130 },
    { field: 'amount', headerName: 'Amount', width: 130, renderCell: (p) => formatINR(p.value as number) },
    { field: 'payment_mode_id', headerName: 'Mode', width: 110, renderCell: (p) => paymentModeMap.get(p.value as number)?.name ?? p.value },
    { field: 'remarks', headerName: 'Remarks', flex: 1 },
    {
      field: 'attachment', headerName: 'File', width: 70, sortable: false,
      renderCell: (p) => {
        const att = p.row.attachment;
        return att ? <AttachmentChip attachment={att} /> : null;
      },
    },
  ];

  const defaults = useMemo(() => {
    if (editing) {
      return { date: editing.date, description: editing.description, category_id: editing.category_id, paid_to: editing.paid_to, amount: editing.amount, payment_mode_id: editing.payment_mode_id, remarks: editing.remarks };
    }
    return { date: new Date().toISOString().slice(0, 10), amount: 0 };
  }, [editing]);

  const handleStagedFile = (file: File | null) => {
    setStagedFile(file);
    stagedFileRef.current = file;
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<Expense> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<Expense>, {
        onSuccess: (result) => {
          const newRecord = (result as { data: Expense }).data;
          const file = stagedFileRef.current;
          if (file && newRecord?.id) {
            uploadAttachment('expenses', newRecord.id, file).catch(() => {});
          }
          setStagedFile(null);
          stagedFileRef.current = null;
          setDialogOpen(false);
        },
      });
    }
  };

  const handleOpenDialog = (entry: Expense | null) => {
    setEditing(entry);
    setStagedFile(null);
    stagedFileRef.current = null;
    setDialogOpen(true);
  };

  return (
    <>
      <FilterBar filters={filterConfig} params={crud.params} updateParams={crud.updateParams} />
      <DataTable title="Expenses" columns={columns} rows={crud.data} loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => handleOpenDialog(null)}
        onEdit={(row) => handleOpenDialog(row)}
        onDelete={(row) => { if (window.confirm('Delete this expense?')) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        searchPlaceholder="Search by description..."
        mobileHiddenColumns={['id', 'category_id', 'paid_to', 'payment_mode_id']}
        actions={<ExportButton exportType="expenses" params={crud.params} />}
      />
      {dialogOpen && (
        <FormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit}
          title={editing ? 'Edit Expense' : 'Add Expense'} defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}>
          <FormDateField name="date" label="Date" required />
          <FormField name="description" label="Description" required />
          <FormSelectField name="category_id" label="Category" options={categoryOptions} required />
          <FormField name="paid_to" label="Paid To" />
          <FormField name="amount" label="Amount" type="number" required />
          <FormSelectField name="payment_mode_id" label="Payment Mode" options={modeOptions} required />
          <FormField name="remarks" label="Remarks" multiline rows={2} />
          {editing ? (
            <FileAttachment
              attachableType="expenses"
              recordId={editing.id}
              attachment={editing.attachment}
              queryKey="expenses"
            />
          ) : (
            <FileAttachment
              attachableType="expenses"
              recordId={0}
              attachment={null}
              queryKey="expenses"
              stageOnly
              stagedFile={stagedFile}
              onFileSelect={handleStagedFile}
            />
          )}
        </FormDialog>
      )}
    </>
  );
};

export default ExpensesPageComp;
