import { useState, useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable.tsx';
import FormDialog from '../common/FormDialog.tsx';
import { FormField, FormSelectField } from '../common/FormField.tsx';
import { useCrud } from '../../hooks/useCrud.ts';
import { partiesApi } from '../../api/resources.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import type { Party } from '../../types/masters.ts';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'village_city', headerName: 'Village/City', flex: 1 },
  { field: 'phone', headerName: 'Phone', width: 130 },
  { field: 'party_type', headerName: 'Type', width: 100 },
  { field: 'opening_balance', headerName: 'Opening Balance', width: 150, renderCell: (params) => formatINR(params.value as number) },
  { field: 'bank', headerName: 'Bank', width: 120 },
];

const partyTypeOptions = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'both', label: 'Both' },
];

const PartiesPageComp = () => {
  const crud = useCrud<Party>('parties', partiesApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);

  const defaults = useMemo(() => {
    if (editing) {
      return { name: editing.name, village_city: editing.village_city, phone: editing.phone, party_type: editing.party_type, opening_balance: editing.opening_balance, account_no: editing.account_no, bank: editing.bank, notes: editing.notes };
    }
    return { party_type: 'supplier', opening_balance: 0 };
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate({ id: editing.id, data: data as Partial<Party> }, { onSuccess: () => setDialogOpen(false) });
    } else {
      crud.createMutation.mutate(data as Partial<Party>, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const tableComp = () => (
    <DataTable
      title="Parties"
      columns={columns}
      rows={crud.data}
      loading={crud.isLoading}
      totalCount={crud.meta?.total_count ?? 0}
      paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
      onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
      onAdd={() => { setEditing(null); setDialogOpen(true); }}
      onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
      onDelete={(row) => { if (window.confirm(`Delete party "${row.name}"?`)) crud.deleteMutation.mutate(row.id); }}
      onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
      mobileHiddenColumns={['id', 'village_city', 'bank']}
    />
  );

  const formComp = () => (
    <>
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit Party' : 'Add Party'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <FormField name="name" label="Name" required />
          <FormField name="village_city" label="Village/City" />
          <FormField name="phone" label="Phone" />
          <FormSelectField name="party_type" label="Party Type" options={partyTypeOptions} required />
          <FormField name="opening_balance" label="Opening Balance" type="number" />
          <FormField name="account_no" label="Account No" />
          <FormField name="bank" label="Bank" />
          <FormField name="notes" label="Notes" multiline rows={2} />
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

export default PartiesPageComp;
