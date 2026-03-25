import { useState } from 'react';
import { Box, Button, Typography, TextField, InputAdornment, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../context/AuthContext.tsx';

interface DataTableProps<T> {
  columns: GridColDef[];
  rows: T[];
  loading: boolean;
  totalCount: number;
  paginationModel: GridPaginationModel;
  onPaginationChange: (model: GridPaginationModel) => void;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
}

export default function DataTable<T extends { id: number }>({
  columns,
  rows,
  loading,
  totalCount,
  paginationModel,
  onPaginationChange,
  onAdd,
  onEdit,
  onDelete,
  title,
  searchValue,
  onSearchChange,
  actions,
}: DataTableProps<T>) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState(searchValue ?? '');

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearchChange) {
      onSearchChange(search);
    }
  };

  const actionColumn: GridColDef = {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box>
        {onEdit && (
          <IconButton size="small" color="primary" onClick={() => onEdit(params.row as T)}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {onDelete && (
          <IconButton size="small" color="error" onClick={() => onDelete(params.row as T)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    ),
  };

  const allColumns = isAdmin && (onEdit || onDelete) ? [...columns, actionColumn] : columns;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {actions}
          {isAdmin && onAdd && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
              Add New
            </Button>
          )}
        </Box>
      </Box>
      {onSearchChange && (
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 300 }}
          />
        </Box>
      )}
      <DataGrid
        rows={rows}
        columns={allColumns}
        loading={loading}
        rowCount={totalCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationChange}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          backgroundColor: 'white',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
          },
        }}
      />
    </Box>
  );
}
