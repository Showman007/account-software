import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Collapse,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import SummaryCard, { formatINR } from '../common/SummaryCard.tsx';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { fetchPartyLedger, partiesApi } from '../../api/resources.ts';
import { useIsMobile } from '../../hooks/useIsMobile.ts';
import { useAppColors } from '../../context/ThemeContext.tsx';

interface TransformedTxn {
  id: number;
  date: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface BillPayment {
  payment_id: number;
  date: string;
  amount: number;
  reference: string | null;
  mode: string | null;
}

interface BillSummaryItem {
  type: string;
  id: number;
  date: string;
  product: string;
  bill_amount: number;
  total_allocated: number;
  balance: number;
  status: 'cleared' | 'pending';
  payments: BillPayment[];
}

function transformTransactions(
  transactions: Record<string, unknown>[],
  partyType: string,
  openingBalance: number
): TransformedTxn[] {
  const rows: TransformedTxn[] = [];
  let balance = openingBalance;

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const type = t.type as string;
    let debit = 0;
    let credit = 0;

    if (type === 'inbound') {
      credit = Number(t.amount || 0);
      balance += credit;
    } else if (type === 'outbound') {
      debit = Number(t.amount || 0);
      balance += debit;
    } else if (type === 'payment') {
      const desc = t.description as string;
      if (desc?.includes('supplier') || desc?.includes('Payment to')) {
        debit = Number(t.amount || 0);
        balance -= debit;
      } else {
        credit = Number(t.amount || 0);
        balance -= credit;
      }
    }

    rows.push({
      id: i + 1,
      date: t.date as string,
      type,
      description: t.description as string,
      debit,
      credit,
      runningBalance: balance,
    });
  }

  return rows;
}

const typeChipColor: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  inbound: 'warning',
  outbound: 'success',
  payment: 'info',
};

// ─── Bill Summary Tab ──────────────────────────────────────

