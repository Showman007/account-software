import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Button,
  CircularProgress,
  TablePagination,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SyncIcon from '@mui/icons-material/Sync';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { fetchJournalEntries, fetchAllJournalEntries, backfillJournals } from '../../api/resources.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import SummaryCard from '../common/SummaryCard.tsx';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useAuth } from '../../context/AuthContext.tsx';
import { useIsMobile } from '../../hooks/useIsMobile.ts';
import ExportButton from '../common/ExportButton.tsx';
import FilterBar from '../common/FilterBar.tsx';
import type { FilterFieldConfig } from '../common/FilterBar.tsx';
import { useAppColors } from '../../context/ThemeContext.tsx';
import type { AppColors } from '../../theme/colors.ts';
import type { JournalEntry, JournalLine, JournalSummary } from '../../types/journal.ts';
import type { QueryParams } from '../../types/common.ts';

const entryTypeLabels: Record<string, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  payment_out: 'Payment Out',
  payment_in: 'Payment In',
  expense: 'Expense',
  credit_received: 'Credit Received',
  principal_return: 'Principal Return',
  profit_share: 'Profit Share',
  milling: 'Milling',
  adjustment: 'Adjustment',
  reversal: 'Reversal',
};

const entryTypeColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  purchase: 'warning',
  sale: 'success',
  payment_out: 'error',
  payment_in: 'info',
  expense: 'error',
  credit_received: 'info',
  principal_return: 'warning',
  profit_share: 'secondary',
  milling: 'default',
  adjustment: 'default',
  reversal: 'error',
};

function getAccountTypeColors(colors: AppColors): Record<string, string> {
  return {
    asset: colors.accountAsset,
    liability: colors.accountLiability,
    income: colors.accountIncome,
    expense: colors.accountExpense,
    equity: colors.accountEquity,
  };
}

// ─── Shared Components ──────────────────────────────────────

function JournalLinesDetail({ lines }: { lines: JournalLine[] }) {
  const colors = useAppColors();
  const accountTypeColors = getAccountTypeColors(colors);

  return (
    <Table size="small" sx={{ ml: 4, mr: 4, width: 'auto' }}>
      <TableHead>
        <TableRow sx={{ backgroundColor: colors.surfaceHover }}>
          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Account</TableCell>
          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Type</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Debit</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Credit</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
            <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{line.account_name}</TableCell>
            <TableCell sx={{ py: 0.75 }}>
              <Chip
                label={line.account_type}
                size="small"
                sx={{
                  backgroundColor: accountTypeColors[line.account_type] || colors.badgeDefault,
                  color: 'white',
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.8rem', py: 0.75, color: line.debit > 0 ? colors.debit : 'text.secondary' }}>
              {line.debit > 0 ? formatINR(line.debit) : '-'}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.8rem', py: 0.75, color: line.credit > 0 ? colors.credit : 'text.secondary' }}>
              {line.credit > 0 ? formatINR(line.credit) : '-'}
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '0.8rem', borderBottom: 0 }}>Total</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: colors.debit, borderBottom: 0 }}>
            {formatINR(lines.reduce((sum, l) => sum + Number(l.debit || 0), 0))}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: colors.credit, borderBottom: 0 }}>
            {formatINR(lines.reduce((sum, l) => sum + Number(l.credit || 0), 0))}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function JournalRow({ entry, isExpanded, onToggle }: { entry: JournalEntry; isExpanded: boolean; onToggle: () => void }) {
  const colors = useAppColors();
  const isReversal = entry.entry_type === 'reversal';
  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: 'pointer',
          '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
          backgroundColor: isReversal ? colors.reversalRow : undefined,
          opacity: isReversal ? 0.85 : 1,
        }}
        onClick={onToggle}
      >
        <TableCell sx={{ width: 40, px: 1 }}>
          <IconButton size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{entry.entry_number}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.date}</TableCell>
        <TableCell>
          <Chip
            label={entryTypeLabels[entry.entry_type] ?? entry.entry_type}
            color={entryTypeColors[entry.entry_type] ?? 'default'}
            size="small"
          />
        </TableCell>
        <TableCell>{entry.narration}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          {formatINR(entry.total_amount)}
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>
          {entry.source_type ? entry.source_type.replace(/([A-Z])/g, ' $1').trim() : '-'}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, px: 0, borderBottom: isExpanded ? undefined : 'none' }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2, backgroundColor: colors.detailBg }}>
              <JournalLinesDetail lines={entry.journal_lines} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function SummaryCards({ summary }: { summary: JournalSummary }) {
  const colors = useAppColors();
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard title="Total Entries" value={summary.total_entries} icon={<ReceiptIcon />} color={colors.cardBlue} isCurrency={false} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard title="Total Debit" value={summary.total_debit} icon={<TrendingUpIcon />} color={colors.cardRed} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard title="Total Credit" value={summary.total_credit} icon={<TrendingDownIcon />} color={colors.cardGreen} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Balance (D-C)"
          value={Number(summary.total_debit) - Number(summary.total_credit)}
          icon={<AccountBalanceIcon />}
          color={Number(summary.total_debit) - Number(summary.total_credit) === 0 ? colors.credit : colors.debit}
        />
      </Grid>
    </Grid>
  );
}

