import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, FormProvider } from 'react-hook-form';
import type { ReactNode } from 'react';

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  title: string;
  children: ReactNode;
  defaultValues?: Record<string, unknown>;
  isLoading?: boolean;
}

export default function FormDialog({
  open,
  onClose,
  onSubmit,
  title,
  children,
  defaultValues,
  isLoading,
}: FormDialogProps) {
  const methods = useForm({ defaultValues: defaultValues ?? {} });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (defaultValues) {
      methods.reset(defaultValues);
    }
  }, [defaultValues, methods]);

  const handleFormSubmit = methods.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {title}
              {isMobile && (
                <IconButton edge="end" onClick={onClose} aria-label="close">
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {children}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
