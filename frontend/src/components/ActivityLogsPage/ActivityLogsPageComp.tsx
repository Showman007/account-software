import { useState, useMemo, useCallback, Fragment } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Grid,
  Avatar,
  Pagination,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ComputerIcon from '@mui/icons-material/Computer';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RTooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  fetchActivityLogs,
  fetchActivitySummary,
  usersApi,
} from '../../api/resources.ts';
import type { ActivityLog, ActivitySummary } from '../../api/resources.ts';
import { useAppColors } from '../../context/ThemeContext.tsx';
import type { QueryParams } from '../../types/common.ts';

// ─── Action display config ──────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  create:         { label: 'Created',        color: '#2e7d32', bgColor: '#e8f5e9', icon: <AddCircleIcon fontSize="small" /> },
  update:         { label: 'Updated',        color: '#1565c0', bgColor: '#e3f2fd', icon: <EditIcon fontSize="small" /> },
  destroy:        { label: 'Deleted',        color: '#c62828', bgColor: '#ffebee', icon: <DeleteIcon fontSize="small" /> },
  reverse:        { label: 'Reversed',       color: '#e65100', bgColor: '#fff3e0', icon: <UndoIcon fontSize="small" /> },
  confirm:        { label: 'Confirmed',      color: '#2e7d32', bgColor: '#e8f5e9', icon: <CheckCircleIcon fontSize="small" /> },
  cancel:         { label: 'Cancelled',      color: '#c62828', bgColor: '#ffebee', icon: <CancelIcon fontSize="small" /> },
  close:          { label: 'Closed',         color: '#546e7a', bgColor: '#eceff1', icon: <LockIcon fontSize="small" /> },
  duplicate:      { label: 'Duplicated',     color: '#6a1b9a', bgColor: '#f3e5f5', icon: <ContentCopyIcon fontSize="small" /> },
  mark_in_transit:{ label: 'In Transit',     color: '#00838f', bgColor: '#e0f7fa', icon: <LocalShippingIcon fontSize="small" /> },
  mark_delivered: { label: 'Delivered',      color: '#2e7d32', bgColor: '#e8f5e9', icon: <LocalShippingIcon fontSize="small" /> },
  sign_in:        { label: 'Signed In',      color: '#1565c0', bgColor: '#e3f2fd', icon: <LoginIcon fontSize="small" /> },
  google_sign_in: { label: 'Google Sign In', color: '#1565c0', bgColor: '#e3f2fd', icon: <LoginIcon fontSize="small" /> },
  sign_out:       { label: 'Signed Out',     color: '#546e7a', bgColor: '#eceff1', icon: <LogoutIcon fontSize="small" /> },
  view:           { label: 'Viewed',         color: '#78909c', bgColor: '#f5f5f5', icon: <VisibilityIcon fontSize="small" /> },
  list:           { label: 'Browsed',        color: '#78909c', bgColor: '#f5f5f5', icon: <FormatListBulletedIcon fontSize="small" /> },
  export:         { label: 'Exported',       color: '#e65100', bgColor: '#fff3e0', icon: <FileDownloadIcon fontSize="small" /> },
};

const RESOURCE_LABELS: Record<string, string> = {
  OutboundEntry: 'Outbound', InboundEntry: 'Inbound', Payment: 'Payment',
  Order: 'Order', Delivery: 'Delivery', Expense: 'Expense',
  MillingBatch: 'Milling', Party: 'Party', Product: 'Product',
  User: 'User', StockItem: 'Stock', Dashboard: 'Dashboard',
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}

// Build a human-readable sentence from a log entry
function buildSentence(log: ActivityLog): React.ReactNode {
  const cfg = ACTION_CONFIG[log.action];
  const actionLabel = cfg?.label?.toLowerCase() || log.action;
  const resource = RESOURCE_LABELS[log.resource_type] || log.resource_type || '';

  // For sign in/out, just use the label
  if (['sign_in', 'google_sign_in', 'sign_out'].includes(log.action)) {
    return <>{cfg?.label || log.action}</>;
  }

  // For list/view
  if (log.action === 'list') return <>Browsed <strong>{resource}</strong> list</>;
  if (log.action === 'view') return <>Viewed <strong>{resource} #{log.resource_id}</strong></>;
  if (log.action === 'export') {
    const exportType = log.metadata?.export_type as string;
    return <>Exported <strong>{exportType || resource}</strong> data</>;
  }

  // For CRUD and custom actions
  if (log.resource_label) {
    return <>{actionLabel} <strong>{log.resource_label}</strong></>;
  }
  return <>{actionLabel} <strong>{resource} #{log.resource_id}</strong></>;
}

