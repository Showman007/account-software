import { useState } from 'react';
import { Box, TextField, InputAdornment, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';

interface SearchFilterBarProps {
  onSearchChange: (value: string) => void;
  onDateRangeChange?: (from: string, to: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export default function SearchFilterBar({
  onSearchChange,
  onDateRangeChange,
  searchPlaceholder = 'Search...',
  children,
}: SearchFilterBarProps) {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);

  const handleSearch = () => {
    onSearchChange(search);
  };

  const handleDateApply = () => {
    if (onDateRangeChange) {
      onDateRangeChange(
        fromDate ? fromDate.format('YYYY-MM-DD') : '',
        toDate ? toDate.format('YYYY-MM-DD') : ''
      );
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch();
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: 250 }}
      />
      {onDateRangeChange && (
        <>
          <DatePicker
            label="From"
            value={fromDate}
            onChange={(val) => setFromDate(val ? dayjs(val) : null)}
            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
          />
          <DatePicker
            label="To"
            value={toDate}
            onChange={(val) => setToDate(val ? dayjs(val) : null)}
            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
          />
          <Button variant="outlined" size="small" onClick={handleDateApply}>
            Apply
          </Button>
        </>
      )}
      {children}
    </Box>
  );
}
