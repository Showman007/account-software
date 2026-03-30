import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable.tsx';
import FilterBar from '../common/FilterBar.tsx';
import type { FilterFieldConfig } from '../common/FilterBar.tsx';
import { useCrud } from '../../hooks/useCrud.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { ordersApi } from '../../api/resources.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import type { Order, OrderStatus } from '../../types/orders.ts';
import OrderFormDialog from './OrderFormDialog.tsx';

const STATUS_COLORS: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' | 'secondary'> = {
  quotation: 'default',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'primary',
  partial_delivered: 'secondary',
  delivered: 'success',
  closed: 'success',
  cancelled: 'error',
};

const STATUS_OPTIONS = [
  { value: 'quotation', label: 'Quotation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'partial_delivered', label: 'Partial Delivered' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const OrdersPageComp = () => {
  const crud = useCrud<Order>('orders', ordersApi);
  const { parties, partyMap } = useReferenceData();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);

  const partyOptions = useMemo(
    () => parties.filter((p) => p.party_type === 'buyer' || p.party_type === 'both').map((p) => ({ id: p.id, label: p.name })),
    [parties]
  );

  const filterConfig: FilterFieldConfig[] = useMemo(() => [
    { type: 'autocomplete', name: 'party_id', label: 'Party', options: partyOptions },
    { type: 'select', name: 'status', label: 'Status', options: STATUS_OPTIONS },
    { type: 'date_range' },
  ], [partyOptions]);

  const columns: GridColDef[] = [
    { field: 'order_number', headerName: 'Order #', width: 130 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'party_id', headerName: 'Party', flex: 1, renderCell: (p) => partyMap.get(p.value as number)?.name ?? p.value },
    { field: 'city', headerName: 'City', width: 120 },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (p) => {
        const status = p.value as OrderStatus;
        return <Chip label={status.replace('_', ' ')} color={STATUS_COLORS[status]} size="small" sx={{ textTransform: 'capitalize' }} />;
      },
    },
    { field: 'total_amount', headerName: 'Total', width: 120, renderCell: (p) => formatINR(p.value as number) },
    { field: 'received', headerName: 'Received', width: 110, renderCell: (p) => formatINR(p.value as number) },
    { field: 'balance', headerName: 'Balance', width: 110, renderCell: (p) => formatINR(p.value as number) },
  ];

  const handleOpenDialog = (order: Order | null) => {
    if (order && order.status !== 'quotation') {
      navigate(`/orders/${order.id}`);
      return;
    }
    setEditing(order);
    setDialogOpen(true);
  };

  const handleRowClick = (row: Order) => {
    navigate(`/orders/${row.id}`);
  };

  return (
    <>
      <FilterBar filters={filterConfig} params={crud.params} updateParams={crud.updateParams} />
      <DataTable
        title="Orders"
        columns={columns}
        rows={crud.data}
        loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => handleOpenDialog(null)}
        onEdit={(row) => handleOpenDialog(row)}
        onDelete={(row) => { if (window.confirm('Delete this order?')) crud.deleteMutation.mutate(row.id); }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        searchPlaceholder="Search by party name..."
        onRowClick={handleRowClick}
        mobileHiddenColumns={['city', 'received', 'balance']}
      />
      {dialogOpen && (
        <OrderFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          editing={editing}
          onSuccess={() => {
            setDialogOpen(false);
            crud.updateParams({ ...crud.params });
          }}
        />
      )}
    </>
  );
};

export default OrdersPageComp;