// ─── Chart Colors ───────────────────────────────────────────

const PIE_COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#c62828', '#7b1fa2', '#00838f', '#5d4037', '#ad1457'];
const USER_COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#c62828', '#7b1fa2', '#00838f', '#5d4037', '#ad1457', '#0097a7', '#e91e63'];
const ACTION_COLORS: Record<string, string> = {
  create: '#2e7d32', update: '#1565c0', destroy: '#c62828', reverse: '#e65100',
  confirm: '#2e7d32', cancel: '#c62828', close: '#546e7a', duplicate: '#6a1b9a',
  sign_in: '#1976d2', google_sign_in: '#1976d2', sign_out: '#78909c',
  view: '#b0bec5', list: '#b0bec5', export: '#f57c00',
  mark_in_transit: '#00838f', mark_delivered: '#2e7d32',
};

// ─── Summary & Charts Section ───────────────────────────────

function AnalyticsDashboard({ summary }: { summary: ActivitySummary }) {
  const colors = useAppColors();
  const topUsers = Object.entries(summary.most_active_users).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxCount = topUsers.length > 0 ? topUsers[0][1] : 1;

  // Daily activity chart data — stacked per user
  const allUsers = useMemo(() => Object.keys(summary.user_daily_activity || {}), [summary.user_daily_activity]);

  const dailyData = useMemo(() => {
    const dates = Object.keys(summary.daily_activity).sort();
    return dates.map((date) => {
      const row: Record<string, string | number> = {
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      };
      allUsers.forEach((email) => {
        const shortName = email.split('@')[0];
        row[shortName] = summary.user_daily_activity?.[email]?.[date] || 0;
      });
      return row;
    });
  }, [summary.daily_activity, summary.user_daily_activity, allUsers]);

  // Hourly heatmap data
  const hourlyData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count: summary.hourly_activity[i.toString()] || 0,
    })),
    [summary.hourly_activity]
  );
  const maxHourly = Math.max(...hourlyData.map(h => h.count), 1);

  // Action breakdown for pie
  const actionPieData = useMemo(() =>
    Object.entries(summary.actions_by_type)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([action, count]) => ({
        name: ACTION_CONFIG[action]?.label || action,
        value: count,
        color: ACTION_COLORS[action] || '#757575',
      })),
    [summary.actions_by_type]
  );

  // Resource breakdown for pie
  const resourcePieData = useMemo(() =>
    Object.entries(summary.actions_by_resource)
      .filter(([k, v]) => k && v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count], i) => ({
        name: RESOURCE_LABELS[type] || type,
        value: count,
        color: PIE_COLORS[i % PIE_COLORS.length],
      })),
    [summary.actions_by_resource]
  );

  // User write actions (stacked bar data)
  const userWriteData = useMemo(() =>
    Object.entries(summary.write_actions_by_user)
      .map(([email, actions]) => ({
        user: email.split('@')[0],
        create: actions.create || 0,
        update: actions.update || 0,
        destroy: actions.destroy || 0,
      }))
      .sort((a, b) => (b.create + b.update + b.destroy) - (a.create + a.update + a.destroy))
      .slice(0, 8),
    [summary.write_actions_by_user]
  );

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Stat cards */}
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: colors.surface, borderLeft: '4px solid #1976d2' }}>
          <Typography variant="h4" fontWeight="bold" color="primary">{summary.total_actions}</Typography>
          <Typography variant="caption" color="text.secondary">Total (7 days)</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: colors.surface, borderLeft: '4px solid #2e7d32' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#2e7d32' }}>
            {(summary.actions_by_type['create'] || 0) + (summary.actions_by_type['update'] || 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">Creates + Updates</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: colors.surface, borderLeft: '4px solid #f57c00' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#f57c00' }}>
            {(summary.actions_by_type['sign_in'] || 0) + (summary.actions_by_type['google_sign_in'] || 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">Sign Ins</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: colors.surface, borderLeft: '4px solid #c62828' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#c62828' }}>
            {(summary.actions_by_type['destroy'] || 0) + (summary.actions_by_type['reverse'] || 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">Deletes + Reversals</Typography>
        </Paper>
      </Grid>

      {/* Row 2: Daily Activity + Hourly Heatmap */}
      {dailyData.length > 0 && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, backgroundColor: colors.surface, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Daily Activity</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <RTooltip />
                {allUsers.map((email, i) => (
                  <Bar
                    key={email}
                    dataKey={email.split('@')[0]}
                    name={email.split('@')[0]}
                    stackId="users"
                    fill={USER_COLORS[i % USER_COLORS.length]}
                    maxBarSize={60}
                    radius={i === allUsers.length - 1 ? [4, 4, 0, 0] : undefined}
                  />
                ))}
                {allUsers.length > 1 && <Legend iconSize={10} />}
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      )}

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 2, backgroundColor: colors.surface, height: '100%' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Activity by Hour</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.5 }}>
            {hourlyData.map((h) => {
              const intensity = h.count / maxHourly;
              return (
                <Tooltip key={h.hour} title={`${h.hour} — ${h.count} actions`} arrow>
                  <Box sx={{
                    aspectRatio: '1', borderRadius: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: h.count === 0
                      ? 'action.hover'
                      : `rgba(25, 118, 210, ${0.15 + intensity * 0.85})`,
                    color: intensity > 0.5 ? '#fff' : 'text.secondary',
                    fontSize: '0.65rem', fontWeight: 600,
                    cursor: 'default',
                  }}>
                    {h.hour.slice(0, 2)}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Less</Typography>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <Box key={v} sx={{ width: 14, height: 14, borderRadius: 0.5, backgroundColor: v === 0 ? 'action.hover' : `rgba(25, 118, 210, ${0.15 + v * 0.85})` }} />
            ))}
            <Typography variant="caption" color="text.secondary">More</Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Row 3: Action Types (horizontal bar) + Resource Breakdown (horizontal bar) */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 2, backgroundColor: colors.surface, height: '100%' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Action Types</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {actionPieData.map((item) => {
              const pct = summary.total_actions > 0 ? (item.value / summary.total_actions) * 100 : 0;
              return (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" noWrap sx={{ width: 80, flexShrink: 0, fontSize: '0.75rem' }}>{item.name}</Typography>
                  <Box sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: item.color, transition: 'width 0.3s' }} />
                  </Box>
                  <Typography variant="caption" fontWeight="bold" sx={{ width: 30, textAlign: 'right', fontSize: '0.75rem' }}>{item.value}</Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 2, backgroundColor: colors.surface, height: '100%' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Most Used Modules</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {resourcePieData.slice(0, 8).map((item) => {
              const total = resourcePieData.reduce((s, r) => s + r.value, 0);
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" noWrap sx={{ width: 80, flexShrink: 0, fontSize: '0.75rem' }}>{item.name}</Typography>
                  <Box sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: item.color, transition: 'width 0.3s' }} />
                  </Box>
                  <Typography variant="caption" fontWeight="bold" sx={{ width: 30, textAlign: 'right', fontSize: '0.75rem' }}>{item.value}</Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Grid>

      {/* Row 4: User Write Actions + Overall User Activity */}
      {userWriteData.length > 0 && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, backgroundColor: colors.surface, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Data Changes by User</Typography>
            <ResponsiveContainer width="100%" height={Math.max(userWriteData.length * 36, 100)}>
              <BarChart data={userWriteData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="user" fontSize={11} width={80} />
                <RTooltip />
                <Bar dataKey="create" name="Created" stackId="a" fill="#2e7d32" radius={[0, 4, 4, 0]} />
                <Bar dataKey="update" name="Updated" stackId="a" fill="#1565c0" />
                <Bar dataKey="destroy" name="Deleted" stackId="a" fill="#c62828" radius={[0, 4, 4, 0]} />
                <Legend iconSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      )}

      {topUsers.length > 0 && (
        <Grid size={{ xs: 12, md: userWriteData.length > 0 ? 6 : 12 }}>
          <Paper sx={{ p: 2, backgroundColor: colors.surface, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Overall User Activity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {topUsers.map(([email, count]) => (
                <Box key={email} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#1976d2' }}>
                    {email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" noWrap sx={{ width: 120, flexShrink: 0, fontSize: '0.8rem' }}>{email.split('@')[0]}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(count / maxCount) * 100}
                    sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'action.hover',
                      '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: '#1976d2' }
                    }}
                  />
                  <Typography variant="body2" fontWeight="bold" sx={{ width: 36, textAlign: 'right' }}>{count}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}

// ─── Activity Feed Item ─────────────────────────────────────

function ActivityItem({ log }: { log: ActivityLog }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: '#757575', bgColor: '#f5f5f5', icon: <HistoryIcon fontSize="small" /> };
  const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1.5, px: 2, '&:hover': { backgroundColor: 'action.hover' }, borderRadius: 1, transition: 'background 0.15s' }}>
      {/* Avatar */}
      <Avatar sx={{ width: 36, height: 36, bgcolor: cfg.bgColor, color: cfg.color, fontSize: '0.85rem', flexShrink: 0, mt: 0.25 }}>
        {cfg.icon}
      </Avatar>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Main line */}
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          <Typography component="span" variant="body2" fontWeight={600}>{log.user_email}</Typography>
          {' '}
          {buildSentence(log)}
        </Typography>

        {/* Meta row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">{formatTimeAgo(log.created_at)}</Typography>
          </Box>
          {log.resource_type && (
            <Chip
              label={RESOURCE_LABELS[log.resource_type] || log.resource_type}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
          {log.ip_address && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ComputerIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">{log.ip_address}</Typography>
            </Box>
          )}
          {hasMeta && (
            <Chip
              label={expanded ? 'Hide details' : 'Details'}
              size="small"
              variant="outlined"
              clickable
              icon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setExpanded(!expanded)}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Expandable metadata */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, backgroundColor: 'action.hover', fontSize: '0.8rem' }}>
            {/* Changes */}
            {log.metadata?.changes && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>Fields Changed</Typography>
                {Object.entries(log.metadata.changes as Record<string, { from: unknown; to: unknown }>).map(([field, vals]) => (
                  <Box key={field} sx={{ display: 'flex', gap: 1, mb: 0.25, pl: 1 }}>
                    <Typography variant="caption" fontWeight={500} sx={{ minWidth: 100 }}>{field}:</Typography>
                    <Typography variant="caption" sx={{ color: 'error.main', textDecoration: 'line-through' }}>{String(vals.from ?? '-')}</Typography>
                    <Typography variant="caption" color="text.secondary">{'->'}</Typography>
                    <Typography variant="caption" sx={{ color: 'success.main' }}>{String(vals.to ?? '-')}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            {/* Created fields */}
            {log.metadata?.created_fields && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>Fields Set</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 1 }}>
                  {(log.metadata.created_fields as string[]).map((f) => (
                    <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                  ))}
                </Box>
              </Box>
            )}
            {/* Other metadata */}
            {Object.entries(log.metadata)
              .filter(([k]) => !['changes', 'created_fields'].includes(k))
              .map(([k, v]) => (
                <Typography key={k} variant="caption" display="block" sx={{ pl: 1 }}>
                  <strong>{k}:</strong> {String(v)}
                </Typography>
              ))}
          </Box>
        </Collapse>
      </Box>

      {/* Time on right */}
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: 'nowrap', mt: 0.25 }}>
        {formatTime(log.created_at)}
      </Typography>
    </Box>
  );
}

// ─── Main Component ─────────────────────────────────────────

const ActivityLogsPageComp = () => {
  const colors = useAppColors();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [params, setParams] = useState<QueryParams>({ page: 1, per_page: 30 });
  const [search, setSearch] = useState('');

  // Always fetch overall summary to get the list of users
  const { data: overallSummary } = useQuery({
    queryKey: ['activity_summary_overall'],
    queryFn: () => fetchActivitySummary(7),
  });

  // Fetch filtered summary (per user or overall)
  const { data: summaryData } = useQuery({
    queryKey: ['activity_summary', selectedUser],
    queryFn: () => fetchActivitySummary(7, selectedUser || undefined),
  });

  // Fetch all users for the dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users_list'],
    queryFn: () => usersApi.getAll({ per_page: 100 }),
  });

  // Build user list: all registered users, sorted with most active first
  const userList = useMemo(() => {
    const allEmails = new Set<string>();
    // Add from users API
    (usersData?.data ?? []).forEach((u) => allEmails.add(u.email));
    // Add from summary (in case)
    if (overallSummary?.data?.most_active_users) {
      Object.keys(overallSummary.data.most_active_users).forEach((e) => allEmails.add(e));
    }
    // Sort: most active first
    const activityCounts = overallSummary?.data?.most_active_users ?? {};
    return Array.from(allEmails).sort((a, b) => (activityCounts[b] || 0) - (activityCounts[a] || 0));
  }, [usersData, overallSummary]);

  // Sync user filter to feed params
  const effectiveParams = useMemo(() => ({
    ...params,
    ...(selectedUser ? { user_email: selectedUser } : {}),
  }), [params, selectedUser]);

  const { data, isLoading } = useQuery({
    queryKey: ['activity_logs', effectiveParams],
    queryFn: () => fetchActivityLogs(effectiveParams),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const summary = summaryData?.data;

  const updateParams = useCallback((p: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...p }));
  }, []);

  const handleUserChange = useCallback((email: string) => {
    setSelectedUser(email);
    setParams((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { label: string; logs: ActivityLog[] }[] = [];
    let currentLabel = '';
    rows.forEach((log) => {
      const label = getDateLabel(log.created_at);
      if (label !== currentLabel) {
        groups.push({ label, logs: [log] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].logs.push(log);
      }
    });
    return groups;
  }, [rows]);

  const actionOptions = useMemo(() =>
    Object.entries(ACTION_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
    []
  );

  const resourceOptions = useMemo(() =>
    Object.entries(RESOURCE_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            Activity Logs
          </Typography>
          {meta && (
            <Chip label={`${meta.total_count} total`} size="small" variant="outlined" sx={{ ml: 1 }} />
          )}
        </Box>

        {/* User selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>View User</InputLabel>
            <Select
              value={selectedUser}
              label="View User"
              onChange={(e) => handleUserChange(e.target.value)}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  <em>All Users</em>
                </Box>
              </MenuItem>
              {userList.map((email) => {
                const count = overallSummary?.data?.most_active_users?.[email];
                return (
                  <MenuItem key={email} value={email}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{email}</span>
                      {count != null && (
                        <Chip label={count} size="small" variant="outlined" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {selectedUser && (
            <Chip
              label="Clear"
              size="small"
              variant="outlined"
              color="error"
              onDelete={() => handleUserChange('')}
            />
          )}
        </Box>
      </Box>

      {/* Selected user banner */}
      {selectedUser && (
        <Paper sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
            {selectedUser.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{selectedUser}</Typography>
            <Typography variant="caption" color="text.secondary">
              Showing activity for this user only
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Summary */}
      {summary && <AnalyticsDashboard summary={summary} />}

      {/* Filters row */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && updateParams({ q: search, page: 1 })}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            },
          }}
          sx={{ width: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={params.action_type ?? ''}
            label="Action"
            onChange={(e) => updateParams({ action_type: e.target.value || undefined, page: 1 })}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {actionOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Resource</InputLabel>
          <Select
            value={params.resource_type ?? ''}
            label="Resource"
            onChange={(e) => updateParams({ resource_type: e.target.value || undefined, page: 1 })}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {resourceOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small" type="date" label="From"
          slotProps={{ inputLabel: { shrink: true } }}
          value={params.from_date || ''}
          onChange={(e) => updateParams({ from_date: e.target.value || undefined, page: 1 })}
          sx={{ width: 150 }}
        />
        <TextField
          size="small" type="date" label="To"
          slotProps={{ inputLabel: { shrink: true } }}
          value={params.to_date || ''}
          onChange={(e) => updateParams({ to_date: e.target.value || undefined, page: 1 })}
          sx={{ width: 150 }}
        />
      </Paper>

      {/* Activity Feed */}
      <Paper variant="outlined" sx={{ backgroundColor: colors.surface }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No activity found</Typography>
          </Box>
        ) : (
          groupedLogs.map((group, gi) => (
            <Fragment key={group.label}>
              {/* Date header */}
              <Box sx={{ px: 2, py: 1, backgroundColor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', ...(gi > 0 ? { borderTop: '1px solid', borderTopColor: 'divider' } : {}) }}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" fontSize="0.8rem">
                  {group.label}
                </Typography>
              </Box>
              {/* Log items */}
              {group.logs.map((log, li) => (
                <Fragment key={log.id}>
                  <ActivityItem log={log} />
                  {li < group.logs.length - 1 && <Divider sx={{ ml: 7 }} />}
                </Fragment>
              ))}
            </Fragment>
          ))
        )}

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination
              count={meta.total_pages}
              page={params.page ?? 1}
              onChange={(_, p) => updateParams({ page: p })}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ActivityLogsPageComp;
