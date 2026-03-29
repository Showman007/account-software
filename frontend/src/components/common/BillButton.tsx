import { useState } from 'react';
import { IconButton, CircularProgress, Tooltip } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { downloadBillPdf } from '../../api/resources.ts';
import type { BillType } from '../../api/resources.ts';

interface BillButtonProps {
  billType: BillType;
  recordId: number;
  tooltip?: string;
}

export default function BillButton({ billType, recordId, tooltip = 'Download Bill' }: BillButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const blob = await downloadBillPdf(billType, recordId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const prefix = billType === 'customer_invoice' ? 'Invoice' :
                     billType === 'credit_note' ? 'CreditNote' : 'Receipt';
      link.download = `${prefix}_${recordId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Error is handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton size="small" onClick={handleDownload} disabled={loading} color="primary">
        {loading ? <CircularProgress size={18} /> : <ReceiptLongIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
