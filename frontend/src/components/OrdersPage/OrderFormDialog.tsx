import { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
  IconButton, Box, TextField, Typography, Divider, Grid,
  useTheme, useMediaQuery, MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, useFormContext, FormProvider, useFieldArray, Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete } from '@mui/material';
import dayjs from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ordersApi } from '../../api/resources.ts';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import { BAG_TYPE_OPTIONS, useBagQtySync } from '../common/BagQuantityFields.tsx';
import type { Order, OrderFormData } from '../../types/orders.ts';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Order | null;
  onSuccess: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Single order line item row with bag↔qty sync + live amount */
function OrderLineItem({
  index,
  outboundProducts,
  unitOptions,
  canRemove,
  onRemove,
}: {
  index: number;
  outboundProducts: { value: number; label: string }[];
  unitOptions: { value: number; label: string }[];
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { register, control } = useFormContext();
  const prefix = `order_items_attributes.${index}`;
  const { bagType, amount, onBagTypeChange, onBagsChange, onQtyChange, setLastEdited } = useBagQtySync(prefix);

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Controller
        name={`${prefix}.product_id`}
        control={control}
        rules={{ required: 'Required' }}
        render={({ field: f, fieldState }) => (
          <TextField
            {...f}
            select
            label="Product"
            sx={{ minWidth: 140, flex: 2 }}
            error={!!fieldState.error}
            value={f.value ?? ''}
          >
            {outboundProducts.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>
        )}
      />
      <TextField
        {...register(`${prefix}.bag_type`)}
        select
        label="Bag"
        sx={{ width: 100 }}
        value={bagType ?? ''}
        onChange={(e) => onBagTypeChange(e.target.value === '' ? '' : Number(e.target.value))}
      >
        {BAG_TYPE_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
      <TextField
        {...register(`${prefix}.no_of_bags`, { valueAsNumber: true })}
        label="Bags"
        type="number"
        sx={{ width: 80 }}
        slotProps={{ htmlInput: { step: 'any', min: 0 } }}
        onFocus={() => setLastEdited('bags')}
        onChange={(e) => onBagsChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
      <TextField
        {...register(`${prefix}.qty`, { required: true, valueAsNumber: true })}
        label="Qty"
        type="number"
        sx={{ width: 90 }}
        slotProps={{ htmlInput: { step: 'any', min: 0 } }}
        onFocus={() => setLastEdited('qty')}
        onChange={(e) => onQtyChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
      <Controller
        name={`${prefix}.unit_id`}
        control={control}
        rules={{ required: 'Required' }}
        render={({ field: f }) => (
          <TextField {...f} select label="Unit" sx={{ width: 120 }} value={f.value ?? ''}>
            {unitOptions.map((u) => (
              <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
            ))}
          </TextField>
        )}
      />
      <TextField
        {...register(`${prefix}.rate`, { required: true, valueAsNumber: true })}
        label="Rate"
        type="number"
        sx={{ width: 100 }}
        slotProps={{ htmlInput: { step: 'any' } }}
      />
      <TextField
        label="Amount"
        value={formatINR(amount)}
        disabled
        sx={{ width: 120 }}
      />
      <IconButton
        color="error"
        onClick={onRemove}
        disabled={!canRemove}
        sx={{ mt: 0.5 }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}

export default function OrderFormDialog({ open, onClose, editing, onSuccess }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const { parties, products, units } = useReferenceData();
  const [submitting, setSubmitting] = useState(false);

  const partyOptions = useMemo(
    () => parties.filter((p) => p.party_type === 'buyer' || p.party_type === 'both').map((p) => ({ id: p.id, label: p.name })),
    [parties]
  );
  const outboundProducts = useMemo(
    () => products.filter((p) => p.direction === 'outbound' || p.direction === 'both').map((p) => ({ value: p.id, label: p.name })),
    [products]
  );
  const unitOptions = useMemo(
    () => units.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })),
    [units]
  );

  const defaultValues: OrderFormData = useMemo(() => {
    if (editing) {
      return {
        date: editing.date,
        party_id: editing.party_id,
        city: editing.city || '',
        discount: editing.discount || 0,
        valid_until: editing.valid_until || '',
        remarks: editing.remarks || '',
        order_items_attributes: editing.order_items.map((item) => ({
          product_id: item.product_id,
          category: item.category || '',
          bag_type: item.bag_type ?? '',
          no_of_bags: item.no_of_bags ?? '',
          qty: item.qty,
          unit_id: item.unit_id,
          rate: item.rate,
        })),
      };
    }
    return {
      date: today(),
      party_id: null,
      city: '',
      discount: 0,
      valid_until: '',
      remarks: '',
      order_items_attributes: [{ product_id: '', category: '', bag_type: '', no_of_bags: '', qty: '', unit_id: '', rate: '' }],
    };
  }, [editing]);

  const methods = useForm<OrderFormData>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'order_items_attributes' });
  const watchItems = methods.watch('order_items_attributes');
  const watchDiscount = methods.watch('discount');

  const subtotal = useMemo(() => {
    return (watchItems || []).reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const r = Number(item.rate) || 0;
      return sum + q * r;
    }, 0);
  }, [watchItems]);

  const total = subtotal - (Number(watchDiscount) || 0);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Order>) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully');
      onSuccess();
    },
    onError: (err: Error) => toast.error(`Failed to create: ${err.message}`),
    onSettled: () => setSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Order> }) => ordersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated successfully');
      onSuccess();
    },
    onError: (err: Error) => toast.error(`Failed to update: ${err.message}`),
    onSettled: () => setSubmitting(false),
  });

  const handleFormSubmit = methods.handleSubmit((data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      order_items_attributes: data.order_items_attributes.filter((item) => item.product_id && item.qty),
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload as Partial<Order> });
    } else {
      createMutation.mutate(payload as Partial<Order>);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {editing ? 'Edit Quotation' : 'New Quotation'}
              <IconButton edge="end" onClick={onClose}><CloseIcon /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {/* Order header fields */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="date"
                  control={methods.control}
                  rules={{ required: 'Date is required' }}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label="Date"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { fullWidth: true, error: !!fieldState.error, helperText: fieldState.error?.message } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="valid_until"
                  control={methods.control}
                  render={({ field }) => (
                    <DatePicker
                      label="Valid Until (optional)"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="party_id"
                  control={methods.control}
                  rules={{ required: 'Party is required' }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={partyOptions}
                      getOptionLabel={(opt) => (typeof opt === 'object' ? opt.label : '')}
                      value={partyOptions.find((o) => o.id === field.value) ?? null}
                      onChange={(_e, val) => field.onChange(val?.id ?? null)}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Party (Buyer)" error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...methods.register('city')} label="City" fullWidth />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Line items */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">Items</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => append({ product_id: '', category: '', bag_type: '', no_of_bags: '', qty: '', unit_id: '', rate: '' })}
              >
                Add Item
              </Button>
            </Box>

            {fields.map((field, index) => (
              <OrderLineItem
                key={field.id}
                index={index}
                outboundProducts={outboundProducts}
                unitOptions={unitOptions}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}

            <Divider sx={{ my: 1 }} />

            {/* Totals */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField {...methods.register('discount', { valueAsNumber: true })} label="Discount" type="number" fullWidth slotProps={{ htmlInput: { step: 'any' } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Subtotal" value={formatINR(subtotal)} disabled fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Total" value={formatINR(total)} disabled fullWidth />
              </Grid>
            </Grid>

            <TextField {...methods.register('remarks')} label="Remarks" multiline rows={2} fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : editing ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
