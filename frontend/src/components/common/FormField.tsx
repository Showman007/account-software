import { useFormContext, Controller } from 'react-hook-form';
import { TextField, MenuItem, Autocomplete } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  select?: boolean;
  options?: { value: string | number; label: string }[];
}

export function FormField({
  name,
  label,
  type = 'text',
  required = false,
  multiline = false,
  rows,
  disabled = false,
  select = false,
  options = [],
}: FormFieldProps) {
  const { register, formState: { errors } } = useFormContext();

  if (select) {
    return (
      <TextField
        {...register(name, { required: required ? `${label} is required` : false })}
        label={label}
        select
        fullWidth
        error={!!errors[name]}
        helperText={errors[name]?.message as string}
        disabled={disabled}
        defaultValue=""
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <TextField
      {...register(name, {
        required: required ? `${label} is required` : false,
        valueAsNumber: type === 'number',
      })}
      label={label}
      type={type}
      fullWidth
      required={required}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      error={!!errors[name]}
      helperText={errors[name]?.message as string}
      slotProps={type === 'number' ? { htmlInput: { step: 'any' } } : undefined}
    />
  );
}

interface FormDateFieldProps {
  name: string;
  label: string;
  required?: boolean;
}

export function FormDateField({ name, label, required = false }: FormDateFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState }) => (
        <DatePicker
          label={label}
          value={field.value ? dayjs(field.value) : null}
          onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : '')}
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!fieldState.error,
              helperText: fieldState.error?.message,
            },
          }}
        />
      )}
    />
  );
}

interface FormAutocompleteProps {
  name: string;
  label: string;
  options: { id: number; label: string }[];
  required?: boolean;
}

export function FormAutocomplete({ name, label, options, required = false }: FormAutocompleteProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState }) => (
        <Autocomplete
          options={options}
          getOptionLabel={(opt) => (typeof opt === 'object' ? opt.label : '')}
          value={options.find((o) => o.id === field.value) ?? null}
          onChange={(_e, val) => field.onChange(val?.id ?? null)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  );
}

interface FormSelectFieldProps {
  name: string;
  label: string;
  options: { value: string | number; label: string }[];
  required?: boolean;
  disabled?: boolean;
}

export function FormSelectField({ name, label, options, required = false, disabled = false }: FormSelectFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          select
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          disabled={disabled}
          value={field.value ?? ''}
        >
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
