import { useState } from 'react';
import { Chip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import type { Attachment } from '../../types/common.ts';
import FilePreviewDialog from './FilePreviewDialog.tsx';

interface AttachmentChipProps {
  attachment: Attachment;
}

export default function AttachmentChip({ attachment }: AttachmentChipProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <Chip
        icon={<AttachFileIcon />}
        label=""
        size="small"
        color="primary"
        variant="outlined"
        clickable
        onClick={(e) => {
          e.stopPropagation();
          setPreviewOpen(true);
        }}
      />
      <FilePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        attachment={attachment}
      />
    </>
  );
}
