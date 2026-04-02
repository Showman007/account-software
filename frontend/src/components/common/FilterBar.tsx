import { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Badge,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { QueryParams } from '../../types/common.ts';

// ─── Filter field config types ────────────────────────────────

export interface SelectFilter {
  type: 'select';
  name: string;
  label: string;
  options: { value: string | number; label: string }[];
}

export interface AutocompleteFilter {
  type: 'autocomplete';
  name: string;
  label: string;
  options: { id: number; label: string }[];
}

export interface DateRangeFilter {
  type: 'date_range';
}

export interface NumericFilter {
  type: 'numeric';
  name: string;
  label: string;
}

export type FilterFieldConfig = SelectFilter | AutocompleteFilter | DateRangeFilter | NumericFilter;

// ─── Numeric operators ────────────────────────────────────────

const NUMERIC_OPERATORS = [
  { value: 'gte', label: '≥  Greater or equal' },
  { value: 'lte', label: '≤  Less or equal' },
  { value: 'gt', label: '>  Greater than' },
  { value: 'lt', label: '<  Less than' },
  { value: 'eq', label: '=  Equal to' },
] as const;

const OPERATOR_DISPLAY: Record<string, string> = {
  gte: '≥',
  lte: '≤',
  gt: '>',
  lt: '<',
  eq: '=',
};

const OPERATOR_SUFFIXES = ['gt', 'gte', 'lt', 'lte', 'eq'];

// ─── FilterBar Component ─────────────────────────────────────

interface FilterBarProps {
  filters: FilterFieldConfig[];
  params: QueryParams;
  updateParams: (p: Partial<QueryParams>) => void;
}

export default function FilterBar({ filters, params, updateParams }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  // Count active filters (excluding page, per_page, q, sort, order)
  const skipKeys = new Set(['page', 'per_page', 'q', 'sort', 'order']);
  const activeCount = Object.entries(params).filter(
    ([k, v]) => !skipKeys.has(k) && v !== undefined && v !== ''
  ).length;

  const clearAll = () => {
    const cleared: Partial<QueryParams> = { page: 1 };
    for (const filter of filters) {
      if (filter.type === 'date_range') {
        cleared.from_date = undefined;
        cleared.to_date = undefined;
      } else if (filter.type === 'numeric') {
        for (const suffix of OPERATOR_SUFFIXES) {
          cleared[`${filter.name}_${suffix}`] = undefined;
        }
      } else {
        cleared[filter.name] = undefined;
      }
    }
    updateParams(cleared);
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={activeCount} color="primary" variant="dot" invisible={activeCount === 0}>
            <FilterListIcon fontSize="small" color={activeCount > 0 ? 'primary' : 'action'} />
          </Badge>
          <Typography variant="body2" fontWeight={500} color={activeCount > 0 ? 'primary' : 'text.secondary'}>
            Filters {activeCount > 0 && `(${activeCount} active)`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {activeCount > 0 && (
            <Chip
              label="Clear all"
              size="small"
              variant="outlined"
              color="error"
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              icon={<ClearAllIcon />}
              sx={{ height: 26 }}
            />
          )}
          <IconButton size="small">
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Filter Fields */}
      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', px: 2, pb: 2 }}>
          {filters.map((filter, idx) => {
            switch (filter.type) {
              case 'select':
                return (
                  <FormControl key={idx} size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>{filter.label}</InputLabel>
                    <Select
                      value={params[filter.name] ?? ''}
                      label={filter.label}
                      onChange={(e) => updateParams({ [filter.name]: e.target.value || undefined, page: 1 })}
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      {filter.options.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );

              case 'autocomplete':
                return (
                  <AutocompleteFilterField
                    key={idx}
                    filter={filter}
                    value={params[filter.name] as number | undefined}
                    onChange={(val) => updateParams({ [filter.name]: val, page: 1 })}
                  />
                );

              case 'date_range':
                return (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      type="date"
                      label="From Date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={params.from_date || ''}
                      onChange={(e) => updateParams({ from_date: e.target.value || undefined, page: 1 })}
                      sx={{ width: 160 }}
                    />
                    <Typography variant="body2" color="text.secondary">–</Typography>
                    <TextField
                      size="small"
                      type="date"
                      label="To Date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={params.to_date || ''}
                      onChange={(e) => updateParams({ to_date: e.target.value || undefined, page: 1 })}
                      sx={{ width: 160 }}
                    />
                  </Box>
                );

              case 'numeric':
                return (
                  <NumericFilterField
                    key={idx}
                    filter={filter}
                    params={params}
                    updateParams={updateParams}
                  />
                );

              default:
                return null;
            }
          })}
        </Box>
      </Collapse>
    </Paper>
  );
}

// ─── Autocomplete sub-component ──────────────────────────────

function AutocompleteFilterField({
  filter,
  value,
  onChange,
}: {
  filter: AutocompleteFilter;
  value: number | undefined;
  onChange: (val: number | undefined) => void;
}) {
  const selected = filter.options.find((o) => o.id === value) || null;
  return (
    <Autocomplete
      size="small"
      sx={{ width: 220 }}
      options={filter.options}
      getOptionLabel={(o) => o.label}
      value={selected}
      onChange={(_, val) => onChange(val?.id)}
      renderInput={(p) => <TextField {...p} label={filter.label} />}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
    />
  );
}

// ─── Numeric sub-component ───────────────────────────────────

function NumericFilterField({
  filter,
  params,
  updateParams,
}: {
  filter: NumericFilter;
  params: QueryParams;
  updateParams: (p: Partial<QueryParams>) => void;
}) {
  // Find active operator and value
  let activeOp = 'gte';
  let activeVal = '';
  for (const suffix of OPERATOR_SUFFIXES) {
    const key = `${filter.name}_${suffix}`;
    if (params[key] !== undefined && params[key] !== '') {
      activeOp = suffix;
      activeVal = String(params[key]);
      break;
    }
  }

  const [op, setOp] = useState(activeOp);

  const handleOpChange = (newOp: string) => {
    setOp(newOp);
    if (activeVal) {
      const update: Partial<QueryParams> = { page: 1 };
      for (const suffix of OPERATOR_SUFFIXES) {
        update[`${filter.name}_${suffix}`] = undefined;
      }
      update[`${filter.name}_${newOp}`] = activeVal;
      updateParams(update);
    }
  };

  const handleValueChange = (val: string) => {
    const update: Partial<QueryParams> = { page: 1 };
    for (const suffix of OPERATOR_SUFFIXES) {
      update[`${filter.name}_${suffix}`] = undefined;
    }
    if (val) {
      update[`${filter.name}_${op}`] = val;
    }
    updateParams(update);
  };

  return (
    <TextField
      size="small"
      type="number"
      label={filter.label}
      value={activeVal}
      onChange={(e) => handleValueChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <Select
              variant="standard"
              value={op}
              onChange={(e) => { e.stopPropagation(); handleOpChange(e.target.value); }}
              disableUnderline
              sx={{
                mr: 0.5,
                '& .MuiSelect-select': {
                  py: 0,
                  pr: '20px !important',
                  pl: 0,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  minWidth: 20,
                },
              }}
              renderValue={(v) => OPERATOR_DISPLAY[v] || v}
            >
              {NUMERIC_OPERATORS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          ),
        },
        inputLabel: { shrink: true },
      }}
      sx={{ width: 160 }}
    />
  );
}
