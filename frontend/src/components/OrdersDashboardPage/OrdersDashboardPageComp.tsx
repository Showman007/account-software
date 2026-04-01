import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Typography, CircularProgress, Alert, Paper, Chip, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SummaryCard, { formatINR } from '../common/SummaryCard.tsx';
import { fetchOrdersDashboard } from '../../api/resources.ts';
import { useAppColors } from '../../context/ThemeContext.tsx';
import type { OrdersDashboardData } from '../../types/reports.ts';

function getFinancialYearDates(): { from: Dayjs; to: Dayjs } {
  const today = dayjs();
  const currentMonth = today.month(); // 0-indexed, so March = 2
  const year = currentMonth >= 3 ? today.year() : today.year() - 1;
  return {
    from: dayjs(`${year}-04-01`),
    to: dayjs(`${year + 1}-03-31`),
  };
}

const PIPELINE_COLORS: Record<string, string> = {
  quotation: '#42a5f5',
  confirmed: '#66bb6a',
  processing: '#29b6f6',
  shipped: '#ffa726',
  partial_delivered: '#ab47bc',
  delivered: '#26a69a',
  closed: '#78909c',
  cancelled: '#ef5350',
};

function getPipelineColor(status: string): string {
  return PIPELINE_COLORS[status] || '#90a4ae';
}

const OrdersDashboardPageComp = () => {
  const colors = useAppColors();
  const fyDates = useMemo(() => getFinancialYearDates(), []);
  const [fromDate, setFromDate] = useState<Dayjs | null>(fyDates.from);
  const [toDate, setToDate] = useState<Dayjs | null>(fyDates.to);

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders-dashboard', fromDate?.format('YYYY-MM-DD'), toDate?.format('YYYY-MM-DD')],
    queryFn: () =>
      fetchOrdersDashboard({
        from_date: fromDate?.format('YYYY-MM-DD'),
        to_date: toDate?.format('YYYY-MM-DD'),
      }),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load orders dashboard data</Alert>;
  }

  if (!data) return null;

  return (
    <Box>
      {/* Header with date filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight="bold">Orders &amp; Delivery Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <DatePicker
            label="From"
            value={fromDate}
            onChange={(val) => setFromDate(val)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
          <DatePicker
            label="To"
            value={toDate}
            onChange={(val) => setToDate(val)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
        </Box>
      </Box>

      {/* Summary Cards */}
      <SummaryCardsSection data={data} colors={colors} />

      {/* Attention Alerts */}
      <AttentionSection data={data} colors={colors} />

      {/* Order Pipeline */}
      <PipelineSection data={data} />

      {/* Two-column: Delivery Trend + Product Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DeliveryTrendSection data={data} colors={colors} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ProductSummarySection data={data} />
        </Grid>
      </Grid>

      {/* Top Parties */}
      <TopPartiesSection data={data} />

      {/* Recent Activity */}
      <RecentActivitySection data={data} />
    </Box>
  );
};

/* ---------- Summary Cards ---------- */
function SummaryCardsSection({ data, colors }: { data: OrdersDashboardData; colors: ReturnType<typeof useAppColors> }) {
  const sc = data.summary_cards;
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard title="Total Order Value" value={sc.total_order_value} icon={<ShoppingCartIcon />} color={colors.cardBlue} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard title="Delivered Value" value={sc.total_delivered_value} icon={<LocalShippingIcon />} color={colors.cardGreen} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard title="Pending Delivery" value={sc.pending_delivery_value} icon={<PendingActionsIcon />} color={colors.cardOrange} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard title="Outstanding Balance" value={sc.outstanding_balance} icon={<AccountBalanceWalletIcon />} color={colors.cardRed} />
      </Grid>
    </Grid>
  );
}

