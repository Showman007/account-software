import { useState, useMemo } from 'react';
import { TextField } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable.tsx';
import FormDialog from '../common/FormDialog.tsx';
import { FormField, FormDateField, FormAutocomplete, FormSelectField } from '../common/FormField.tsx';
import { useCrud } from '../../hooks/useCrud.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { outboundEntriesApi } from '../../api/resources.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import { CATEGORY_OPTIONS, ProductCategorySync } from '../../utils/categoryUtils.tsx';
import type { OutboundEntry } from '../../types/transactions.ts';

const OutboundPageComp = () => {
  const crud = useCrud<OutboundEntry>('outbound_entries', outboundEntriesApi);
  const { parties, products, units, partyMap, productMap, unitMap } = useReferenceData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OutboundEntry | null>(null);

  const partyOptions = useMemo(
    () => parties.filter((p) => p.party_type === 'buyer' || p.party_type === 'both').map((p) => ({ id: p.id, label: p.name })),
    [parties]
  );

  const outboundProducts = useMemo(
    () => products.filter((p) => p.direction === 'outbound' || p.direction === 'both').map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  const unitOptions = useMemo(() => units.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })), [units]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'party_id', headerName: 'Party', flex: 1, renderCell: (p) => partyMap.get(p.value as number)?.name ?? p.value },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'product_id', headerName: 'Product', width: 120, renderCell: (p) => productMap.get(p.value as number)?.name ?? p.value },
    { field: 'category', headerName: 'Category', width: 100 },
    { field: 'qty', headerName: 'Qty', width: 80 },
    { field: 'unit_id', headerName: 'Unit', width: 80, renderCell: (p) => unitMap.get(p.value as number)?.abbreviation ?? p.value },
    { field: 'rate', headerName: 'Rate', width: 100, renderCell: (p) => formatINR(p.value as number) },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'transport', headerName: 'Transport', width: 100, renderCell: (p) => formatINR(p.value as number) },
    { field: 'total_bill', headerName: 'Total Bill', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'received', headerName: 'Received', width: 110, renderCell: (p) => formatINR(p.value as number) },
    { field: 'balance', headerName: 'Balance', width: 110, renderCell: (p) => formatINR(p.value as number) },
  ];

  const defaults = useMemo(() => {
    if (editing) {
      return {
        date: editing.date, party_id: editing.party_id, city: editing.city,
        product_id: editing.product_id, category: editing.category || '', qty: editing.qty,
        unit_id: editing.unit_id, rate: editing.rate, transport: editing.transport, received: editing.received,
      };
    }
    return { date: new Date().toISOString().slice(0, 10), qty: 0, rate: 0, transport: 0, received: 0, category: '' };
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<OutboundEntry> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<OutboundEntry>, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const tableComp = () => (
    <DataTable
      title="Outbound Entries (Sales)"
      columns={columns}
      rows={crud.data}
      loading={crud.isLoading}
      totalCount={crud.meta?.total_count ?? 0}
      paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
      onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
      onAdd={() => { setEditing(null); setDialogOpen(true); }}
      onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
      onDelete={(row) => { if (window.confirm('Delete this entry?')) crud.deleteMutation.mutate(row.id); }}
      onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
      mobileHiddenColumns={['id', 'city', 'category', 'qty', 'unit_id', 'rate', 'amount', 'transport', 'received']}
    />
  );

  const formComp = () => (
    <>
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit Outbound Entry' : 'Add Outbound Entry'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <ProductCategorySync productMap={productMap} />
          <FormDateField name="date" label="Date" required />
          <FormAutocomplete name="party_id" label="Party" options={partyOptions} required />
          <FormField name="city" label="City" />
          <FormSelectField name="product_id" label="Product" options={outboundProducts} required />
          <FormSelectField name="category" label="Category" options={CATEGORY_OPTIONS} />
          <FormField name="qty" label="Quantity" type="number" required />
          <FormSelectField name="unit_id" label="Unit" options={unitOptions} required />
          <FormField name="rate" label="Rate" type="number" required />
          <FormField name="transport" label="Transport" type="number" />
          <FormField name="received" label="Received" type="number" />
          {editing && (
            <>
              <TextField label="Amount" value={formatINR(editing.amount)} disabled fullWidth />
              <TextField label="Total Bill" value={formatINR(editing.total_bill)} disabled fullWidth />
              <TextField label="Balance" value={formatINR(editing.balance)} disabled fullWidth />
            </>
          )}
        </FormDialog>
      )}
    </>
  );

  return (
    <>
      {tableComp()}
      {formComp()}
    </>
  );
};

export default OutboundPageComp;
