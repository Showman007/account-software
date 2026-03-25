import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SummaryCard, { formatINR } from '../components/common/SummaryCard.tsx';
import { fetchDashboard } from '../api/resources.ts';
import { useAppColors } from '../context/ThemeContext.tsx';

const millingColumns: GridColDef[] = [
  { field: 'key', headerName: 'Metric', flex: 1 },
  { field: 'value', headerName: 'Value', flex: 1 },
];

const partnerColumns: GridColDef[] = [
  { field: 'key', headerName: 'Metric', flex: 1 },
  { field: 'value', headerName: 'Value', flex: 1 },
];

export default function DashboardPage() {
  const colors = useAppColors();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard data</Alert>;
  }

  if (!data) return null;

  const millingRows = Object.entries(data.milling_summary ?? {}).map(([key, value], idx) => ({
    id: idx,
    key: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: typeof value === 'number' ? formatINR(value) : String(value),
  }));

  const partnersData = data.partners_overview ?? {};
  const partnerRows = (Array.isArray(partnersData) ? [] : Object.entries(partnersData)).map(([key, value], idx) => ({
    id: idx,
    key: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: typeof value === 'number' ? formatINR(value) : String(value),
  }));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Purchases"
            value={data.total_purchased}
            icon={<ShoppingCartIcon />}
            color={colors.cardBlue}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Sales"
            value={data.total_sold}
            icon={<SellIcon />}
            color={colors.cardGreen}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Expenses"
            value={data.total_expenses}
            icon={<ReceiptIcon />}
            color={colors.cardOrange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Net Profit"
            value={data.net_profit}
            icon={<TrendingUpIcon />}
            color={Number(data.net_profit) >= 0 ? colors.profit : colors.loss}
          />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Milling Summary
            </Typography>
            <DataGrid
              rows={millingRows}
              columns={millingColumns}
              autoHeight
              hideFooter
              disableRowSelectionOnClick
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Partners Overview
            </Typography>
            <DataGrid
              rows={partnerRows}
              columns={partnerColumns}
              autoHeight
              hideFooter
              disableRowSelectionOnClick
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
