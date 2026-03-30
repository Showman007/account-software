/**
 * Shared bag/quintal fields with bidirectional auto-calculation.
 *
 * Bag types: 25kg, 26kg, 30kg, 50kg, 75kg
 * 1 Quintal = 100 kg
 * Quintals = (no_of_bags * bag_type_kg) / 100
 * Bags = (qty_quintals * 100) / bag_type_kg
 *
 * Also shows a live "Amount" when rate is available: qty * rate.
 */
import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TextField, MenuItem, Box } from '@mui/material';
import { formatINR } from './SummaryCard.tsx';

export const BAG_TYPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 25, label: '25 kg' },
  { value: 26, label: '26 kg' },
  { value: 30, label: '30 kg' },
  { value: 50, label: '50 kg' },
  { value: 75, label: '75 kg' },
];

interface BagQuantityFieldsProps {
  /** Field name prefix for nested fields, e.g. "order_items_attributes.0" */
  prefix?: string;
  /** Whether to show the live amount (qty * rate) */
  showAmount?: boolean;
  /** Label for the amount field */
  amountLabel?: string;
}

/**
 * Renders Bag Type, No of Bags, Qty (Quintals) fields with live sync.
 * Optionally shows a computed Amount field (qty * rate).
 *
 * Must be used inside a FormProvider context.
 */
export default function BagQuantityFields({
  prefix = '',
  showAmount = false,
  amountLabel = 'Amount',
}: BagQuantityFieldsProps) {
  const { register, setValue, control } = useFormContext();
  const p = prefix ? `${prefix}.` : '';

  const bagType = useWatch({ control, name: `${p}bag_type` });
  const noOfBags = useWatch({ control, name: `${p}no_of_bags` });
  const qty = useWatch({ control, name: `${p}qty` });
  const rate = useWatch({ control, name: `${p}rate` });

  // Track which field the user last touched to determine sync direction
  const lastEdited = useRef<'bags' | 'qty' | null>(null);

  // Sync bags -> qty
  useEffect(() => {
    if (lastEdited.current !== 'bags') return;
    const bt = Number(bagType);
    const bags = Number(noOfBags);
    if (bt > 0 && bags > 0) {
      const computed = Number(((bags * bt) / 100).toFixed(3));
      setValue(`${p}qty`, computed, { shouldDirty: true });
    }
  }, [noOfBags, bagType, setValue, p]);

  // Sync qty -> bags
  useEffect(() => {
    if (lastEdited.current !== 'qty') return;
    const bt = Number(bagType);
    const q = Number(qty);
    if (bt > 0 && q > 0) {
      const computed = Number(((q * 100) / bt).toFixed(2));
      setValue(`${p}no_of_bags`, computed, { shouldDirty: true });
    }
  }, [qty, bagType, setValue, p]);

  const amount = (Number(qty) || 0) * (Number(rate) || 0);

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <TextField
        {...register(`${p}bag_type`)}
        select
        label="Bag Type"
        sx={{ width: 120 }}
        value={bagType ?? ''}
        onChange={(e) => {
          const val = e.target.value === '' ? '' : Number(e.target.value);
          setValue(`${p}bag_type`, val, { shouldDirty: true });
          // When bag type changes and bags are already filled, recalc qty
          const bags = Number(noOfBags);
          if (val && bags > 0) {
            lastEdited.current = 'bags';
            const computed = Number(((bags * Number(val)) / 100).toFixed(3));
            setValue(`${p}qty`, computed, { shouldDirty: true });
          }
        }}
      >
        {BAG_TYPE_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        {...register(`${p}no_of_bags`, { valueAsNumber: true })}
        label="No. of Bags"
        type="number"
        sx={{ width: 110 }}
        slotProps={{ htmlInput: { step: 'any', min: 0 } }}
        onFocus={() => { lastEdited.current = 'bags'; }}
        onChange={(e) => {
          lastEdited.current = 'bags';
          setValue(`${p}no_of_bags`, e.target.value === '' ? '' : Number(e.target.value), { shouldDirty: true });
        }}
      />
      <TextField
        {...register(`${p}qty`, { required: true, valueAsNumber: true })}
        label="Qty (Quintals)"
        type="number"
        sx={{ width: 130 }}
        slotProps={{ htmlInput: { step: 'any', min: 0 } }}
        onFocus={() => { lastEdited.current = 'qty'; }}
        onChange={(e) => {
          lastEdited.current = 'qty';
          setValue(`${p}qty`, e.target.value === '' ? '' : Number(e.target.value), { shouldDirty: true });
        }}
      />
      {showAmount && (
        <TextField
          label={amountLabel}
          value={formatINR(amount)}
          disabled
          sx={{ width: 130 }}
        />
      )}
    </Box>
  );
}

/**
 * Inline version for use in compact table rows (e.g. OrderFormDialog line items).
 * Returns individual field elements instead of wrapping Box.
 */
export function useBagQtySync(prefix: string) {
  const { setValue, control } = useFormContext();
  const p = prefix ? `${prefix}.` : '';

  const bagType = useWatch({ control, name: `${p}bag_type` });
  const noOfBags = useWatch({ control, name: `${p}no_of_bags` });
  const qty = useWatch({ control, name: `${p}qty` });
  const rate = useWatch({ control, name: `${p}rate` });

  const lastEdited = useRef<'bags' | 'qty' | null>(null);

  useEffect(() => {
    if (lastEdited.current !== 'bags') return;
    const bt = Number(bagType);
    const bags = Number(noOfBags);
    if (bt > 0 && bags > 0) {
      setValue(`${p}qty`, Number(((bags * bt) / 100).toFixed(3)), { shouldDirty: true });
    }
  }, [noOfBags, bagType, setValue, p]);

  useEffect(() => {
    if (lastEdited.current !== 'qty') return;
    const bt = Number(bagType);
    const q = Number(qty);
    if (bt > 0 && q > 0) {
      setValue(`${p}no_of_bags`, Number(((q * 100) / bt).toFixed(2)), { shouldDirty: true });
    }
  }, [qty, bagType, setValue, p]);

  const amount = (Number(qty) || 0) * (Number(rate) || 0);

  const onBagTypeChange = (val: number | '') => {
    setValue(`${p}bag_type`, val, { shouldDirty: true });
    const bags = Number(noOfBags);
    if (val && bags > 0) {
      lastEdited.current = 'bags';
      setValue(`${p}qty`, Number(((bags * Number(val)) / 100).toFixed(3)), { shouldDirty: true });
    }
  };

  const onBagsChange = (val: number | '') => {
    lastEdited.current = 'bags';
    setValue(`${p}no_of_bags`, val, { shouldDirty: true });
  };

  const onQtyChange = (val: number | '') => {
    lastEdited.current = 'qty';
    setValue(`${p}qty`, val, { shouldDirty: true });
  };

  const setLastEdited = (field: 'bags' | 'qty') => {
    lastEdited.current = field;
  };

  return { bagType, noOfBags, qty, rate, amount, onBagTypeChange, onBagsChange, onQtyChange, setLastEdited };
}
