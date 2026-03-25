import { Card, CardContent, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  isCurrency?: boolean;
}

function formatINR(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value ?? 0;
  return '\u20B9' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function SummaryCard({ title, value, icon, color, isCurrency = true }: SummaryCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {isCurrency ? formatINR(value) : (typeof value === 'string' ? parseFloat(value) || 0 : value ?? 0).toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export { formatINR };
