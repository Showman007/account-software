import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SummaryCard, { formatINR } from '../common/SummaryCard.tsx';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { fetchMasterLedger } from '../../api/resources.ts';
import { useIsMobile } from '../../hooks/useIsMobile.ts';
import { useAppColors } from '../../context/ThemeContext.tsx';
import type { LedgerEntry } from '../../types/reports.ts';

interface BuyerEntry extends LedgerEntry {
  total_billed: number;
  total_received: number;
}

interface SupplierEntry extends LedgerEntry {
  total_purchased: number;
  total_paid: number;
}

const MasterLedgerPageComp = () => {
  const isMobile = useIsMobile();
  const colors = useAppColors();
  const { data, isLoading, error } = useQuery({
    queryKey: ['master_ledger'],
    queryFn: fetchMasterLedger,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">Failed to load master ledger data</Alert>;
  if (!data) return null;

  const buyers = (data.buyers_who_owe_us ?? []) as unknown as BuyerEntry[];
  const suppliers = (data.suppliers_we_owe ?? []) as unknown as SupplierEntry[];

  const totalBuyerOwed = buyers.reduce((s, b) => s + Number(b.balance || 0), 0);
  const totalSupplierOwed = suppliers.reduce((s, b) => s + Number(b.balance || 0), 0);
  const totalBilled = buyers.reduce((s, b) => s + Number(b.total_billed || 0), 0);
  const totalPurchased = suppliers.reduce((s, b) => s + Number(b.total_purchased || 0), 0);

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Master Ledger
      </Typography>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="Total Billed (Sales)" value={totalBilled} icon={<TrendingUpIcon />} color={colors.cardGreen} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="Buyers Owe Us" value={totalBuyerOwed} icon={<AccountBalanceIcon />} color={colors.cardRed} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="Total Purchased" value={totalPurchased} icon={<TrendingDownIcon />} color={colors.cardDeepOrange} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="We Owe Suppliers" value={totalSupplierOwed} icon={<AccountBalanceIcon />} color={colors.cardDeepOrange} />
        </Grid>
      </Grid>

      {/* Buyers Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }} color="error.main">
          Buyers Who Owe Us ({buyers.length})
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.tableHeader }}>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Party Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Village/City</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Billed</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Received</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {buyers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">No buyer balances</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {buyers.map((b, i) => (
                    <TableRow key={b.party_id ?? i} hover>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{b.party_name}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{b.village_city || '-'}</TableCell>
                      <TableCell align="right">{formatINR(b.total_billed || 0)}</TableCell>
                      <TableCell align="right" sx={{ color: colors.credit }}>{formatINR(b.total_received || 0)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatINR(Math.abs(Number(b.balance)))}
                          color={Number(b.balance) > 0 ? 'error' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: colors.closingRow, borderTop: `2px solid ${colors.borderStrong}` }}>
                    <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatINR(totalBilled)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.credit }}>
                      {formatINR(buyers.reduce((s, b) => s + Number(b.total_received || 0), 0))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.debit }}>
                      {formatINR(totalBuyerOwed)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Suppliers Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }} color="warning.main">
          Suppliers We Owe ({suppliers.length})
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.tableHeader }}>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Party Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Village/City</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Purchased</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Paid</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">No supplier balances</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {suppliers.map((s, i) => (
                    <TableRow key={s.party_id ?? i} hover>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{s.party_name}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{s.village_city || '-'}</TableCell>
                      <TableCell align="right">{formatINR(s.total_purchased || 0)}</TableCell>
                      <TableCell align="right" sx={{ color: colors.credit }}>{formatINR(s.total_paid || 0)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatINR(Math.abs(Number(s.balance)))}
                          color={Number(s.balance) > 0 ? 'warning' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: colors.closingRow, borderTop: `2px solid ${colors.borderStrong}` }}>
                    <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatINR(totalPurchased)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.credit }}>
                      {formatINR(suppliers.reduce((s, b) => s + Number(b.total_paid || 0), 0))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.cardDeepOrange }}>
                      {formatINR(totalSupplierOwed)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default MasterLedgerPageComp;
