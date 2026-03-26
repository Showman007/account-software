import { useState, useMemo, useEffect } from 'react';
import { TextField } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../components/common/DataTable.tsx';
import FormDialog from '../components/common/FormDialog.tsx';
import { FormField, FormDateField, FormAutocomplete, FormSelectField } from '../components/common/FormField.tsx';
import { useCrud } from '../hooks/useCrud.ts';
import { useReferenceData } from '../hooks/useReferenceData.ts';
import { inboundEntriesApi } from '../api/resources.ts';
import { formatINR } from '../components/common/SummaryCard.tsx';
import type { InboundEntry } from '../types/models.ts';
import type { Product } from '../types/models.ts';

const CATEGORY_OPTIONS = [
  { value: 'paddy', label: 'Paddy' },
  { value: 'rice', label: 'Rice' },
  { value: 'by_product', label: 'By-Product' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Other' },
];

function ProductCategorySync({ productMap }: { productMap: Map<number, Product> }) {
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

export default function InboundPage() {
  const crud = useCrud<InboundEntry>('inbound_entries', inboundEntriesApi);
  const { parties, products, units, partyMap, productMap, unitMap } = useReferenceData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InboundEntry | null>(null);

  const partyOptions = useMemo(
    () => parties.filter((p) => p.party_type === 'supplier' || p.party_type === 'both').map((p) => ({ id: p.id, label: p.name })),
    [parties]
  );

  const inboundProducts = useMemo(
    () => products.filter((p) => p.direction === 'inbound' || p.direction === 'both').map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  const unitOptions = useMemo(() => units.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })), [units]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'party_id', headerName: 'Party', flex: 1, renderCell: (p) => partyMap.get(p.value as number)?.name ?? p.value },
    { field: 'village', headerName: 'Village', width: 120 },
    { field: 'product_id', headerName: 'Product', width: 120, renderCell: (p) => productMap.get(p.value as number)?.name ?? p.value },
    { field: 'category', headerName: 'Category', width: 100 },
    { field: 'qty', headerName: 'Qty', width: 80 },
    { field: 'unit_id', headerName: 'Unit', width: 80, renderCell: (p) => unitMap.get(p.value as number)?.abbreviation ?? p.value },
    { field: 'rate', headerName: 'Rate', width: 100, renderCell: (p) => formatINR(p.value as number) },
    { field: 'gross_amt', headerName: 'Gross Amt', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'moisture_pct', headerName: 'Moisture %', width: 100 },
    { field: 'net_amt', headerName: 'Net Amt', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'paid', headerName: 'Paid', width: 110, renderCell: (p) => formatINR(p.value as number) },
    { field: 'balance', headerName: 'Balance', width: 110, renderCell: (p) => formatINR(p.value as number) },
  ];

  const defaults = useMemo(() => {
    if (editing) {
      return {
        date: editing.date,
        party_id: editing.party_id,
        village: editing.village,
        product_id: editing.product_id,
        category: editing.category || '',
        qty: editing.qty,
        unit_id: editing.unit_id,
        rate: editing.rate,
        moisture_pct: editing.moisture_pct,
        paid: editing.paid,
      };
    }
    return { date: new Date().toISOString().slice(0, 10), qty: 0, rate: 0, moisture_pct: 0, paid: 0, category: '' };
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<InboundEntry> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<InboundEntry>, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <>
      <DataTable
        title="Inbound Entries (Purchases)"
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
        mobileHiddenColumns={['id', 'village', 'category', 'qty', 'unit_id', 'rate', 'gross_amt', 'moisture_pct', 'paid']}
      />
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit Inbound Entry' : 'Add Inbound Entry'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <ProductCategorySync productMap={productMap} />
          <FormDateField name="date" label="Date" required />
          <FormAutocomplete name="party_id" label="Party" options={partyOptions} required />
          <FormField name="village" label="Village" />
          <FormSelectField name="product_id" label="Product" options={inboundProducts} required />
          <FormSelectField name="category" label="Category" options={CATEGORY_OPTIONS} />
          <FormField name="qty" label="Quantity" type="number" required />
          <FormSelectField name="unit_id" label="Unit" options={unitOptions} required />
          <FormField name="rate" label="Rate" type="number" required />
          <FormField name="moisture_pct" label="Moisture %" type="number" />
          <FormField name="paid" label="Paid" type="number" />
          {editing && (
            <>
              <TextField label="Gross Amount" value={formatINR(editing.gross_amt)} disabled fullWidth />
              <TextField label="Net Qty" value={editing.net_qty} disabled fullWidth />
              <TextField label="Net Amount" value={formatINR(editing.net_amt)} disabled fullWidth />
              <TextField label="Balance" value={formatINR(editing.balance)} disabled fullWidth />
            </>
          )}
        </FormDialog>
      )}
    </>
  );
}
