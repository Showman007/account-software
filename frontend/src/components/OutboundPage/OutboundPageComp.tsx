import { useState, useMemo, useRef } from 'react';
import { TextField, Chip, Box, Typography, Table, TableBody, TableCell, TableRow, TableHead, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import PaymentIcon from '@mui/icons-material/Payment';
import CloseIcon from '@mui/icons-material/Close';
import type { GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable.tsx';
import FormDialog from '../common/FormDialog.tsx';
import { FormField, FormDateField, FormAutocomplete, FormSelectField } from '../common/FormField.tsx';
import { useCrud } from '../../hooks/useCrud.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { outboundEntriesApi, uploadAttachment } from '../../api/resources.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import FileAttachment from '../common/FileAttachment.tsx';
import AttachmentChip from '../common/AttachmentChip.tsx';
import BillButton from '../common/BillButton.tsx';
import ExportButton from '../common/ExportButton.tsx';
import FilterBar from '../common/FilterBar.tsx';
import type { FilterFieldConfig } from '../common/FilterBar.tsx';
import { CATEGORY_OPTIONS, ProductCategorySync } from '../../utils/categoryUtils.tsx';
import BagQuantityFields from '../common/BagQuantityFields.tsx';
import type { OutboundEntry } from '../../types/transactions.ts';

const OutboundPageComp = () => {
  const crud = useCrud<OutboundEntry>('outbound_entries', outboundEntriesApi);
  const { parties, products, units, partyMap, productMap, unitMap } = useReferenceData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OutboundEntry | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const stagedFileRef = useRef<File | null>(null);
  const [paymentDialogEntry, setPaymentDialogEntry] = useState<OutboundEntry | null>(null);
  const navigate = useNavigate();

  const partyOptions = useMemo(
    () => parties.filter((p) => p.party_type === 'buyer' || p.party_type === 'both').map((p) => ({ id: p.id, label: p.name })),
    [parties]
  );

  const outboundProducts = useMemo(
    () => products.filter((p) => p.direction === 'outbound' || p.direction === 'both').map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  const unitOptions = useMemo(() => units.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })), [units]);

  const filterConfig: FilterFieldConfig[] = useMemo(() => [
    { type: 'autocomplete', name: 'party_id', label: 'Party', options: partyOptions },
    { type: 'select', name: 'product_id', label: 'Product', options: outboundProducts },
    { type: 'date_range' },
    { type: 'numeric', name: 'qty', label: 'Quantity' },
    { type: 'numeric', name: 'rate', label: 'Rate' },
    { type: 'numeric', name: 'total_bill', label: 'Total Bill' },
  ], [partyOptions, outboundProducts]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'party_id', headerName: 'Party', flex: 1, renderCell: (p) => partyMap.get(p.value as number)?.name ?? p.value },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'product_id', headerName: 'Product', width: 120, renderCell: (p) => productMap.get(p.value as number)?.name ?? p.value },
    { field: 'category', headerName: 'Category', width: 100 },
    { field: 'unit_id', headerName: 'Unit', width: 80, renderCell: (p) => unitMap.get(p.value as number)?.abbreviation ?? p.value },
    { field: 'bag_type', headerName: 'Bag Type', width: 90, renderCell: (p) => p.value ? `${p.value} kg` : '-' },
    { field: 'no_of_bags', headerName: 'Number of Bags', width: 120, renderCell: (p) => p.value ?? '-' },
    { field: 'qty', headerName: 'Quantity', width: 90 },
    { field: 'rate', headerName: 'Rate', width: 100, renderCell: (p) => formatINR(p.value as number) },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'transport', headerName: 'Transport', width: 100, renderCell: (p) => formatINR(p.value as number) },
    { field: 'total_bill', headerName: 'Total Bill', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'received', headerName: 'Received', width: 110, renderCell: (p) => formatINR(p.value as number) },
    { field: 'balance', headerName: 'Balance', width: 110, renderCell: (p) => formatINR(p.value as number) },
    {
      field: 'order_number', headerName: 'Order', width: 130, sortable: false,
      renderCell: (p) => {
        const row = p.row as OutboundEntry;
        if (!row.order_number) return '-';
        return (
          <Chip
            icon={<LinkIcon />}
            label={row.order_number}
            size="small"
            color="primary"
            variant="outlined"
            clickable
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${row.order_id}`); }}
          />
        );
      },
    },
    {
      field: 'delivery_number', headerName: 'Delivery', width: 130, sortable: false,
      renderCell: (p) => {
        const row = p.row as OutboundEntry;
        if (!row.delivery_number) return '-';
        return <Chip label={row.delivery_number} size="small" variant="outlined" />;
      },
    },
    {
      field: 'payments', headerName: 'Payments', width: 110, sortable: false,
      renderCell: (p) => {
        const row = p.row as OutboundEntry;
        const allocs = row.payment_allocations ?? [];
        if (allocs.length === 0) return '-';
        return (
          <Chip
            icon={<PaymentIcon />}
            label={`${allocs.length}`}
            size="small"
            color="success"
            variant="outlined"
            clickable
            onClick={(e) => { e.stopPropagation(); setPaymentDialogEntry(row); }}
          />
        );
      },
    },
    {
      field: 'attachment', headerName: 'File', width: 70, sortable: false,
      renderCell: (p) => {
        const att = p.row.attachment;
        return att ? <AttachmentChip attachment={att} attachableType="outbound_entries" recordId={p.row.id} /> : null;
      },
    },
    {
      field: 'bill', headerName: 'Bill', width: 60, sortable: false,
      renderCell: (p) => <BillButton billType="customer_invoice" recordId={p.row.id} tooltip="Download Invoice" />,
    },
  ];

  const defaults = useMemo(() => {
    if (editing) {
      return {
        date: editing.date, party_id: editing.party_id, city: editing.city,
        product_id: editing.product_id, category: editing.category || '',
        bag_type: editing.bag_type ?? '', no_of_bags: editing.no_of_bags ?? '', qty: editing.qty,
        unit_id: editing.unit_id, rate: editing.rate, transport: editing.transport, received: editing.received,
      };
    }
    return { date: new Date().toISOString().slice(0, 10), bag_type: '', no_of_bags: '', qty: 0, rate: 0, transport: 0, received: 0, category: '' };
  }, [editing]);

  const handleStagedFile = (file: File | null) => {
    setStagedFile(file);
    stagedFileRef.current = file;
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<OutboundEntry> }, {
        onSuccess: () => {
          const file = stagedFileRef.current;
          if (file && editing.id) {
            uploadAttachment('outbound_entries', editing.id, file).catch(() => {});
          }
          setStagedFile(null);
          stagedFileRef.current = null;
          setDialogOpen(false);
        },
      });
    } else {
      crud.createMutation.mutate(data as Partial<OutboundEntry>, {
        onSuccess: (result) => {
          const newRecord = (result as { data: OutboundEntry }).data;
          const file = stagedFileRef.current;
          if (file && newRecord?.id) {
            uploadAttachment('outbound_entries', newRecord.id, file).catch(() => {});
          }
          setStagedFile(null);
          stagedFileRef.current = null;
          setDialogOpen(false);
        },
      });
    }
  };

  const handleOpenDialog = (entry: OutboundEntry | null) => {
    setEditing(entry);
    setStagedFile(null);
    stagedFileRef.current = null;
    setDialogOpen(true);
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
      onAdd={() => handleOpenDialog(null)}
      onEdit={(row) => handleOpenDialog(row)}
      onDelete={(row) => { if (window.confirm('Delete this entry?')) crud.deleteMutation.mutate(row.id); }}
      onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
      searchPlaceholder="Search by party name..."
      mobileHiddenColumns={['id', 'city', 'category', 'bag_type', 'no_of_bags', 'qty', 'unit_id', 'rate', 'amount', 'transport', 'received']}
      actions={<ExportButton exportType="outbound_entries" params={crud.params} />}
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
          <FormSelectField name="unit_id" label="Unit" options={unitOptions} required />
          <FormField name="rate" label="Rate" type="number" required />
          <BagQuantityFields showAmount amountLabel="Amount" unitMap={unitMap} />
          <FormField name="transport" label="Transport" type="number" />
          <FormField name="received" label="Received" type="number" />
          {editing && (
            <>
              <TextField label="Amount" value={formatINR(editing.amount)} disabled fullWidth />
              <TextField label="Total Bill" value={formatINR(editing.total_bill)} disabled fullWidth />
              <TextField label="Balance" value={formatINR(editing.balance)} disabled fullWidth />
            </>
          )}
          <FileAttachment
            attachableType="outbound_entries"
            recordId={editing?.id ?? 0}
            attachment={editing?.attachment ?? null}
            queryKey="outbound_entries"
            stagedFile={stagedFile}
            onFileSelect={handleStagedFile}
          />
        </FormDialog>
      )}
    </>
  );

  return (
    <>
      <FilterBar filters={filterConfig} params={crud.params} updateParams={crud.updateParams} />
      {tableComp()}
      {formComp()}

      {/* Payment Details Dialog */}
      <Dialog open={!!paymentDialogEntry} onClose={() => setPaymentDialogEntry(null)} maxWidth="md" fullWidth>
        {paymentDialogEntry && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon color="success" />
                  <Typography variant="h6">Payment Details</Typography>
                </Box>
                <IconButton edge="end" onClick={() => setPaymentDialogEntry(null)}><CloseIcon /></IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Party: <strong>{partyMap.get(paymentDialogEntry.party_id)?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Product: <strong>{productMap.get(paymentDialogEntry.product_id)?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Bill: <strong>{formatINR(paymentDialogEntry.total_bill)}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Received: <strong style={{ color: '#66bb6a' }}>{formatINR(paymentDialogEntry.received)}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Balance: <strong style={{ color: paymentDialogEntry.balance > 0 ? '#ef5350' : '#66bb6a' }}>{formatINR(paymentDialogEntry.balance)}</strong>
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Payment #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell align="right">Allocated</TableCell>
                    <TableCell align="right">Total Payment</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(paymentDialogEntry.payment_allocations ?? []).map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell>{alloc.payment?.id ?? '-'}</TableCell>
                      <TableCell>{alloc.payment?.date ?? '-'}</TableCell>
                      <TableCell>{alloc.payment?.payment_mode?.name ?? '-'}</TableCell>
                      <TableCell>{alloc.payment?.reference ?? '-'}</TableCell>
                      <TableCell align="right">{formatINR(alloc.amount)}</TableCell>
                      <TableCell align="right">{alloc.payment ? formatINR(alloc.payment.amount) : '-'}</TableCell>
                      <TableCell>{alloc.payment?.remarks ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};

export default OutboundPageComp;
