import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import UndoIcon from '@mui/icons-material/Undo';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import FormDialog from '../common/FormDialog.tsx';
import { FormField, FormDateField, FormAutocomplete, FormSelectField } from '../common/FormField.tsx';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { paymentsApi, reversePayment } from '../../api/resources.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useAppColors } from '../../context/ThemeContext.tsx';
import { useIsMobile } from '../../hooks/useIsMobile.ts';
import ExportButton from '../common/ExportButton.tsx';
import BillButton from '../common/BillButton.tsx';
import FilterBar from '../common/FilterBar.tsx';
import type { FilterFieldConfig } from '../common/FilterBar.tsx';
import type { Payment } from '../../types/transactions.ts';
import type { QueryParams } from '../../types/common.ts';
import { directionOptions, getPaymentLabel, getPaymentColor } from '../../config/paymentLabels.ts';

const MOBILE_HIDDEN_COLUMNS = ['id', 'village_city', 'payment_mode_id', 'reference', 'remarks'];

const PaymentsPageComp = () => {
  const { isAdmin } = useAuth();
  const colors = useAppColors();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { parties, paymentModes, partyMap, paymentModeMap } = useReferenceData();

  const [params, setParams] = useState<QueryParams>({ page: 1, per_page: 25 });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPayment, setMenuPayment] = useState<Payment | null>(null);

  // Reverse confirmation dialog
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<Payment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentsApi.getAll(params),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const createMutation = useMutation({
    mutationFn: (d: Partial<Payment>) => paymentsApi.create(d),
    onSuccess: () => {
      toast.success('Payment created');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('Failed to create payment'),
  });

  const reverseMutation = useMutation({
    mutationFn: (id: number) => reversePayment(id),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal_entries_all'] });
      queryClient.invalidateQueries({ queryKey: ['party_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['master_ledger'] });
      setReverseDialogOpen(false);
      setReverseTarget(null);
    },
    onError: () => toast.error('Failed to reverse payment'),
  });

  const updateParams = useCallback((p: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...p }));
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuPayment(payment);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuPayment(null);
  };

  const handleReverseClick = () => {
    setReverseTarget(menuPayment);
    setReverseDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmReverse = () => {
    if (reverseTarget) {
      reverseMutation.mutate(reverseTarget.id);
    }
  };

  const partyOptions = useMemo(() => parties.map((p) => ({ id: p.id, label: p.name })), [parties]);
  const modeOptions = useMemo(() => paymentModes.map((m) => ({ value: m.id, label: m.name })), [paymentModes]);

  const filterConfig: FilterFieldConfig[] = useMemo(() => [
    { type: 'autocomplete', name: 'party_id', label: 'Party', options: partyOptions },
    { type: 'select', name: 'direction', label: 'Direction', options: directionOptions },
    { type: 'date_range' },
    { type: 'numeric', name: 'amount', label: 'Amount' },
  ], [partyOptions]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'date', headerName: 'Date', width: 110 },
    {
      field: 'party_id',
      headerName: 'Party',
      flex: 1,
      renderCell: (p) => partyMap.get(p.value as number)?.name ?? p.value,
    },
    { field: 'village_city', headerName: 'Village/City', width: 130 },
    {
      field: 'direction',
      headerName: 'Direction',
      width: 170,
      renderCell: (p) => {
        const row = p.row as Payment;
        const isReversal = !!row.reversed_payment_id;
        return (
          <Chip
            label={getPaymentLabel(p.value as string, isReversal)}
            size="small"
            color={getPaymentColor(p.value as string, isReversal)}
            variant="filled"
            sx={{ fontSize: '0.75rem' }}
          />
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      renderCell: (p) => formatINR(p.value as number),
    },
    {
      field: 'payment_mode_id',
      headerName: 'Mode',
      width: 110,
      renderCell: (p) => paymentModeMap.get(p.value as number)?.name ?? (p.value || '-'),
    },
    { field: 'reference', headerName: 'Reference', width: 140 },
    {
      field: 'reversed',
      headerName: 'Status',
      width: 110,
      renderCell: (p) => {
        const row = p.row as Payment;
        if (row.reversed_payment_id) {
          return <Chip label="Reversal" size="small" color="warning" variant="outlined" />;
        }
        if (row.reversed) {
          return <Chip label="Reversed" size="small" color="error" variant="outlined" />;
        }
        return <Chip label="Active" size="small" color="success" variant="outlined" />;
      },
    },
    { field: 'remarks', headerName: 'Remarks', flex: 1 },
    {
      field: 'receipt', headerName: 'Receipt', width: 70, sortable: false,
      renderCell: (p) => {
        const row = p.row as Payment;
        if (row.reversed || row.reversed_payment_id) return null;
        return <BillButton billType="payment_receipt" recordId={row.id} tooltip="Download Receipt" />;
      },
    },
  ];

  // Admin action column
  if (isAdmin) {
    columns.push({
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        const row = p.row as Payment;
        return (
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        );
      },
    });
  }

  const defaults = useMemo(
    () => ({ date: new Date().toISOString().slice(0, 10), direction: 'payment_to_supplier', amount: 0 }),
    []
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          Payments
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ExportButton exportType="payments" params={params} />
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add New
            </Button>
          )}
        </Box>
      </Box>

      <FilterBar filters={filterConfig} params={params} updateParams={updateParams} />

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by party name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && updateParams({ q: search, page: 1 })}
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

      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        rowCount={meta?.total_count ?? 0}
        paginationMode="server"
        paginationModel={{ page: (params.page ?? 1) - 1, pageSize: params.per_page ?? 25 }}
        onPaginationModelChange={(m: GridPaginationModel) => updateParams({ page: m.page + 1, per_page: m.pageSize })}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        columnVisibilityModel={isMobile ? Object.fromEntries(MOBILE_HIDDEN_COLUMNS.map(c => [c, false])) : {}}
        getRowClassName={(p) => {
          const row = p.row as Payment;
          if (row.reversed_payment_id) return 'row-reversal';
          if (row.reversed) return 'row-reversed';
          return '';
        }}
        sx={{
          backgroundColor: colors.surface,
          '& .MuiDataGrid-columnHeaders': { backgroundColor: colors.tableHeader },
          '& .row-reversed': {
            backgroundColor: colors.reversalRow,
            opacity: 0.7,
            textDecoration: 'line-through',
            '&:hover': { backgroundColor: colors.reversalRowHover },
          },
          '& .row-reversal': {
            backgroundColor: colors.pendingRow,
            fontStyle: 'italic',
            '&:hover': { backgroundColor: colors.pendingRowHover },
          },
        }}
      />

      {/* Actions Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary={`Payment #${menuPayment?.id}`}
            secondary={menuPayment ? formatINR(menuPayment.amount) : ''}
          />
        </MenuItem>
        <MenuItem
          onClick={handleReverseClick}
          disabled={menuPayment?.reversed === true}
        >
          <ListItemIcon><UndoIcon fontSize="small" color={menuPayment?.reversed ? 'disabled' : 'error'} /></ListItemIcon>
          <ListItemText>
            {menuPayment?.reversed ? 'Already Reversed' : 'Reverse Payment'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Reverse Confirmation Dialog */}
      <Dialog open={reverseDialogOpen} onClose={() => setReverseDialogOpen(false)}>
        <DialogTitle sx={{ color: colors.debit }}>Reverse Payment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reverse <strong>Payment #{reverseTarget?.id}</strong>?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, backgroundColor: colors.surfaceAlt, borderRadius: 1 }}>
            <Typography variant="body2"><strong>Party:</strong> {reverseTarget ? partyMap.get(reverseTarget.party_id)?.name : ''}</Typography>
            <Typography variant="body2"><strong>Amount:</strong> {reverseTarget ? formatINR(reverseTarget.amount) : ''}</Typography>
            <Typography variant="body2">
              <strong>Direction:</strong> {reverseTarget ? getPaymentLabel(reverseTarget.direction, false) : ''}
            </Typography>
          </Box>
          <DialogContentText sx={{ mt: 2 }}>
            This will create a new <strong>reversal entry</strong> with the opposite direction
            and mark the original payment as reversed. This action <strong>cannot be undone</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverseDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmReverse}
            color="error"
            variant="contained"
            disabled={reverseMutation.isPending}
          >
            {reverseMutation.isPending ? 'Reversing...' : 'Confirm Reverse'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Payment Dialog */}
      {dialogOpen && (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={(data) => createMutation.mutate(data as Partial<Payment>)}
          title="Add Payment"
          defaultValues={defaults}
          isLoading={createMutation.isPending}
        >
          <FormDateField name="date" label="Date" required />
          <FormAutocomplete name="party_id" label="Party" options={partyOptions} required />
          <FormField name="village_city" label="Village/City" />
          <FormSelectField name="direction" label="Direction" options={directionOptions} required />
          <FormField name="amount" label="Amount" type="number" required />
          <FormSelectField name="payment_mode_id" label="Payment Mode" options={modeOptions} required />
          <FormField name="reference" label="Reference" />
          <FormField name="remarks" label="Remarks" multiline rows={2} />
        </FormDialog>
      )}
    </Box>
  );
}

export default PaymentsPageComp;
