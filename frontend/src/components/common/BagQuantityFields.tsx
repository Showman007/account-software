/**
 * Shared bag/quintal fields with bidirectional auto-calculation.
 *
 * Bag types: 25kg, 26kg, 30kg, 50kg, 75kg
 *
 * Conversion depends on the selected unit:
 *   Weight units → qty = (no_of_bags × bag_type_kg) / kg_per_unit
 *     Quintals: kg_per_unit = 100   (28 bags × 26kg = 728kg / 100 = 7.28 Qtl)
 *     Kgs:      kg_per_unit = 1     (28 bags × 26kg = 728 Kg)
 *     Tonnes:   kg_per_unit = 1000  (28 bags × 26kg = 728kg / 1000 = 0.728 T)
 *   Count units → qty = no_of_bags directly
 *     Bags, Nos
 *   Other units (Litres) → no automatic conversion
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

/** kg per 1 unit for weight-based units (matched case-insensitively) */
const UNIT_KG_FACTORS: Record<string, number> = {
  quintals: 100,
  kgs: 1,
  tonnes: 1000,
};

/** Count-based units where qty = no_of_bags directly */
const COUNT_UNITS = ['bags', 'nos'];

export type ConversionMode = { type: 'weight'; kgPerUnit: number } | { type: 'count' } | { type: 'none' };

/** Determine the conversion mode for a unit */
export function getConversionMode(unitName: string | undefined): ConversionMode {
  if (!unitName) return { type: 'none' };
  const lower = unitName.toLowerCase();
  if (COUNT_UNITS.includes(lower)) return { type: 'count' };
  if (lower in UNIT_KG_FACTORS) return { type: 'weight', kgPerUnit: UNIT_KG_FACTORS[lower] };
  return { type: 'none' };
}

/** Convert bags → qty based on unit type */
export function bagsToQty(bags: number, bagTypeKg: number, mode: ConversionMode): number | null {
  if (mode.type === 'count') return bags;
  if (mode.type === 'weight') return Number(((bags * bagTypeKg) / mode.kgPerUnit).toFixed(3));
  return null; // no conversion for unknown units
}

/** Convert qty → bags based on unit type */
export function qtyToBags(qty: number, bagTypeKg: number, mode: ConversionMode): number | null {
  if (mode.type === 'count') return qty;
  if (mode.type === 'weight') return Number(((qty * mode.kgPerUnit) / bagTypeKg).toFixed(2));
  return null; // no conversion for unknown units
}

interface BagQuantityFieldsProps {
  /** Field name prefix for nested fields, e.g. "order_items_attributes.0" */
  prefix?: string;
  /** Whether to show the live amount (qty * rate) */
  showAmount?: boolean;
  /** Label for the amount field */
  amountLabel?: string;
  /** Map of unit id → unit object to detect unit type */
  unitMap?: Map<number, { name: string; abbreviation: string }>;
}

/**
 * Renders Bag Type, Number of Bags, Quantity fields with live sync.
 * Optionally shows a computed Amount field (qty * rate).
 *
 * Must be used inside a FormProvider context.
 */
