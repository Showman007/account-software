import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { importExcel, getExportUrl } from '../api/resources.ts';
import { useAuth } from '../context/AuthContext.tsx';

const EXPORT_TYPES = [
  { key: 'parties', label: 'Parties' },
  { key: 'inbound_entries', label: 'Inbound Entries (Purchases)' },
  { key: 'outbound_entries', label: 'Outbound Entries (Sales)' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'payments', label: 'Payments' },
  { key: 'milling_batches', label: 'Milling Batches' },
];

function ImportSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: Record<string, string> | string[];
  } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importExcel(file);
      setImportResult({ success: true, message: result.message, details: result.data });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; details?: string[] } } };
      setImportResult({
        success: false,
        message: error.response?.data?.error || 'Import failed',
        details: error.response?.data?.details,
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        <UploadFileIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Import from Excel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload an Excel file (.xlsx) to import data. The sheet names should match:
        parties, inbound, outbound, milling, expenses, payments, partners, credit_transactions, products, units.
      </Typography>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <Button
        variant="contained"
        startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
        onClick={() => fileRef.current?.click()}
        disabled={importing}
      >
        {importing ? 'Importing...' : 'Choose File & Import'}
      </Button>
      {importResult && (
        <Alert severity={importResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Typography fontWeight="bold">{importResult.message}</Typography>
          {importResult.details && !Array.isArray(importResult.details) && (
            <List dense>
              {Object.entries(importResult.details).map(([sheet, result]) => (
                <ListItem key={sheet} disableGutters>
                  <ListItemText primary={`${sheet}: ${result}`} />
                </ListItem>
              ))}
            </List>
          )}
          {importResult.details && Array.isArray(importResult.details) && (
            <List dense>
              {importResult.details.map((err, i) => (
                <ListItem key={i} disableGutters>
                  <ListItemText primary={err} />
                </ListItem>
              ))}
            </List>
          )}
        </Alert>
      )}
    </Paper>
  );
}

function ExportSection() {
  const handleExport = (type: string) => {
    const token = localStorage.getItem('token');
    const url = getExportUrl(type);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        <DownloadIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Export to Excel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Download any register as an Excel file.
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List>
        {EXPORT_TYPES.map((t) => (
          <ListItem
            key={t.key}
            disableGutters
            secondaryAction={
              <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport(t.key)}>
                Download
              </Button>
            }
          >
            <ListItemText primary={t.label} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default function ImportExportPage() {
  const { isAdmin } = useAuth();

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Import / Export Data
      </Typography>
      <Grid container spacing={3}>
        {isAdmin ? (
          <>
            <Grid size={{ xs: 12, md: 6 }}>
              <ImportSection />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ExportSection />
            </Grid>
          </>
        ) : (
          <Grid size={{ xs: 12 }}>
            <ExportSection />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