function JournalTableHead() {
  const colors = useAppColors();
  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: colors.tableHeader }}>
        <TableCell sx={{ width: 40, px: 1 }} />
        <TableCell sx={{ fontWeight: 'bold' }}>Journal #</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Narration</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
        <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Source</TableCell>
      </TableRow>
    </TableHead>
  );
}

const journalFilterConfig: FilterFieldConfig[] = [
  { type: 'select', name: 'entry_type', label: 'Entry Type', options: Object.entries(entryTypeLabels).map(([value, label]) => ({ value, label })) },
  { type: 'date_range' },
];

function JournalFilterBar({
  search,
  setSearch,
  onSearchSubmit,
  params,
  updateParams,
}: {
  search: string;
  setSearch: (v: string) => void;
  onSearchSubmit: () => void;
  params: QueryParams;
  updateParams: (p: Partial<QueryParams>) => void;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search narration..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
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
      <FilterBar filters={journalFilterConfig} params={params} updateParams={updateParams} />
    </Box>
  );
}

// ─── Paginated View (existing) ──────────────────────────────

function PaginatedView() {
  const [params, setParams] = useState<QueryParams>({ page: 1, per_page: 25 });
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['journal_entries', params],
    queryFn: () => fetchJournalEntries(params),
  });

  const entries = data?.data ?? [];
  const meta = data?.meta;
  const summary = data?.summary;

  const toggleExpand = useCallback((id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateParams = useCallback((newParams: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  return (
    <>
      {summary && <SummaryCards summary={summary} />}

      <JournalFilterBar
        search={search}
        setSearch={setSearch}
        onSearchSubmit={() => updateParams({ q: search, page: 1 })}
        params={params}
        updateParams={updateParams}
      />

      <TableContainer component={Paper}>
        <Table>
          <JournalTableHead />
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No journal entries found. Create transactions or click "Backfill Existing Data".
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <JournalRow
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedRows.has(entry.id)}
                  onToggle={() => toggleExpand(entry.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={meta?.total_count ?? 0}
          page={(params.page ?? 1) - 1}
          rowsPerPage={params.per_page ?? 25}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_e, newPage) => updateParams({ page: newPage + 1 })}
          onRowsPerPageChange={(e) => updateParams({ per_page: parseInt(e.target.value, 10), page: 1 })}
        />
      </TableContainer>
    </>
  );
}

// ─── All Data View (new — all entries expanded) ─────────────

function AllDataView() {
  const colors = useAppColors();
  const accountTypeColors = getAccountTypeColors(colors);
  const [params, setParams] = useState<QueryParams>({});
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['journal_entries_all', params],
    queryFn: () => fetchAllJournalEntries(params),
  });

  const entries = data?.data ?? [];
  const summary = data?.summary;

  const updateParams = useCallback((newParams: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  return (
    <>
      {summary && <SummaryCards summary={summary} />}

      <JournalFilterBar
        search={search}
        setSearch={setSearch}
        onSearchSubmit={() => updateParams({ q: search })}
        params={params}
        updateParams={updateParams}
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" sx={{ mt: 1 }}>Loading all entries...</Typography>
        </Box>
      ) : entries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No journal entries found. Create transactions or click "Backfill Existing Data".
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.tableHeader }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Journal #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Narration</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Account Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Debit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                entry.journal_lines.map((line, idx) => (
                  <TableRow
                    key={`${entry.id}-${line.id}`}
                    sx={{
                      backgroundColor: entry.entry_type === 'reversal'
                        ? (idx === 0 ? colors.reversalRow : colors.reversalRowAlt)
                        : (idx === 0 ? colors.surface : colors.surfaceHover),
                      borderTop: idx === 0 ? `2px solid ${colors.border}` : 'none',
                      opacity: entry.entry_type === 'reversal' ? 0.85 : 1,
                    }}
                  >
                    {/* Show entry info only on first line */}
                    {idx === 0 ? (
                      <>
                        <TableCell rowSpan={entry.journal_lines.length} sx={{ fontWeight: 500, whiteSpace: 'nowrap', verticalAlign: 'top', borderRight: `1px solid ${colors.border}` }}>
                          {entry.entry_number}
                        </TableCell>
                        <TableCell rowSpan={entry.journal_lines.length} sx={{ whiteSpace: 'nowrap', verticalAlign: 'top', borderRight: `1px solid ${colors.border}` }}>
                          {entry.date}
                        </TableCell>
                        <TableCell rowSpan={entry.journal_lines.length} sx={{ verticalAlign: 'top', borderRight: `1px solid ${colors.border}` }}>
                          <Chip
                            label={entryTypeLabels[entry.entry_type] ?? entry.entry_type}
                            color={entryTypeColors[entry.entry_type] ?? 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell rowSpan={entry.journal_lines.length} sx={{ verticalAlign: 'top', borderRight: `1px solid ${colors.border}`, maxWidth: 300, display: { xs: 'none', sm: 'table-cell' } }}>
                          {entry.narration}
                        </TableCell>
                      </>
                    ) : null}
                    <TableCell sx={{ fontSize: '0.85rem' }}>{line.account_name}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip
                        label={line.account_type}
                        size="small"
                        sx={{
                          backgroundColor: accountTypeColors[line.account_type] || colors.badgeDefault,
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.85rem', color: line.debit > 0 ? colors.debit : 'text.secondary' }}>
                      {line.debit > 0 ? formatINR(line.debit) : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.85rem', color: line.credit > 0 ? colors.credit : 'text.secondary' }}>
                      {line.credit > 0 ? formatINR(line.credit) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ))}
              {/* Grand total row */}
              {summary && (
                <TableRow sx={{ borderTop: `3px solid ${colors.borderStrong}` }}>
                  <TableCell colSpan={6} sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Grand Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.9rem', color: colors.debit }}>
                    {formatINR(summary.total_debit)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.9rem', color: colors.credit }}>
                    {formatINR(summary.total_credit)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

// ─── Main Page with Tabs ────────────────────────────────────

const JournalPageComp = () => {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  const backfillMutation = useMutation({
    mutationFn: backfillJournals,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal_entries_all'] });
    },
    onError: () => toast.error('Backfill failed'),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Journal Entries
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ExportButton exportType="journal_entries" />
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={backfillMutation.isPending ? <CircularProgress size={16} /> : <SyncIcon />}
              onClick={() => backfillMutation.mutate()}
              disabled={backfillMutation.isPending}
            >
              Backfill Existing Data
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<ViewListIcon />} iconPosition="start" label="Paginated View" />
          <Tab icon={<ViewStreamIcon />} iconPosition="start" label="All Data (Ledger View)" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <PaginatedView />}
      {activeTab === 1 && <AllDataView />}
    </Box>
  );
}

export default JournalPageComp;
