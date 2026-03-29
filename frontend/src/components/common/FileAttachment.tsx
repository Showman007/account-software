import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadAttachment, deleteAttachment } from '../../api/resources.ts';
import type { AttachableType } from '../../api/resources.ts';
import type { Attachment } from '../../types/common.ts';
import FilePreviewDialog from './FilePreviewDialog.tsx';

interface FileAttachmentProps {
  attachableType: AttachableType;
  recordId: number;
  attachment: Attachment | null;
  queryKey: string;
  /** If provided, file is staged locally (for use during create flow) */
  onFileSelect?: (file: File | null) => void;
  stagedFile?: File | null;
  /** If true, shows only the file input (no upload/delete mutations) */
  stageOnly?: boolean;
}

const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function FileAttachment({
  attachableType,
  recordId,
  attachment,
  queryKey,
  onFileSelect,
  stagedFile,
  stageOnly = false,
}: FileAttachmentProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(attachableType, recordId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setError(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Upload failed. Please try again.';
      setError(message);
    },
  });

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

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF, JPG, and PNG files are allowed.';
    if (file.size > MAX_SIZE) return 'File size must be less than 1 MB.';
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (stageOnly && onFileSelect) {
      onFileSelect(file);
    } else {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = () => {
    if (stageOnly && onFileSelect) {
      onFileSelect(null);
      return;
    }
    if (window.confirm('Remove this attachment from Google Drive?')) {
      deleteMutation.mutate();
    }
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;
  const hasAttachment = attachment !== null;
  const hasStagedFile = stagedFile !== null && stagedFile !== undefined;

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

      {/* Show existing uploaded attachment */}
      {hasAttachment && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <InsertDriveFileIcon color="primary" />
          <Chip
            label={attachment.file_name}
            size="small"
            icon={<VisibilityIcon />}
            clickable
            onClick={() => setPreviewOpen(true)}
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

      {/* Show staged file (during create flow) */}
      {!hasAttachment && hasStagedFile && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'success.main', borderRadius: 1, bgcolor: 'success.50' }}>
          <InsertDriveFileIcon color="success" />
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {stagedFile.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(stagedFile.size / 1024).toFixed(0)} KB
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={handleDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Show upload button when no file */}
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
            startIcon={uploadMutation.isPending ? <CircularProgress size={18} /> : <CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            size="small"
            fullWidth
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            PDF, JPG, or PNG (max 1 MB)
          </Typography>
        </Box>
      )}

      {/* Preview dialog */}
      {hasAttachment && (
        <FilePreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          attachment={attachment}
        />
      )}
    </Box>
  );
}
