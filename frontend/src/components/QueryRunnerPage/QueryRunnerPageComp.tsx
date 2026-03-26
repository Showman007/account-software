import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Collapse,
  IconButton,
  Tooltip,
  Divider,
  Badge,
  Drawer,
  alpha,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StorageIcon from '@mui/icons-material/Storage';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TimerIcon from '@mui/icons-material/Timer';
import DataArrayIcon from '@mui/icons-material/DataArray';
import KeyIcon from '@mui/icons-material/Key';
import { useIsMobile } from '../../hooks/useIsMobile.ts';
import { useAppColors } from '../../context/ThemeContext.tsx';
import { executeQuery, fetchTables } from '../../api/resources.ts';
import type { QueryResult, TableInfo } from '../../api/resources.ts';
import { toast } from 'react-toastify';

const GROUP_ICONS: Record<string, React.ReactNode> = {
  'Audit Journal': <GavelIcon fontSize="small" />,
  'Ledger Reports': <AccountBalanceIcon fontSize="small" />,
  'Financial Summary': <BarChartIcon fontSize="small" />,
  'Quick Queries': <BoltIcon fontSize="small" />,
};

const QUERY_GROUPS = [
  {
    group: 'Audit Journal',
    queries: [
      {
        label: 'Full Journal Register',
        description: 'Complete chronological journal with all debit/credit lines',
        sql: `SELECT
  je.entry_number AS "Entry No",
  je.date AS "Date",
  je.narration AS "Narration",
  CASE je.entry_type
    WHEN 0 THEN 'Purchase' WHEN 1 THEN 'Sale'
    WHEN 2 THEN 'Payment Out' WHEN 3 THEN 'Payment In'
    WHEN 4 THEN 'Expense' WHEN 5 THEN 'Credit Received'
    WHEN 6 THEN 'Principal Return' WHEN 7 THEN 'Profit Share'
    WHEN 8 THEN 'Milling' WHEN 9 THEN 'Adjustment'
    WHEN 10 THEN 'REVERSAL'
  END AS "Type",
  jl.account_name AS "Account",
  CASE jl.account_type
    WHEN 0 THEN 'Asset' WHEN 1 THEN 'Liability'
    WHEN 2 THEN 'Income' WHEN 3 THEN 'Expense' WHEN 4 THEN 'Equity'
  END AS "Account Type",
  CASE WHEN jl.debit > 0 THEN jl.debit ELSE NULL END AS "Debit",
  CASE WHEN jl.credit > 0 THEN jl.credit ELSE NULL END AS "Credit",
  je.source_type AS "Source",
  je.source_id AS "Source ID",
  je.created_at AS "Created At"
FROM journal_entries je
JOIN journal_lines jl ON jl.journal_entry_id = je.id
ORDER BY je.date ASC, je.entry_number ASC, jl.debit DESC;`,
      },
      {
        label: 'Trial Balance',
        description: 'Account-wise total debits and credits with net balance',
        sql: `SELECT
  jl.account_name AS "Account",
  CASE jl.account_type
    WHEN 0 THEN 'Asset' WHEN 1 THEN 'Liability'
    WHEN 2 THEN 'Income' WHEN 3 THEN 'Expense' WHEN 4 THEN 'Equity'
  END AS "Account Type",
  SUM(jl.debit) AS "Total Debit",
  SUM(jl.credit) AS "Total Credit",
  SUM(jl.debit) - SUM(jl.credit) AS "Net Balance"
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
GROUP BY jl.account_name, jl.account_type
HAVING SUM(jl.debit) != 0 OR SUM(jl.credit) != 0
ORDER BY jl.account_type, jl.account_name;`,
      },
      {
        label: 'Reversal Audit Trail',
        description: 'All reversal entries with original entry reference',
        sql: `SELECT
  rev.entry_number AS "Reversal Entry",
  rev.date AS "Reversal Date",
  rev.narration AS "Narration",
  rev.total_amount AS "Amount",
  orig.entry_number AS "Original Entry",
  orig.date AS "Original Date",
  CASE orig.entry_type
    WHEN 0 THEN 'Purchase' WHEN 1 THEN 'Sale'
    WHEN 2 THEN 'Payment Out' WHEN 3 THEN 'Payment In'
    WHEN 4 THEN 'Expense' WHEN 5 THEN 'Credit Received'
    WHEN 6 THEN 'Principal Return' WHEN 7 THEN 'Profit Share'
    WHEN 8 THEN 'Milling' WHEN 9 THEN 'Adjustment'
  END AS "Original Type",
  rev.source_type AS "Source",
  rev.source_id AS "Source ID",
  rev.created_at AS "Reversed At"
FROM journal_entries rev
LEFT JOIN journal_entries orig ON orig.id = rev.reversed_entry_id
WHERE rev.entry_type = 10
ORDER BY rev.created_at DESC;`,
      },
      {
        label: 'Debit = Credit Check',
        description: 'Verify every journal entry balances (debits = credits)',
        sql: `SELECT
  je.entry_number AS "Entry No",
  je.date AS "Date",
  je.narration AS "Narration",
  SUM(jl.debit) AS "Total Debit",
  SUM(jl.credit) AS "Total Credit",
  ROUND(SUM(jl.debit) - SUM(jl.credit), 2) AS "Difference",
  CASE WHEN ABS(SUM(jl.debit) - SUM(jl.credit)) < 0.01 THEN 'OK' ELSE 'MISMATCH' END AS "Status"
FROM journal_entries je
JOIN journal_lines jl ON jl.journal_entry_id = je.id
GROUP BY je.id, je.entry_number, je.date, je.narration
ORDER BY ABS(SUM(jl.debit) - SUM(jl.credit)) DESC, je.date;`,
      },
      {
        label: 'Day Book',
        description: 'All journal entries for today grouped by type',
        sql: `SELECT
  je.entry_number AS "Entry No",
  CASE je.entry_type
    WHEN 0 THEN 'Purchase' WHEN 1 THEN 'Sale'
    WHEN 2 THEN 'Payment Out' WHEN 3 THEN 'Payment In'
    WHEN 4 THEN 'Expense' WHEN 5 THEN 'Credit Received'
    WHEN 6 THEN 'Principal Return' WHEN 7 THEN 'Profit Share'
    WHEN 8 THEN 'Milling' WHEN 9 THEN 'Adjustment'
    WHEN 10 THEN 'REVERSAL'
  END AS "Type",
  je.narration AS "Narration",
  je.total_amount AS "Amount",
  je.source_type AS "Source",
  je.created_at AS "Time"
FROM journal_entries je
WHERE je.date = CURRENT_DATE
ORDER BY je.created_at ASC;`,
      },
    ],
  },
  {
    group: 'Ledger Reports',
    queries: [
      {
        label: 'Supplier Ledger',
        description: 'Purchase and payment summary per supplier',
        sql: `SELECT
  p.name AS "Supplier",
  COALESCE(purchase.total_amt, 0) AS "Total Purchased",
  COALESCE(paid.total_paid, 0) AS "Total Paid",
  COALESCE(purchase.total_amt, 0) - COALESCE(paid.total_paid, 0) AS "Balance Due"
FROM parties p
LEFT JOIN (
  SELECT party_id, SUM(net_amt) AS total_amt FROM inbound_entries GROUP BY party_id
) purchase ON purchase.party_id = p.id
LEFT JOIN (
  SELECT party_id, SUM(amount) AS total_paid FROM payments WHERE direction = 0 AND reversed = false GROUP BY party_id
) paid ON paid.party_id = p.id
WHERE p.party_type IN (0, 2)
  AND (COALESCE(purchase.total_amt, 0) > 0 OR COALESCE(paid.total_paid, 0) > 0)
ORDER BY "Balance Due" DESC;`,
      },
      {
        label: 'Buyer Ledger',
        description: 'Sales and receipt summary per buyer',
        sql: `SELECT
  p.name AS "Buyer",
  COALESCE(sales.total_bill, 0) AS "Total Billed",
  COALESCE(received.total_received, 0) AS "Total Received",
  COALESCE(sales.total_bill, 0) - COALESCE(received.total_received, 0) AS "Balance Receivable"
FROM parties p
LEFT JOIN (
  SELECT party_id, SUM(total_bill) AS total_bill FROM outbound_entries GROUP BY party_id
) sales ON sales.party_id = p.id
LEFT JOIN (
  SELECT party_id, SUM(amount) AS total_received FROM payments WHERE direction = 1 AND reversed = false GROUP BY party_id
) received ON received.party_id = p.id
WHERE p.party_type IN (1, 2)
  AND (COALESCE(sales.total_bill, 0) > 0 OR COALESCE(received.total_received, 0) > 0)
ORDER BY "Balance Receivable" DESC;`,
      },
      {
        label: 'Account Ledger',
        description: 'Running balance per account from journal lines',
        sql: `SELECT
  jl.account_name AS "Account",
  je.date AS "Date",
  je.entry_number AS "Entry No",
  je.narration AS "Narration",
  jl.debit AS "Debit",
  jl.credit AS "Credit",
  SUM(jl.debit - jl.credit) OVER (
    PARTITION BY jl.account_name ORDER BY je.date, je.entry_number
  ) AS "Running Balance"
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
ORDER BY jl.account_name, je.date, je.entry_number;`,
      },
    ],
  },
  {
    group: 'Financial Summary',
    queries: [
      {
        label: 'Monthly P&L',
        description: 'Income vs expense breakdown by month',
        sql: `SELECT
  TO_CHAR(je.date, 'YYYY-MM') AS "Month",
  SUM(CASE WHEN jl.account_type = 2 THEN jl.credit - jl.debit ELSE 0 END) AS "Total Income",
  SUM(CASE WHEN jl.account_type = 3 THEN jl.debit - jl.credit ELSE 0 END) AS "Total Expense",
  SUM(CASE WHEN jl.account_type = 2 THEN jl.credit - jl.debit ELSE 0 END)
  - SUM(CASE WHEN jl.account_type = 3 THEN jl.debit - jl.credit ELSE 0 END) AS "Net Profit/Loss"
FROM journal_entries je
JOIN journal_lines jl ON jl.journal_entry_id = je.id
GROUP BY TO_CHAR(je.date, 'YYYY-MM')
ORDER BY "Month";`,
      },
      {
        label: 'Expense Breakdown',
        description: 'Expense totals by category',
        sql: `SELECT
  ec.name AS "Category",
  COUNT(*) AS "Count",
  SUM(e.amount) AS "Total Amount",
  ROUND(AVG(e.amount), 2) AS "Average"
FROM expenses e
JOIN expense_categories ec ON ec.id = e.category_id
GROUP BY ec.name
ORDER BY "Total Amount" DESC;`,
      },
      {
        label: 'Payment Reversals',
        description: 'All reversed payments with original reference',
        sql: `SELECT
  rev.id AS "Reversal ID",
  rev.date AS "Date",
  p.name AS "Party",
  CASE rev.direction WHEN 0 THEN 'To Supplier' WHEN 1 THEN 'From Buyer' END AS "Direction",
  rev.amount AS "Amount",
  rev.remarks AS "Remarks",
  orig.id AS "Original Payment ID",
  orig.date AS "Original Date",
  rev.created_at AS "Reversed At"
FROM payments rev
JOIN parties p ON p.id = rev.party_id
LEFT JOIN payments orig ON orig.id = rev.reversed_payment_id
WHERE rev.reversed = true
ORDER BY rev.created_at DESC;`,
      },
      {
        label: 'Grand Totals',
        description: 'Overall totals across all entry types',
        sql: `SELECT
  CASE je.entry_type
    WHEN 0 THEN 'Purchase' WHEN 1 THEN 'Sale'
    WHEN 2 THEN 'Payment Out' WHEN 3 THEN 'Payment In'
    WHEN 4 THEN 'Expense' WHEN 5 THEN 'Credit Received'
    WHEN 6 THEN 'Principal Return' WHEN 7 THEN 'Profit Share'
    WHEN 8 THEN 'Milling' WHEN 9 THEN 'Adjustment'
    WHEN 10 THEN 'REVERSAL'
  END AS "Entry Type",
  COUNT(*) AS "Count",
  SUM(je.total_amount) AS "Total Amount",
  MIN(je.date) AS "First Entry",
  MAX(je.date) AS "Last Entry"
FROM journal_entries je
GROUP BY je.entry_type
ORDER BY je.entry_type;`,
      },
    ],
  },
  {
    group: 'Quick Queries',
    queries: [
      { label: 'All Parties', description: 'List all parties', sql: `SELECT id, name,
  CASE party_type WHEN 0 THEN 'Supplier' WHEN 1 THEN 'Buyer' WHEN 2 THEN 'Both' END AS type,
  phone, village_city, opening_balance
FROM parties ORDER BY name;` },
      { label: 'Recent 50 Entries', description: 'Latest journal entries', sql: `SELECT entry_number, date, narration,
  CASE entry_type
    WHEN 0 THEN 'Purchase' WHEN 1 THEN 'Sale'
    WHEN 2 THEN 'Payment Out' WHEN 3 THEN 'Payment In'
    WHEN 4 THEN 'Expense' WHEN 10 THEN 'REVERSAL'
  END AS type,
  total_amount, source_type
FROM journal_entries
ORDER BY created_at DESC LIMIT 50;` },
    ],
  },
];

