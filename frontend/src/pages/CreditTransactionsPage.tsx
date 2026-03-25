import { useState, useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/common/DataTable.tsx';
import FormDialog from '../components/common/FormDialog.tsx';
import { FormField, FormDateField, FormSelectField } from '../components/common/FormField.tsx';
import { useCrud } from '../hooks/useCrud.ts';
import { useReferenceData } from '../hooks/useReferenceData.ts';
import { creditTransactionsApi, partnersApi } from '../api/resources.ts';
import { formatINR } from '../components/common/SummaryCard.tsx';
import type { CreditTransaction, Partner } from '../types/models.ts';

const txnTypeOptions = [
  { value: 'credit_received', label: 'Credit Received' },
  { value: 'principal_return', label: 'Principal Return' },
  { value: 'profit_share', label: 'Profit Share' },
];

export default function CreditTransactionsPage() {
  const crud = useCrud<CreditTransaction>('credit_transactions', creditTransactionsApi);
  const { paymentModes, paymentModeMap } = useReferenceData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CreditTransaction | null>(null);

  const { data: partnersData } = useQuery({
    queryKey: ['partners', 'all'],
    queryFn: () => partnersApi.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const partners = partnersData?.data ?? [];
  const partnerMap = useMemo(() => {
    const m = new Map<number, Partner>();
    for (const p of partners) m.set(p.id, p);
    return m;
  }, [partners]);

  const partnerOptions = useMemo(() => partners.map((p) => ({ value: p.id, label: p.name })), [partners]);
  const modeOptions = useMemo(() => paymentModes.map((m) => ({ value: m.id, label: m.name })), [paymentModes]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'partner_id', headerName: 'Partner', flex: 1, renderCell: (p) => partnerMap.get(p.value as number)?.name ?? p.value },
    { field: 'transaction_type', headerName: 'Type', width: 150, renderCell: (p) => txnTypeOptions.find((t) => t.value === p.value)?.label ?? p.value },
    { field: 'credit_received', headerName: 'Credit Received', width: 130, renderCell: (p) => formatINR(p.value as number) },
    { field: 'principal_returned', headerName: 'Principal Returned', width: 140, renderCell: (p) => formatINR(p.value as number) },
    { field: 'profit_paid', headerName: 'Profit Paid', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'payment_mode_id', headerName: 'Mode', width: 100, renderCell: (p) => paymentModeMap.get(p.value as number)?.name ?? p.value },
    { field: 'running_balance', headerName: 'Running Balance', width: 140, renderCell: (p) => formatINR(p.value as number) },
    { field: 'used_for', headerName: 'Used For', width: 120 },
  ];

  const defaults = useMemo(() => {
    if (editing) {
      return {
        date: editing.date,
        partner_id: editing.partner_id,
        transaction_type: editing.transaction_type,
        credit_received: editing.credit_received,
        principal_returned: editing.principal_returned,
        profit_paid: editing.profit_paid,
        payment_mode_id: editing.payment_mode_id,
        used_for: editing.used_for,
        remarks: editing.remarks,
      };
    }
    return { date: new Date().toISOString().slice(0, 10), transaction_type: 'credit_received', credit_received: 0, principal_returned: 0, profit_paid: 0 };
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<CreditTransaction> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<CreditTransaction>, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <>
      <DataTable
        title="Credit Transactions"
        columns={columns}
        rows={crud.data}
        loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
        onDelete={(row) => { if (window.confirm('Delete this transaction?')) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
      />
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit Credit Transaction' : 'Add Credit Transaction'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <FormDateField name="date" label="Date" required />
          <FormSelectField name="partner_id" label="Partner" options={partnerOptions} required />
          <FormSelectField name="transaction_type" label="Transaction Type" options={txnTypeOptions} required />
          <FormField name="credit_received" label="Credit Received" type="number" />
          <FormField name="principal_returned" label="Principal Returned" type="number" />
          <FormField name="profit_paid" label="Profit Paid" type="number" />
          <FormSelectField name="payment_mode_id" label="Payment Mode" options={modeOptions} required />
          <FormField name="used_for" label="Used For" />
          <FormField name="remarks" label="Remarks" multiline rows={2} />
        </FormDialog>
      )}
    </>
  );
}
