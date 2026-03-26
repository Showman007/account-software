import { useState, useMemo } from 'react';
import { Button, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import DataTable from '../components/common/DataTable.tsx';
import FormDialog from '../components/common/FormDialog.tsx';
import { FormField } from '../components/common/FormField.tsx';
import { useCrud } from '../hooks/useCrud.ts';
import { useReferenceData } from '../hooks/useReferenceData.ts';
import { stockItemsApi, recalculateStock } from '../api/resources.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { StockItem } from '../types/operations.ts';

export default function StockPage() {
  const crud = useCrud<StockItem>('stock_items', stockItemsApi);
  const { productMap, unitMap } = useReferenceData();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'product_id', headerName: 'Product', flex: 1, renderCell: (p) => productMap.get(p.value as number)?.name ?? p.value },
    { field: 'category', headerName: 'Category', width: 120 },
    { field: 'unit_id', headerName: 'Unit', width: 80, renderCell: (p) => unitMap.get(p.value as number)?.abbreviation ?? p.value },
    { field: 'opening_stock', headerName: 'Opening', width: 100 },
    { field: 'total_inbound', headerName: 'Inbound', width: 100 },
    { field: 'from_milling', headerName: 'From Milling', width: 110 },
    { field: 'total_outbound', headerName: 'Outbound', width: 100 },
    { field: 'current_stock', headerName: 'Current', width: 100 },
    { field: 'min_level', headerName: 'Min Level', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (p) => {
        const s = p.value as string;
        const color = s === 'in_stock' ? 'success' : s === 'low' ? 'warning' : 'error';
        return <Chip label={s.replace(/_/g, ' ').toUpperCase()} color={color} size="small" />;
      },
    },
  ];

  const defaults = useMemo(() => {
    if (editing) {
      return { opening_stock: editing.opening_stock, min_level: editing.min_level };
    }
    return { opening_stock: 0, min_level: 0 };
  }, [editing]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateStock();
      toast.success('Stock recalculated successfully');
    } catch {
      toast.error('Failed to recalculate stock');
    } finally {
      setRecalculating(false);
    }
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate(
        { id: editing.id, data: data as Partial<StockItem> },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  return (
    <>
      <DataTable
        title="Stock Items"
        columns={columns}
        rows={crud.data}
        loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onEdit={isAdmin ? (row) => { setEditing(row); setDialogOpen(true); } : undefined}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        mobileHiddenColumns={['id', 'unit_id', 'opening_stock', 'total_inbound', 'from_milling', 'total_outbound', 'min_level']}
        actions={
          isAdmin ? (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRecalculate}
              disabled={recalculating}
            >
              {recalculating ? 'Recalculating...' : 'Recalculate'}
            </Button>
          ) : undefined
        }
      />
      {dialogOpen && editing && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title="Edit Stock Item"
          defaultValues={defaults}
          isLoading={crud.updateMutation.isPending}
        >
          <FormField name="opening_stock" label="Opening Stock" type="number" />
          <FormField name="min_level" label="Minimum Level" type="number" />
        </FormDialog>
      )}
    </>
  );
}