const SIDEBAR_WIDTH = 260;

// Helper: detect if a value looks numeric
function isNumeric(val: string | number | boolean | null): boolean {
  if (val === null || val === '' || typeof val === 'boolean') return false;
  return !isNaN(Number(val));
}

const QueryRunnerPageComp = () => {
  const isMobile = useIsMobile();
  const colors = useAppColors();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sql, setSql] = useState('SELECT * FROM parties LIMIT 20;');
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string>('Audit Journal');
  const [queryHistory, setQueryHistory] = useState<{ sql: string; rows: number; ms: number; time: Date }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load schema
  const loadSchema = useCallback(async () => {
    if (tables.length > 0) { setShowSchema(true); return; }
    setTablesLoading(true);
    setShowSchema(true);
    try {
      const data = await fetchTables();
      setTables(data);
    } catch { toast.error('Failed to load schema'); }
    finally { setTablesLoading(false); }
  }, [tables.length]);

  const runQuery = useCallback(async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await executeQuery(sql);
      setResult(data);
      setQueryHistory(prev => [{ sql: sql.trim().slice(0, 80), rows: data.row_count, ms: data.duration_ms, time: new Date() }, ...prev.slice(0, 19)]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Query failed';
      setError(msg);
    } finally { setLoading(false); }
  }, [sql]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
  }, [runQuery]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(300, Math.max(140, textareaRef.current.scrollHeight)) + 'px';
    }
  }, [sql]);

  const copyResults = useCallback(() => {
    if (!result) return;
    const header = result.columns.join('\t');
    const rows = result.rows.map(r => r.map(v => v === null ? 'NULL' : String(v)).join('\t')).join('\n');
    navigator.clipboard.writeText(`${header}\n${rows}`);
    toast.success('Copied to clipboard');
  }, [result]);

  const downloadCsv = useCallback(() => {
    if (!result) return;
    const esc = (v: string | number | boolean | null) => {
      if (v === null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = result.columns.map(esc).join(',');
    const rows = result.rows.map(r => r.map(esc).join(',')).join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  }, [result]);

  const selectQuery = (label: string, querySql: string) => {
    setSql(querySql);
    setActiveQuery(label);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = () => (
    <>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
          Saved Queries
        </Typography>
      </Box>

      {/* Query Groups */}
      <List dense disablePadding sx={{ flex: 1 }}>
        {QUERY_GROUPS.map((group) => (
          <Box key={group.group}>
            <ListItemButton
              onClick={() => setExpandedGroup(expandedGroup === group.group ? '' : group.group)}
              sx={{ py: 0.75, px: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: expandedGroup === group.group ? 'primary.main' : 'text.secondary' }}>
                {GROUP_ICONS[group.group] || <BoltIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={group.group}
                primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 600 }}
              />
              <Badge badgeContent={group.queries.length} color="default" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }} />
              {expandedGroup === group.group ? <ExpandLess sx={{ fontSize: 18, ml: 0.5 }} /> : <ExpandMore sx={{ fontSize: 18, ml: 0.5 }} />}
            </ListItemButton>
            <Collapse in={expandedGroup === group.group}>
              <List dense disablePadding>
                {group.queries.map((q) => (
                  <ListItemButton
                    key={q.label}
                    selected={activeQuery === q.label}
                    onClick={() => selectQuery(q.label, q.sql)}
                    sx={{
                      pl: 4.5, py: 0.5,
                      '&.Mui-selected': { bgcolor: (t) => alpha(t.palette.primary.main, 0.1), borderRight: '3px solid', borderColor: 'primary.main' },
                      '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
                    }}
                  >
                    <ListItemText
                      primary={q.label}
                      secondary={q.description}
                      primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: activeQuery === q.label ? 700 : 400 }}
                      secondaryTypographyProps={{ fontSize: '0.65rem', noWrap: true }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>

      {/* History */}
      {queryHistory.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              History
            </Typography>
          </Box>
          <List dense disablePadding sx={{ maxHeight: 150, overflowY: 'auto' }}>
            {queryHistory.map((h, i) => (
              <ListItemButton key={i} sx={{ py: 0.25, px: 2 }} onClick={() => { setSql(h.sql); if (isMobile) setSidebarOpen(false); }}>
                <ListItemText
                  primary={h.sql}
                  secondary={`${h.rows} rows \u00b7 ${h.ms}ms`}
                  primaryTypographyProps={{ fontSize: '0.7rem', fontFamily: 'monospace', noWrap: true }}
                  secondaryTypographyProps={{ fontSize: '0.6rem' }}
                />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', mx: { xs: 0, md: -3 }, mt: { xs: 0, md: -3 }, overflow: 'hidden' }}>

      {/* ─── Left Sidebar: Saved Queries (rendered as Drawer on mobile, inline on desktop) ─── */}
      {isMobile ? (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
        >
          {sidebarContent()}
        </Drawer>
      ) : (
        <Box sx={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: colors.qrSidebarBg,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {sidebarContent()}
        </Box>
      )}

      {/* ─── Main Area ─── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top Bar */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2, py: 1,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper',
        }}>
          {isMobile && (
            <IconButton size="small" onClick={() => setSidebarOpen(true)} sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <DataArrayIcon color="primary" />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Query Runner
          </Typography>
          <Tooltip title="Browse Database Schema">
            <Button
              size="small"
              variant={showSchema ? 'contained' : 'outlined'}
              startIcon={<StorageIcon />}
              onClick={() => showSchema ? setShowSchema(false) : loadSchema()}
              sx={{ textTransform: 'none' }}
            >
              Schema
            </Button>
          </Tooltip>
        </Box>

        {/* Editor + Schema split */}
        <Box sx={{ display: 'flex', flex: showSchema ? 'none' : undefined }}>
          {/* SQL Editor */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={sql}
                onChange={(e) => { setSql(e.target.value); setActiveQuery(null); }}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="Write your SQL query here... (Ctrl+Enter to run)"
                style={{
                  width: '100%',
                  minHeight: 140,
                  maxHeight: 300,
                  padding: '16px 16px 16px 16px',
                  fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace',
                  fontSize: '13px',
                  lineHeight: '1.7',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: colors.editorBg,
                  color: colors.editorText,
                  boxSizing: 'border-box',
                  letterSpacing: '0.3px',
                }}
              />
            </Box>

            {/* Action Bar */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 2, py: 1,
              borderTop: '1px solid', borderColor: 'divider',
              borderBottom: '1px solid',
              bgcolor: colors.qrActionBarBg,
            }}>
              <Button
                variant="contained"
                size="small"
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                onClick={runQuery}
                disabled={loading || !sql.trim()}
                sx={{
                  textTransform: 'none',
                  minWidth: 100,
                  bgcolor: colors.runBtnBg,
                  '&:hover': { bgcolor: colors.runBtnHover },
                }}
              >
                {loading ? 'Running...' : 'Run'}
              </Button>
              <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter
              </Typography>

              <Box sx={{ flexGrow: 1 }} />

              {/* Status Indicator */}
              {result && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" fontWeight="bold" color="success.main">
                      {result.row_count.toLocaleString()} row{result.row_count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimerIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {result.duration_ms}ms
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Tooltip title="Copy as TSV">
                    <IconButton size="small" onClick={copyResults}>
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download CSV">
                    <IconButton size="small" onClick={downloadCsv}>
                      <DownloadIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {error && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="caption" color="error.main" fontWeight="bold">Error</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Schema Panel (inline, right of editor) */}
          {showSchema && (
            <Box sx={{
              width: 300, minWidth: 300,
              borderLeft: '1px solid', borderColor: 'divider',
              overflowY: 'auto', maxHeight: 300,
              bgcolor: colors.qrSidebarBg,
            }}>
              <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Tables
                </Typography>
                <IconButton size="small" onClick={() => setShowSchema(false)} sx={{ fontSize: 14 }}>
                  <ExpandMore sx={{ fontSize: 16, transform: 'rotate(-90deg)' }} />
                </IconButton>
              </Box>
              {tablesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense disablePadding>
                  {tables.map((table) => (
                    <Box key={table.name}>
                      <ListItemButton
                        onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                        sx={{ py: 0.5, px: 1.5 }}
                      >
                        <TableChartIcon sx={{ fontSize: 14, mr: 1, color: 'primary.main' }} />
                        <ListItemText
                          primary={table.name}
                          primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
                          {table.columns.length}
                        </Typography>
                        {expandedTable === table.name ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
                      </ListItemButton>
                      <Collapse in={expandedTable === table.name}>
                        <List dense disablePadding>
                          {table.columns.map((col) => (
                            <ListItemButton
                              key={col.name}
                              sx={{ pl: 4, py: 0.15 }}
                              onClick={() => { setSql(prev => prev + col.name); textareaRef.current?.focus(); }}
                            >
                              {col.name === 'id' ? (
                                <KeyIcon sx={{ fontSize: 11, mr: 0.75, color: 'warning.main' }} />
                              ) : (
                                <Box sx={{ width: 11, mr: 0.75 }} />
                              )}
                              <ListItemText
                                primary={<>
                                  <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{col.name}</Typography>
                                  <Typography component="span" sx={{ fontSize: '0.6rem', color: 'text.disabled', ml: 0.75 }}>{col.type}</Typography>
                                </>}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Box>

        {/* ─── Results Area ─── */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: colors.qrResultsBg }}>
          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ m: 2, borderRadius: 1 }} variant="outlined">
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                {error}
              </Typography>
            </Alert>
          )}

          {/* Empty state */}
          {!result && !error && !loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4 }}>
              <DataArrayIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2">Select a query or write your own</Typography>
              <Typography variant="caption">Results will appear here</Typography>
            </Box>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">Running query...</Typography>
            </Box>
          )}

          {/* 0 rows */}
          {result && result.row_count === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 36, mb: 1, color: 'success.main' }} />
              <Typography variant="body2">Query executed successfully</Typography>
              <Typography variant="caption">0 rows returned</Typography>
            </Box>
          )}

          {/* Results Table */}
          {result && result.columns.length > 0 && result.row_count > 0 && (
            <TableContainer sx={{ maxHeight: '100%' }}>
              <Table stickyHeader size="small" sx={{ '& td, & th': { borderColor: colors.border } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{
                      fontWeight: 600, bgcolor: colors.qrHeaderBg, color: colors.textSecondary,
                      fontSize: '0.7rem', minWidth: 36, textAlign: 'center',
                      position: 'sticky', left: 0, zIndex: 3, borderRight: `1px solid ${colors.border}`,
                    }}>
                      #
                    </TableCell>
                    {result.columns.map((col) => (
                      <TableCell key={col} sx={{
                        fontWeight: 700, bgcolor: colors.qrHeaderBg,
                        fontSize: '0.75rem', whiteSpace: 'nowrap',
                        letterSpacing: '0.3px', py: 1,
                      }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.rows.map((row, i) => (
                    <TableRow key={i} hover sx={{
                      '&:nth-of-type(even)': { bgcolor: colors.qrEvenRowBg },
                      '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
                    }}>
                      <TableCell sx={{
                        color: colors.qrRowNumberColor, fontSize: '0.7rem', textAlign: 'center',
                        position: 'sticky', left: 0, bgcolor: 'inherit', zIndex: 1,
                        borderRight: `1px solid ${colors.border}`,
                      }}>
                        {i + 1}
                      </TableCell>
                      {row.map((cell, j) => {
                        const numeric = isNumeric(cell);
                        const isNull = cell === null;
                        const isStatus = String(cell) === 'OK' || String(cell) === 'MISMATCH';
                        const isMismatch = String(cell) === 'MISMATCH';
                        const isReversal = String(cell) === 'REVERSAL';
                        return (
                          <TableCell
                            key={j}
                            sx={{
                              whiteSpace: 'nowrap',
                              maxWidth: 350,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: (numeric || isNull) ? '"JetBrains Mono", monospace' : 'inherit',
                              fontSize: '0.8rem',
                              textAlign: numeric ? 'right' : 'left',
                              color: isNull ? colors.nullText : isMismatch ? colors.errorText : isReversal ? colors.errorText : (isStatus && !isMismatch) ? colors.successText : 'inherit',
                              fontStyle: isNull ? 'italic' : 'normal',
                              fontWeight: (isStatus || isReversal) ? 700 : numeric ? 500 : 400,
                              bgcolor: isMismatch ? colors.errorRowBg : isReversal ? colors.errorRowBg : 'inherit',
                              py: 0.75,
                            }}
                          >
                            {isNull ? 'NULL' : String(cell)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Status Bar */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          px: 2, py: 0.5,
          borderTop: '1px solid', borderColor: 'divider',
          bgcolor: colors.qrStatusBarBg,
          minHeight: 28,
        }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
            SELECT only
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {result && (
            <>
              <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                {result.columns.length} col{result.columns.length !== 1 ? 's' : ''} \u00d7 {result.row_count.toLocaleString()} row{result.row_count !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                {result.duration_ms}ms
              </Typography>
            </>
          )}
          {activeQuery && (
            <Typography variant="caption" color="primary" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 600 }}>
              {activeQuery}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default QueryRunnerPageComp;
