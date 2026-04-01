import { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
  IconButton, Box, TextField, Typography, Divider, Checkbox, FormControlLabel, MenuItem,
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
import { BAG_TYPE_OPTIONS, getConversionMode, bagsToQty, qtyToBags } from '../common/BagQuantityFields.tsx';
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
  bag_type: number | '';
  no_of_bags: number | '';
  qty: number;
  selected: boolean;
  bag_type_from_order: boolean;
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
        bag_type: item.bag_type ?? '',
        no_of_bags: (() => {
          if (!item.bag_type || !item.pending_qty) return '';
          const unitName = item.unit?.name || unitMap.get(item.unit_id)?.name;
          const mode = getConversionMode(unitName);
          const bags = qtyToBags(item.pending_qty, item.bag_type, mode);
          return bags ?? '';
        })(),
        qty: item.pending_qty,
        selected: true,
        bag_type_from_order: item.bag_type != null && item.bag_type > 0,
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

  const getItemMode = (item: DeliveryItemRow) => {
    const unitName = unitMap.get(item.unit_id)?.name;
    return getConversionMode(unitName);
  };

  const updateQty = (index: number, qty: number) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const clampedQty = Math.min(qty, item.available);
      const bt = Number(item.bag_type);
      const mode = getItemMode(item);
      const bags = bt > 0 ? (qtyToBags(clampedQty, bt, mode) ?? item.no_of_bags) : item.no_of_bags;
      return { ...item, qty: clampedQty, no_of_bags: bags };
    }));
  };

  const updateBags = (index: number, bags: number) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const bt = Number(item.bag_type);
      const mode = getItemMode(item);
      const computed = bt > 0 ? bagsToQty(bags, bt, mode) : null;
      const qty = computed !== null ? Math.min(computed, item.available) : item.qty;
      return { ...item, no_of_bags: bags, qty };
    }));
  };

  const updateBagType = (index: number, bagType: number | '') => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const bt = Number(bagType);
      const mode = getItemMode(item);
      const bags = bt > 0 && item.qty > 0 ? (qtyToBags(item.qty, bt, mode) ?? '') : '';
      return { ...item, bag_type: bagType, no_of_bags: bags };
    }));
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
        bag_type: item.bag_type || null,
        no_of_bags: item.no_of_bags || null,
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
                  <TableCell align="center">Bag Type</TableCell>
                  <TableCell align="right">Number of Bags</TableCell>
                  <TableCell align="right">Deliver Quantity</TableCell>
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
                    <TableCell align="center">
                      {item.bag_type_from_order ? (
                        <Typography variant="body2">{item.bag_type} kg</Typography>
                      ) : (
                        <TextField
                          select
                          size="small"
                          value={item.bag_type}
                          onChange={(e) => updateBagType(index, e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={!item.selected}
                          sx={{ width: 100 }}
                        >
                          {BAG_TYPE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.no_of_bags}
                        onChange={(e) => updateBags(index, Number(e.target.value))}
                        disabled={!item.selected || !item.bag_type}
                        sx={{ width: 80 }}
                        slotProps={{ htmlInput: { step: 'any', min: 0 } }}
                      />
                    </TableCell>
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
