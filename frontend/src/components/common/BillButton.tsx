import { useState } from 'react';
import {
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import { downloadBillPdf } from '../../api/resources.ts';
import type { BillType } from '../../api/resources.ts';

interface BillButtonProps {
  billType: BillType;
  recordId: number;
  tooltip?: string;
}

const BILL_TITLES: Record<BillType, string> = {
  customer_invoice: 'Customer Invoice',
  credit_note: 'Credit Note',
  payment_receipt: 'Payment Receipt',
};

export default function BillButton({ billType, recordId, tooltip = 'View Bill' }: BillButtonProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const prefix = billType === 'customer_invoice' ? 'Invoice' :
                 billType === 'credit_note' ? 'CreditNote' : 'Receipt';
  const fileName = `${prefix}_${recordId}.pdf`;

  const handleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewOpen(true);
    setLoading(true);
    try {
      const blob = await downloadBillPdf(billType, recordId);
      const url = window.URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewOpen(false);
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fetch fresh and download
      setDownloading(true);
      downloadBillPdf(billType, recordId).then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }).finally(() => setDownloading(false));
    }
  };

  const handleShare = async () => {
    try {
      const blob = pdfBlobUrl
        ? await fetch(pdfBlobUrl).then(r => r.blob())
        : await downloadBillPdf(billType, recordId);

      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${BILL_TITLES[billType]} #${recordId}`,
          files: [file],
        });
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch {
      // User cancelled or error
    }
  };

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton size="small" onClick={handleOpen} color="primary">
          <ReceiptLongIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={previewOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {BILL_TITLES[billType]} #{recordId}
            </Typography>
            <IconButton edge="end" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, minHeight: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="text.secondary">Generating bill...</Typography>
            </Box>
          ) : pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              width="100%"
              height="550"
              style={{ border: 'none', display: 'block' }}
              title={`${BILL_TITLES[billType]} #${recordId}`}
            />
          ) : (
            <Typography color="text.secondary" sx={{ p: 4 }}>
              Failed to load bill. Try again.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            startIcon={<ShareIcon />}
            onClick={handleShare}
          >
            Share
          </Button>
          <Button
            startIcon={downloading ? <CircularProgress size={18} /> : <DownloadIcon />}
            onClick={handleDownload}
            disabled={downloading || !pdfBlobUrl}
            variant="contained"
          >
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
