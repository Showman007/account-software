import { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
  IconButton, Box, TextField, Typography, Divider, Checkbox, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createDelivery } from '../../api/resources.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import type { Order, OrderItem } from '../../types/orders.ts';

interface Props {
  open: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

interface DeliveryItemRow {
  order_item_id: number;
  product_id: number;
  product_name: string;
  unit_id: number;
  unit_abbr: string;
  available: number;
  qty: number;
  selected: boolean;
}

export default function DeliveryFormDialog({ open, onClose, order, onSuccess }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { productMap, unitMap } = useReferenceData();

  const pendingItems: DeliveryItemRow[] = useMemo(() => {
    return order.order_items
      .filter((item) => item.pending_qty > 0)
      .map((item) => ({
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || productMap.get(item.product_id)?.name || '',
        unit_id: item.unit_id,
        unit_abbr: item.unit?.abbreviation || unitMap.get(item.unit_id)?.abbreviation || '',
        available: item.pending_qty,
        qty: item.pending_qty,
        selected: true,
      }));
  }, [order, productMap, unitMap]);

  const [items, setItems] = useState<DeliveryItemRow[]>(pendingItems);

  const { control, register, handleSubmit } = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      transport: 0,
      vehicle_no: '',
      driver_name: '',
      remarks: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createDelivery(order.id, data),
    onSuccess: () => { toast.success('Delivery created'); onSuccess(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleItem = (index: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const updateQty = (index: number, qty: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, qty: Math.min(qty, item.available) } : item));
  };

  const onSubmit = handleSubmit((formData) => {
    const selectedItems = items.filter((i) => i.selected && i.qty > 0);
    if (selectedItems.length === 0) {
      toast.error('Select at least one item to deliver');
      return;
    }

    mutation.mutate({
      ...formData,
      delivery_items_attributes: selectedItems.map((item) => ({
        order_item_id: item.order_item_id,
        product_id: item.product_id,
        qty: item.qty,
        unit_id: item.unit_id,
      })),
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <form onSubmit={onSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            New Delivery for {order.order_number}
            <IconButton edge="end" onClick={onClose}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <DatePicker
                  label="Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : '')}
                  slotProps={{ textField: { sx: { minWidth: 180 } } }}
                />
              )}
            />
            <TextField {...register('transport', { valueAsNumber: true })} label="Transport" type="number" sx={{ width: 130 }} slotProps={{ htmlInput: { step: 'any' } }} />
            <TextField {...register('vehicle_no')} label="Vehicle No" sx={{ flex: 1, minWidth: 120 }} />
            <TextField {...register('driver_name')} label="Driver Name" sx={{ flex: 1, minWidth: 120 }} />
          </Box>

          <Divider />

          <Typography variant="subtitle2" fontWeight="bold">Select Items to Deliver</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Product</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right">Deliver Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.order_item_id}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={item.selected} onChange={() => toggleItem(index)} />
                    </TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.unit_abbr}</TableCell>
                    <TableCell align="right">{item.available}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.qty}
                        onChange={(e) => updateQty(index, Number(e.target.value))}
                        disabled={!item.selected}
                        sx={{ width: 100 }}
                        slotProps={{ htmlInput: { step: 'any', min: 0, max: item.available } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TextField {...register('remarks')} label="Remarks" multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Create Delivery'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
