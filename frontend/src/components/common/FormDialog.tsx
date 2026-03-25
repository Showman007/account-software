import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
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

  useEffect(() => {
    if (defaultValues) {
      methods.reset(defaultValues);
    }
  }, [defaultValues, methods]);

  const handleFormSubmit = methods.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>{title}</DialogTitle>
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
