import { useState, useMemo } from 'react';
import { Box, Button, Typography, TextField, InputAdornment, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../context/AuthContext.tsx';
import { useAppColors } from '../../context/ThemeContext.tsx';

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
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  mobileHiddenColumns?: string[];
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
  searchPlaceholder = 'Search...',
  actions,
  mobileHiddenColumns,
}: DataTableProps<T>) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState(searchValue ?? '');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const colors = useAppColors();

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearchChange) {
      onSearchChange(search);
    }
  };

  const actionColumn: GridColDef = {
    field: 'actions',
    headerName: 'Actions',
    width: isMobile ? 80 : 120,
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

  const columnVisibilityModel = useMemo(() => {
    if (!isMobile || !mobileHiddenColumns) return {};
    return Object.fromEntries(mobileHiddenColumns.map((f) => [f, false]));
  }, [isMobile, mobileHiddenColumns]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {actions}
          {isAdmin && onAdd && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} size={isMobile ? 'small' : 'medium'}>
              {isMobile ? 'Add' : 'Add New'}
            </Button>
          )}
        </Box>
      </Box>
      {onSearchChange && (
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
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
            sx={{ width: { xs: '100%', sm: 300 } }}
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
        columnVisibilityModel={columnVisibilityModel}
        sx={{
          backgroundColor: colors.surface,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: colors.tableHeader,
          },
        }}
      />
    </Box>
  );
}
