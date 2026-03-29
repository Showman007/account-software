import { useState } from 'react';
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { Attachment } from '../../types/common.ts';
import type { AttachableType } from '../../api/resources.ts';
import { downloadAttachment } from '../../api/resources.ts';

interface AttachmentChipProps {
  attachment: Attachment;
  attachableType: AttachableType;
  recordId: number;
}

export default function AttachmentChip({ attachment, attachableType, recordId }: AttachmentChipProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isImage = attachment.file_type.startsWith('image/');

  const handleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewOpen(true);
    setLoading(true);
    try {
      const blob = await downloadAttachment(attachableType, recordId);
      const url = window.URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch {
      // Error handled
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewOpen(false);
    if (blobUrl) {
      window.URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Chip
        icon={<AttachFileIcon />}
        label=""
        size="small"
        color="primary"
        variant="outlined"
        clickable
        onClick={handleOpen}
      />

      <Dialog
        open={previewOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" noWrap sx={{ maxWidth: { xs: '60vw', sm: 400 } }}>
                {attachment.file_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isImage ? 'Image' : 'PDF'} &bull; {(attachment.file_size / 1024).toFixed(1)} KB
              </Typography>
            </Box>
            <IconButton edge="end" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="text.secondary">Loading file...</Typography>
            </Box>
          ) : blobUrl ? (
            isImage ? (
              <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                <img
                  src={blobUrl}
                  alt={attachment.file_name}
                  style={{ maxWidth: '100%', maxHeight: isMobile ? '70vh' : 500, objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <iframe
                src={blobUrl}
                width="100%"
                height={isMobile ? '100%' : '500'}
                style={{ border: 'none', minHeight: isMobile ? '70vh' : 500 }}
                title={attachment.file_name}
              />
            )
          ) : (
            <Typography color="text.secondary" sx={{ p: 4 }}>
              Failed to load file. Try again.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!blobUrl}
          >
            Download
          </Button>
          <Button
            startIcon={<OpenInNewIcon />}
            href={attachment.drive_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Drive
          </Button>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
