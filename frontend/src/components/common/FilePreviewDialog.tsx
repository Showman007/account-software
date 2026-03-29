import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import type { Attachment } from '../../types/common.ts';

interface FilePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  attachment: Attachment;
}

export default function FilePreviewDialog({ open, onClose, attachment }: FilePreviewDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isImage = attachment.file_type.startsWith('image/');
  const isPdf = attachment.file_type === 'application/pdf';

  // Use Google Drive preview URL
  const previewUrl = `https://drive.google.com/file/d/${attachment.drive_file_id}/preview`;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${attachment.drive_file_id}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
            {attachment.file_name}
          </Typography>
          <IconButton edge="end" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {isImage ? 'Image' : 'PDF'} &bull; {(attachment.file_size / 1024).toFixed(1)} KB
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        {isPdf ? (
          <iframe
            src={previewUrl}
            width="100%"
            height="500"
            style={{ border: 'none' }}
            title={attachment.file_name}
          />
        ) : isImage ? (
          <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
            <img
              src={`https://drive.google.com/uc?id=${attachment.drive_file_id}`}
              alt={attachment.file_name}
              style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }}
            />
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ p: 4 }}>
            Preview not available for this file type.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<DownloadIcon />}
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