export default function BagQuantityFields({
  prefix = '',
  showAmount = false,
  amountLabel = 'Amount',
  unitMap,
}: BagQuantityFieldsProps) {
  const { register, setValue, control } = useFormContext();
  const p = prefix ? `${prefix}.` : '';

  const bagType = useWatch({ control, name: `${p}bag_type` });
  const noOfBags = useWatch({ control, name: `${p}no_of_bags` });
  const qty = useWatch({ control, name: `${p}qty` });
  const rate = useWatch({ control, name: `${p}rate` });
  const unitId = useWatch({ control, name: `${p}unit_id` });

  const unitName = unitMap?.get(Number(unitId))?.name;
  const mode = getConversionMode(unitName);

  const lastEdited = useRef<'bags' | 'qty' | null>(null);

  // Sync bags -> qty
  useEffect(() => {
    if (lastEdited.current !== 'bags') return;
    const bt = Number(bagType);
    const bags = Number(noOfBags);
    if (bt > 0 && bags > 0) {
      const computed = bagsToQty(bags, bt, mode);
      if (computed !== null) {
        setValue(`${p}qty`, computed, { shouldDirty: true });
      }
    }
  }, [noOfBags, bagType, mode, setValue, p]);

  // Sync qty -> bags
  useEffect(() => {
    if (lastEdited.current !== 'qty') return;
    const bt = Number(bagType);
    const q = Number(qty);
    if (bt > 0 && q > 0) {
      const computed = qtyToBags(q, bt, mode);
      if (computed !== null) {
        setValue(`${p}no_of_bags`, computed, { shouldDirty: true });
      }
    }
  }, [qty, bagType, mode, setValue, p]);

  // Re-sync when unit changes (e.g. switch from Quintals to Kgs)
  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current.type === mode.type &&
        (mode.type !== 'weight' || prevMode.current.type !== 'weight' || prevMode.current.kgPerUnit === mode.kgPerUnit)) {
      return;
    }
    prevMode.current = mode;
    const bt = Number(bagType);
    const bags = Number(noOfBags);
    if (bt > 0 && bags > 0) {
      const computed = bagsToQty(bags, bt, mode);
      if (computed !== null) {
        setValue(`${p}qty`, computed, { shouldDirty: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
          const bags = Number(noOfBags);
          if (val && bags > 0) {
            lastEdited.current = 'bags';
            const computed = bagsToQty(bags, Number(val), mode);
            if (computed !== null) {
              setValue(`${p}qty`, computed, { shouldDirty: true });
            }
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
        label="Number of Bags"
        type="number"
        sx={{ width: 140 }}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any', min: 0 } }}
        onFocus={() => { lastEdited.current = 'bags'; }}
        onChange={(e) => {
          lastEdited.current = 'bags';
          setValue(`${p}no_of_bags`, e.target.value === '' ? '' : Number(e.target.value), { shouldDirty: true });
        }}
      />
      <TextField
        {...register(`${p}qty`, { required: true, valueAsNumber: true })}
        label="Quantity"
        type="number"
        sx={{ width: 130 }}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any', min: 0 } }}
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
 * Inline hook version for use in compact table rows (e.g. OrderFormDialog line items).
 */
export function useBagQtySync(prefix: string, unitMap?: Map<number, { name: string; abbreviation: string }>) {
  const { setValue, control } = useFormContext();
  const p = prefix ? `${prefix}.` : '';

  const bagType = useWatch({ control, name: `${p}bag_type` });
  const noOfBags = useWatch({ control, name: `${p}no_of_bags` });
  const qty = useWatch({ control, name: `${p}qty` });
  const rate = useWatch({ control, name: `${p}rate` });
  const unitId = useWatch({ control, name: `${p}unit_id` });

  const unitName = unitMap?.get(Number(unitId))?.name;
  const mode = getConversionMode(unitName);

  const lastEdited = useRef<'bags' | 'qty' | null>(null);

  useEffect(() => {
    if (lastEdited.current !== 'bags') return;
    const bt = Number(bagType);
    const bags = Number(noOfBags);
    if (bt > 0 && bags > 0) {
      const computed = bagsToQty(bags, bt, mode);
      if (computed !== null) {
        setValue(`${p}qty`, computed, { shouldDirty: true });
      }
    }
  }, [noOfBags, bagType, mode, setValue, p]);

  useEffect(() => {
    if (lastEdited.current !== 'qty') return;
    const bt = Number(bagType);
    const q = Number(qty);
    if (bt > 0 && q > 0) {
      const computed = qtyToBags(q, bt, mode);
      if (computed !== null) {
        setValue(`${p}no_of_bags`, computed, { shouldDirty: true });
      }
    }
  }, [qty, bagType, mode, setValue, p]);

  // Re-sync when unit changes
  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current.type === mode.type &&
        (mode.type !== 'weight' || prevMode.current.type !== 'weight' || prevMode.current.kgPerUnit === mode.kgPerUnit)) {
      return;
    }
    prevMode.current = mode;
    const bt = Number(bagType);
    const bags = Number(noOfBags);
    if (bt > 0 && bags > 0) {
      const computed = bagsToQty(bags, bt, mode);
      if (computed !== null) {
        setValue(`${p}qty`, computed, { shouldDirty: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const amount = (Number(qty) || 0) * (Number(rate) || 0);

  const onBagTypeChange = (val: number | '') => {
    setValue(`${p}bag_type`, val, { shouldDirty: true });
    const bags = Number(noOfBags);
    if (val && bags > 0) {
      lastEdited.current = 'bags';
      const computed = bagsToQty(bags, Number(val), mode);
      if (computed !== null) {
        setValue(`${p}qty`, computed, { shouldDirty: true });
      }
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

  return { bagType, noOfBags, qty, rate, amount, mode, onBagTypeChange, onBagsChange, onQtyChange, setLastEdited };
}
