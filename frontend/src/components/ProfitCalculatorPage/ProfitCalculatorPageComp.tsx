import { useQuery } from '@tanstack/react-query';
import { Box, Typography, CircularProgress, Alert, Grid, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SummaryCard, { formatINR } from '../common/SummaryCard.tsx';
import { fetchProfitCalculator } from '../../api/resources.ts';
import { useAppColors } from '../../context/ThemeContext.tsx';

const partnerColumns: GridColDef[] = [
  { field: 'name', headerName: 'Partner Name', flex: 1 },
  { field: 'share_type', headerName: 'Share Type', width: 120 },
  { field: 'share_rate', headerName: 'Rate', width: 100 },
  { field: 'share_amount', headerName: 'Share Amount', width: 150, renderCell: (p) => formatINR(p.value as number) },
];

const ProfitCalculatorPageComp = () => {
  const colors = useAppColors();
  const { data, isLoading, error } = useQuery({
    queryKey: ['profit_calculator'],
    queryFn: fetchProfitCalculator,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">Failed to load profit calculator data</Alert>;
  if (!data) return null;

  const partnerShares = (data.partner_shares ?? []).map((s, i) => ({ id: i + 1, ...s }));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Profit Calculator
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="Total Revenue" value={data.total_revenue} icon={<SellIcon />} color={colors.cardGreen} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="Total Purchases" value={data.total_purchases} icon={<ShoppingCartIcon />} color={colors.cardBlue} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="Milling Cost" value={data.total_milling_cost} icon={<PrecisionManufacturingIcon />} color={colors.cardOrange} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="Other Expenses" value={data.total_other_expenses} icon={<ReceiptIcon />} color={colors.cardPurple} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard
            title="Net Profit"
            value={data.net_profit}
            icon={<TrendingUpIcon />}
            color={data.net_profit >= 0 ? colors.profit : colors.loss}
          />
        </Grid>
      </Grid>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Partner Shares
        </Typography>
        <DataGrid
          rows={partnerShares}
          columns={partnerColumns}
          autoHeight
          hideFooter
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}

export default ProfitCalculatorPageComp;
