import { useState, useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import DataTable from '../components/common/DataTable.tsx';
import FormDialog from '../components/common/FormDialog.tsx';
import { FormField, FormSelectField } from '../components/common/FormField.tsx';
import { useCrud } from '../hooks/useCrud.ts';
import { usersApi } from '../api/resources.ts';
import type { User } from '../types/auth.ts';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  { field: 'email', headerName: 'Email', flex: 1 },
  {
    field: 'role',
    headerName: 'Role',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value === 'admin' ? 'Admin' : 'Viewer'}
        color={params.value === 'admin' ? 'primary' : 'default'}
        size="small"
      />
    ),
  },
  {
    field: 'created_at',
    headerName: 'Created',
    width: 160,
    valueFormatter: (value: string) => value ? new Date(value).toLocaleDateString('en-IN') : '',
  },
];

export default function UsersPage() {
  const crud = useCrud<User>('users', usersApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const defaults = useMemo(() => {
    if (editing) return { email: editing.email, role: editing.role };
    return { role: 'user' };
  }, [editing]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editing) {
      crud.updateMutation.mutate(
        { id: editing.id, data: data as Partial<User> },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      crud.createMutation.mutate(data as Partial<User>, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  return (
    <>
      <DataTable
        title="Users"
        columns={columns}
        rows={crud.data}
        loading={crud.isLoading}
        totalCount={crud.meta?.total_count ?? 0}
        paginationModel={{ page: (crud.params.page ?? 1) - 1, pageSize: crud.params.per_page ?? 25 }}
        onPaginationChange={(m) => crud.updateParams({ page: m.page + 1, per_page: m.pageSize })}
        onAdd={() => { setEditing(null); setDialogOpen(true); }}
        onEdit={(row) => { setEditing(row); setDialogOpen(true); }}
        onDelete={(row) => {
          if (window.confirm(`Delete user "${row.email}"?`)) crud.deleteMutation.mutate(row.id);
        }}
        onSearchChange={(q) => crud.updateParams({ q, page: 1 })}
        mobileHiddenColumns={['id']}
      />
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title={editing ? 'Edit User' : 'Add User'}
          defaultValues={defaults}
          isLoading={crud.createMutation.isPending || crud.updateMutation.isPending}
        >
          <FormField name="email" label="Email" type="email" required />
          <FormField
            name="password"
            label={editing ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            required={!editing}
          />
          <FormField
            name="password_confirmation"
            label="Confirm Password"
            type="password"
            required={!editing}
          />
          <FormSelectField
            name="role"
            label="Role"
            required
            options={[
              { value: 'user', label: 'Viewer' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
        </FormDialog>
      )}
    </>
  );
}