function BillSummaryView({ bills, colors }: { bills: BillSummaryItem[]; colors: ReturnType<typeof useAppColors> }) {
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const isMobile = useIsMobile();

  if (!bills || bills.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">No bills found for this party.</Typography>
      </Paper>
    );
  }

  const toggleExpand = (key: string) => {
    setExpandedBill(expandedBill === key ? null : key);
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: colors.tableHeader }}>
            <TableCell sx={{ width: 40, px: 1 }} />
            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Product</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Bill Amount</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Paid</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
            <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bills.map((bill) => {
            const key = `${bill.type}-${bill.id}`;
            const isExpanded = expandedBill === key;
            const paidPct = bill.bill_amount > 0 ? (bill.total_allocated / bill.bill_amount) * 100 : 0;

            return (
              <>
                <TableRow
                  key={key}
                  hover
                  onClick={() => bill.payments.length > 0 && toggleExpand(key)}
                  sx={{
                    cursor: bill.payments.length > 0 ? 'pointer' : 'default',
                    '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
                    backgroundColor: bill.status === 'cleared' ? colors.openingRow : undefined,
                  }}
                >
                  <TableCell sx={{ px: 1 }}>
                    {bill.payments.length > 0 && (
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{bill.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={bill.type === 'outbound' ? 'Sale' : 'Purchase'}
                      color={bill.type === 'outbound' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{bill.product || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>{formatINR(bill.bill_amount)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: colors.credit, fontWeight: 500 }}>
                        {formatINR(bill.total_allocated)}
                      </Typography>
                      {!isMobile && (
                        <Tooltip title={`${paidPct.toFixed(0)}% paid`}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(paidPct, 100)}
                            sx={{ width: 40, height: 6, borderRadius: 3 }}
                            color={paidPct >= 100 ? 'success' : 'primary'}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: bill.balance > 0 ? colors.debit : colors.credit }}>
                    {formatINR(bill.balance)}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {bill.status === 'cleared' ? (
                      <Chip icon={<CheckCircleIcon />} label="Cleared" color="success" size="small" variant="outlined" />
                    ) : (
                      <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" variant="outlined" />
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded: Payment allocations for this bill */}
                <TableRow key={`${key}-detail`}>
                  <TableCell colSpan={8} sx={{ py: 0, px: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ py: 1.5, px: { xs: 2, sm: 6 }, backgroundColor: colors.surfaceHover }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Payment Allocations for {bill.type === 'outbound' ? 'Sale' : 'Purchase'} #{bill.id}
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Payment #</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', display: { xs: 'none', sm: 'table-cell' } }}>Mode</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', display: { xs: 'none', sm: 'table-cell' } }}>Reference</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {bill.payments.map((p) => (
                              <TableRow key={p.payment_id}>
                                <TableCell sx={{ fontSize: '0.8rem' }}>#{p.payment_id}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{p.date}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', display: { xs: 'none', sm: 'table-cell' } }}>{p.mode || '-'}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', display: { xs: 'none', sm: 'table-cell' } }}>{p.reference || '-'}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 500, color: colors.credit }}>
                                  {formatINR(p.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={isMobile ? 2 : 4} sx={{ fontWeight: 'bold', fontSize: '0.8rem', borderBottom: 0 }}>Total</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: colors.credit, borderBottom: 0 }}>
                                {formatINR(bill.total_allocated)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            );
          })}

          {/* Totals row */}
          <TableRow sx={{ backgroundColor: colors.closingRow, borderTop: `2px solid ${colors.borderStrong}` }}>
            <TableCell />
            <TableCell colSpan={isMobile ? 2 : 3} sx={{ fontWeight: 'bold' }}>Total</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              {formatINR(bills.reduce((s, b) => s + Number(b.bill_amount), 0))}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.credit }}>
              {formatINR(bills.reduce((s, b) => s + Number(b.total_allocated), 0))}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.debit }}>
              {formatINR(bills.reduce((s, b) => s + Number(b.balance), 0))}
            </TableCell>
            {!isMobile && <TableCell />}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Main Component ────────────────────────────────────────

const PartyLedgerPageComp = () => {
  const isMobile = useIsMobile();
  const colors = useAppColors();
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const { data: partiesData } = useQuery({
    queryKey: ['parties', 'all'],
    queryFn: () => partiesApi.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const parties = partiesData?.data ?? [];
  const partyOptions = useMemo(
    () => parties.map((p) => ({ id: p.id, label: `${p.name} (${p.village_city || ''})`, party_type: p.party_type })),
    [parties]
  );

  const { data: ledger, isLoading, error } = useQuery({
    queryKey: ['party_ledger', selectedPartyId],
    queryFn: () => fetchPartyLedger(selectedPartyId!),
    enabled: !!selectedPartyId,
  });

  const selectedParty = partyOptions.find((p) => p.id === selectedPartyId);
  const summary = ledger?.summary ?? {};
  const rawTransactions = (ledger?.transactions ?? []) as Record<string, unknown>[];
  const billSummary = (ledger?.bill_summary ?? []) as unknown as BillSummaryItem[];

  const transactions = useMemo(() => {
    if (!rawTransactions.length) return [];
    const openingBalance = Number((ledger?.party as Record<string, unknown>)?.opening_balance || 0);
    return transformTransactions(rawTransactions, selectedParty?.party_type || '', openingBalance);
  }, [rawTransactions, ledger, selectedParty]);

  const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
  const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].runningBalance : 0;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
        Party Ledger
      </Typography>
      <Autocomplete
        options={partyOptions}
        getOptionLabel={(opt) => opt.label}
        onChange={(_e, val) => { setSelectedPartyId(val?.id ?? null); setActiveTab(0); }}
        renderInput={(params) => <TextField {...params} label="Select Party" />}
        sx={{ mb: 3, maxWidth: { xs: '100%', sm: 400 } }}
      />
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">Failed to load party ledger</Alert>}
      {ledger && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title="Total Debit" value={totalDebit} icon={<TrendingUpIcon />} color={colors.cardRed} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title="Total Credit" value={totalCredit} icon={<TrendingDownIcon />} color={colors.cardGreen} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title="Transactions" value={transactions.length} icon={<ReceiptIcon />} color={colors.cardBlue} isCurrency={false} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title="Closing Balance" value={closingBalance} icon={<AccountBalanceIcon />} color={closingBalance >= 0 ? colors.cardDeepOrange : colors.cardGreen} />
            </Grid>
          </Grid>

          {/* Detail Summary */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Detailed Summary
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(summary).map(([key, value]) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={key}>
                  <Typography variant="caption" color="text.secondary">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {typeof value === 'number' ? formatINR(value) : String(value)}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Tabs: Ledger vs Bill Summary */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Ledger View" />
              <Tab label="Bill Adjustments" />
            </Tabs>
          </Paper>

          {activeTab === 0 && (
            /* Transaction Table (existing ledger) */
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.tableHeader }}>
                    <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Debit</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Credit</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Opening Balance Row */}
                  <TableRow sx={{ backgroundColor: colors.openingRow }}>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }} />
                    <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Opening Balance</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatINR(Number((ledger?.party as Record<string, unknown>)?.opening_balance || 0))}
                    </TableCell>
                  </TableRow>

                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No transactions found for this party.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((txn) => (
                      <TableRow key={txn.id} hover>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{txn.id}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{txn.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                            color={typeChipColor[txn.type] ?? 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{txn.description}</TableCell>
                        <TableCell align="right" sx={{ color: txn.debit > 0 ? colors.debit : 'text.secondary', fontWeight: txn.debit > 0 ? 500 : 400 }}>
                          {txn.debit > 0 ? formatINR(txn.debit) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: txn.credit > 0 ? colors.credit : 'text.secondary', fontWeight: txn.credit > 0 ? 500 : 400 }}>
                          {txn.credit > 0 ? formatINR(txn.credit) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {formatINR(txn.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Closing Balance Row */}
                  {transactions.length > 0 && (
                    <TableRow sx={{ backgroundColor: colors.closingRow, borderTop: `2px solid ${colors.borderStrong}` }}>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }} />
                      <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Closing Balance</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.debit }}>
                        {formatINR(totalDebit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: colors.credit }}>
                        {formatINR(totalCredit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {formatINR(closingBalance)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && (
            <BillSummaryView bills={billSummary} colors={colors} />
          )}
        </>
      )}
    </Box>
  );
}

export default PartyLedgerPageComp;
