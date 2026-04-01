import { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
  IconButton, Box, TextField, Typography, Divider, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createOrderCreditNote } from '../../api/resources.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import type { Order, Delivery } from '../../types/orders.ts';

interface Props {
  open: boolean;
  onClose: () => void;
  order: Order;
  delivery: Delivery;
  onSuccess: () => void;
}

interface ReturnItemRow {
  delivery_item_id: number;
  product_id: number;
  product_name: string;
  unit_id: number;
  unit_abbr: string;
  delivered_qty: number;
  rate: number;
  qty: number;
  selected: boolean;
}

export default function CreditNoteFormDialog({ open, onClose, order, delivery, onSuccess }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { productMap, unitMap } = useReferenceData();

  const returnableItems: ReturnItemRow[] = useMemo(() => {
    return delivery.delivery_items
      .filter((di) => (di.returnable_qty ?? di.qty) > 0)
      .map((di) => {
        const orderItem = order.order_items.find((oi) => oi.id === di.order_item_id);
        return {
          delivery_item_id: di.id,
          product_id: di.product_id,
          product_name: di.product?.name || productMap.get(di.product_id)?.name || '',
          unit_id: di.unit_id,
          unit_abbr: di.unit?.abbreviation || unitMap.get(di.unit_id)?.abbreviation || '',
          delivered_qty: di.returnable_qty ?? di.qty,
          rate: orderItem?.rate ?? 0,
          qty: 0,
          selected: false,
        };
      });
  }, [delivery, order, productMap, unitMap]);

  const [items, setItems] = useState<ReturnItemRow[]>(returnableItems);

  const { control, register, handleSubmit } = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      reason: '',
      remarks: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createOrderCreditNote(order.id, delivery.id, data),
    onSuccess: () => { toast.success('Credit note created'); onSuccess(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleItem = (index: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const updateQty = (index: number, qty: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, qty: Math.min(qty, item.delivered_qty) } : item));
  };

  const totalReturn = useMemo(() => {
    return items.filter((i) => i.selected && i.qty > 0).reduce((sum, i) => sum + i.qty * i.rate, 0);
  }, [items]);

  const onSubmit = handleSubmit((formData) => {
    const selectedItems = items.filter((i) => i.selected && i.qty > 0);
    if (selectedItems.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }

    mutation.mutate({
      ...formData,
      credit_note_items_attributes: selectedItems.map((item) => ({
        delivery_item_id: item.delivery_item_id,
        product_id: item.product_id,
        qty: item.qty,
        unit_id: item.unit_id,
        rate: item.rate,
      })),
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <form onSubmit={onSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Credit Note — {delivery.delivery_number}
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
            <TextField {...register('reason')} label="Reason" sx={{ flex: 1, minWidth: 200 }} />
          </Box>

          <Divider />

          <Typography variant="subtitle2" fontWeight="bold">Select Items to Return</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Product</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Delivered</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Return Qty</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.delivery_item_id}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={item.selected} onChange={() => toggleItem(index)} />
                    </TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.unit_abbr}</TableCell>
                    <TableCell align="right">{item.delivered_qty}</TableCell>
                    <TableCell align="right">{formatINR(item.rate)}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.qty}
                        onChange={(e) => updateQty(index, Number(e.target.value))}
                        disabled={!item.selected}
                        sx={{ width: 100 }}
                        slotProps={{ htmlInput: { step: 'any', min: 0, max: item.delivered_qty } }}
                      />
                    </TableCell>
                    <TableCell align="right">{item.selected && item.qty > 0 ? formatINR(item.qty * item.rate) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalReturn > 0 && (
            <Typography variant="body1" fontWeight="bold" textAlign="right" color="error.main">
              Total Credit: -{formatINR(totalReturn)}
            </Typography>
          )}

          <TextField {...register('remarks')} label="Remarks" multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="error" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Issue Credit Note'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