/* ---------- Attention Alerts ---------- */
function AttentionSection({ data, colors }: { data: OrdersDashboardData; colors: ReturnType<typeof useAppColors> }) {
  const a = data.attention;
  const alerts = [
    { label: 'Expired Quotations', value: a.expired_quotations_count, color: colors.cardRed },
    { label: 'In Transit', value: a.in_transit_count, color: colors.cardOrange },
    { label: 'Stale Orders', value: a.stale_orders_count, color: colors.cardDeepOrange },
    { label: 'Credit Notes', value: `${a.credit_notes_count} (${formatINR(a.credit_notes_amount)})`, color: colors.cardPurple },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {alerts.map((item) => (
        <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WarningAmberIcon sx={{ color: item.color, fontSize: 28 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
              <Typography variant="h6" fontWeight="bold">{item.value}</Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

/* ---------- Order Pipeline ---------- */
function PipelineSection({ data }: { data: OrdersDashboardData }) {
  const pipeline = data.order_pipeline;
  const entries = Object.entries(pipeline);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (total === 0) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Order Pipeline</Typography>
        <Typography variant="body2" color="text.secondary">No orders in pipeline</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Order Pipeline</Typography>
      <Box sx={{ display: 'flex', height: 40, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
        {entries.map(([status, count]) => {
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <Box
              key={status}
              sx={{
                width: `${pct}%`,
                backgroundColor: getPipelineColor(status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: count > 0 ? 40 : 0,
                transition: 'width 0.3s',
              }}
              title={`${status}: ${count}`}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.7rem' }}>
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {entries.map(([status, count]) => (
          <Chip
            key={status}
            label={`${status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}: ${count}`}
            size="small"
            sx={{
              backgroundColor: getPipelineColor(status),
              color: '#fff',
              fontWeight: 'bold',
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}

/* ---------- Delivery Trend (recharts bar chart) ---------- */
function DeliveryTrendSection({ data, colors }: { data: OrdersDashboardData; colors: ReturnType<typeof useAppColors> }) {
  const trend = data.delivery_trend;

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Delivery Trend</Typography>
      {trend.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No delivery data for this period</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="period" tick={{ fill: colors.textMuted, fontSize: 12 }} />
            <YAxis tick={{ fill: colors.textMuted, fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            />
            <Legend />
            <Bar dataKey="orders_count" name="Orders" fill={colors.cardBlue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="delivered_qty" name="Delivered Qty" fill={colors.cardGreen} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

/* ---------- Product Summary ---------- */
function ProductSummarySection({ data }: { data: OrdersDashboardData }) {
  const products = data.product_summary;

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Product Summary</Typography>
      {products.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No product data</Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 340 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Ordered</TableCell>
                <TableCell align="right">Delivered</TableCell>
                <TableCell align="right">Pending</TableCell>
                <TableCell align="right">Fulfillment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.product_name}>
                  <TableCell>{p.product_name}</TableCell>
                  <TableCell align="right">{Number(p.ordered_qty).toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right">{Number(p.delivered_qty).toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right">{Number(p.pending_qty).toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(Number(p.fulfillment_pct), 100)}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption">{Number(p.fulfillment_pct).toFixed(0)}%</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

/* ---------- Top Parties ---------- */
function TopPartiesSection({ data }: { data: OrdersDashboardData }) {
  const partyColumns: GridColDef[] = [
    { field: 'party_name', headerName: 'Party', flex: 1.5 },
    { field: 'city', headerName: 'City', flex: 1 },
    { field: 'order_value', headerName: 'Order Value', flex: 1, renderCell: (p) => formatINR(p.value) },
    { field: 'delivered_value', headerName: 'Delivered', flex: 1, renderCell: (p) => formatINR(p.value) },
    { field: 'received', headerName: 'Received', flex: 1, renderCell: (p) => formatINR(p.value) },
    { field: 'outstanding', headerName: 'Outstanding', flex: 1, renderCell: (p) => <Typography color="error" variant="body2">{formatINR(p.value)}</Typography> },
  ];

  const rows = data.top_parties.map((p) => ({ id: p.party_id, ...p }));

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Top Parties by Outstanding</Typography>
      <DataGrid
        rows={rows}
        columns={partyColumns}
        autoHeight
        hideFooter
        disableRowSelectionOnClick
        initialState={{ sorting: { sortModel: [{ field: 'outstanding', sort: 'desc' }] } }}
      />
    </Paper>
  );
}

/* ---------- Recent Activity ---------- */
function RecentActivitySection({ data }: { data: OrdersDashboardData }) {
  const activityColumns: GridColDef[] = [
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'order_number', headerName: 'Order #', width: 140 },
    {
      field: 'event_type',
      headerName: 'Event',
      width: 160,
      renderCell: (p) => (
        <Chip
          label={String(p.value).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status_change',
      headerName: 'Status Change',
      flex: 1,
      renderCell: (p) => {
        const row = p.row;
        if (row.status_from && row.status_to) {
          return `${row.status_from} -> ${row.status_to}`;
        }
        return row.remarks || '-';
      },
    },
    { field: 'remarks', headerName: 'Remarks', flex: 1 },
  ];

  const rows = data.recent_activity.map((a) => ({
    id: a.id,
    date: dayjs(a.date).format('DD/MM/YYYY'),
    order_number: a.order_number,
    event_type: a.event_type,
    status_from: a.status_from,
    status_to: a.status_to,
    remarks: a.remarks || '-',
  }));

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
      <DataGrid
        rows={rows}
        columns={activityColumns}
        autoHeight
        disableRowSelectionOnClick
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25]}
      />
    </Paper>
  );
}

export default OrdersDashboardPageComp;
