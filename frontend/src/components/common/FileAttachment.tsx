import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAttachment, downloadAttachment } from '../../api/resources.ts';
import type { AttachableType } from '../../api/resources.ts';
import type { Attachment } from '../../types/common.ts';

interface FileAttachmentProps {
  attachableType: AttachableType;
  recordId: number;
  attachment: Attachment | null;
  queryKey: string;
  onFileSelect?: (file: File | null) => void;
  stagedFile?: File | null;
}

const MAX_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function FileAttachment({
  attachableType,
  recordId,
  attachment,
  queryKey,
  onFileSelect,
  stagedFile,
}: FileAttachmentProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const deleteMutation = useMutation({
    mutationFn: () => deleteAttachment(attachableType, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setError(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Delete failed. Please try again.';
      setError(message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File size must be less than 1 MB.');
      return;
    }

    // Always stage — upload happens on save
    onFileSelect?.(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = () => {
    // If there's a staged file, just clear it
    if (hasStagedFile) {
      onFileSelect?.(null);
      return;
    }
    // If there's an existing attachment on Drive, confirm and delete
    if (hasAttachment) {
      if (window.confirm('Remove this attachment from Google Drive?')) {
        deleteMutation.mutate();
      }
    }
  };

  // Preview existing attachment from Drive
  const handlePreviewExisting = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const blob = await downloadAttachment(attachableType, recordId);
      const url = window.URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch {
      // Error handled
    } finally {
      setPreviewLoading(false);
    }
  };

  // Preview staged file locally (no network call)
  const handlePreviewStaged = () => {
    if (!stagedFile) return;
    const url = window.URL.createObjectURL(stagedFile);
    setBlobUrl(url);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    if (blobUrl) {
      window.URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const name = stagedFile?.name || attachment?.file_name || 'file';
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = deleteMutation.isPending;
  const hasAttachment = attachment !== null;
  const hasStagedFile = stagedFile !== null && stagedFile !== undefined;
  const isImageAttachment = attachment?.file_type.startsWith('image/');
  const isImageStaged = stagedFile?.type.startsWith('image/');

  // Determine what to show in preview
  const previewIsImage = hasStagedFile ? isImageStaged : isImageAttachment;
  const previewFileName = hasStagedFile ? stagedFile.name : attachment?.file_name || '';
  const previewFileSize = hasStagedFile ? stagedFile.size : (attachment?.file_size || 0);

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Attachment (optional)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Staged file (selected but not uploaded yet) */}
      {hasStagedFile && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'success.main', borderRadius: 1 }}>
          <InsertDriveFileIcon color="success" />
          <Chip
            label={stagedFile.name}
            size="small"
            icon={<VisibilityIcon />}
            clickable
            onClick={handlePreviewStaged}
            color="success"
            variant="outlined"
            sx={{ maxWidth: 220 }}
          />
          <Typography variant="caption" color="text.secondary">
            {(stagedFile.size / 1024).toFixed(0)} KB
          </Typography>
          <Typography variant="caption" color="success.main" fontWeight="bold">
            Ready
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={handleDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Existing attachment from Drive (and no staged replacement) */}
      {hasAttachment && !hasStagedFile && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <InsertDriveFileIcon color="primary" />
          <Chip
            label={attachment.file_name}
            size="small"
            icon={<VisibilityIcon />}
            clickable
            onClick={handlePreviewExisting}
            sx={{ maxWidth: 220 }}
          />
          <Typography variant="caption" color="text.secondary">
            {(attachment.file_size / 1024).toFixed(0)} KB
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={handleDelete} disabled={isLoading} color="error">
            {deleteMutation.isPending ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
          </IconButton>
        </Box>
      )}

      {/* Upload button — show when no file staged and no existing attachment */}
      {!hasAttachment && !hasStagedFile && (
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            size="small"
            fullWidth
          >
            Select File
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            PDF, JPG, or PNG (max 1 MB) &bull; Uploads on save
          </Typography>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" noWrap sx={{ maxWidth: { xs: '60vw', sm: 400 } }}>
                {previewFileName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {previewIsImage ? 'Image' : 'PDF'} &bull; {(previewFileSize / 1024).toFixed(1)} KB
                {hasStagedFile && (
                  <Typography component="span" variant="caption" color="success.main" fontWeight="bold"> &bull; Not uploaded yet</Typography>
                )}
              </Typography>
            </Box>
            <IconButton edge="end" onClick={handleClosePreview}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          {previewLoading ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="text.secondary">Loading file...</Typography>
            </Box>
          ) : blobUrl ? (
            previewIsImage ? (
              <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                <img
                  src={blobUrl}
                  alt={previewFileName}
                  style={{ maxWidth: '100%', maxHeight: isMobile ? '70vh' : 500, objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <iframe
                src={blobUrl}
                width="100%"
                height={isMobile ? '100%' : '500'}
                style={{ border: 'none', minHeight: isMobile ? '70vh' : 500 }}
                title={previewFileName}
              />
            )
          ) : (
            <Typography color="text.secondary" sx={{ p: 4 }}>Failed to load file.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<DownloadIcon />} onClick={handleDownload} disabled={!blobUrl}>
            Download
          </Button>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
