import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { toast } from 'react-toastify';
import { getExportUrl } from '../../api/resources.ts';
import { useIsMobile } from '../../hooks/useIsMobile.ts';

interface ExportButtonProps {
  exportType: string;
  params?: Record<string, unknown>;
}

export default function ExportButton({ exportType, params }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  const handleExport = async () => {
    setLoading(true);
    try {
      // Build clean params — remove pagination keys, keep only filter keys
      const filterParams: Record<string, string> = {};
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (['page', 'per_page'].includes(key)) continue;
          if (value !== undefined && value !== null && value !== '') {
            filterParams[key] = String(value);
          }
        }
      }

      const url = getExportUrl(exportType, filterParams);
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${exportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      size={isMobile ? 'small' : 'medium'}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
      onClick={handleExport}
      disabled={loading}
    >
      {isMobile ? 'Export' : 'Export Excel'}
    </Button>
  );
}
