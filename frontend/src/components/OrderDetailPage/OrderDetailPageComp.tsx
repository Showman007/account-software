import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Box, Typography, Chip, Button, Paper, Grid, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Card, CardContent, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {
  getOrder, confirmOrder, cancelOrder, closeOrder, duplicateOrder,
  markDeliveryInTransit, markDeliveryDelivered,
} from '../../api/resources.ts';
import BillButton from '../common/BillButton.tsx';
import { useReferenceData } from '../../hooks/useReferenceData.ts';
import { formatINR } from '../common/SummaryCard.tsx';
import type { Order, OrderStatus, Delivery } from '../../types/orders.ts';
import DeliveryFormDialog from './DeliveryFormDialog.tsx';
import CreditNoteFormDialog from './CreditNoteFormDialog.tsx';

const STATUS_COLORS: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' | 'secondary'> = {
  quotation: 'default',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'primary',
  partial_delivered: 'secondary',
  delivered: 'success',
  closed: 'success',
  cancelled: 'error',
};

export default function OrderDetailPageComp() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productMap, unitMap } = useReferenceData();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [creditNoteDialog, setCreditNoteDialog] = useState<{ open: boolean; delivery: Delivery | null }>({ open: false, delivery: null });

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(Number(id)),
    enabled: !!id,
  });

  const order: Order | undefined = data?.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['order', id] });

  const confirmMut = useMutation({
    mutationFn: () => confirmOrder(Number(id)),
    onSuccess: () => { toast.success('Order confirmed'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: (reason: string) => cancelOrder(Number(id), reason),
    onSuccess: () => { toast.success('Order cancelled'); setCancelDialogOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeMut = useMutation({
    mutationFn: () => closeOrder(Number(id)),
    onSuccess: () => { toast.success('Order closed'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMut = useMutation({
    mutationFn: () => duplicateOrder(Number(id)),
    onSuccess: (res) => {
      toast.success('Order duplicated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${res.data.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const transitMut = useMutation({
    mutationFn: (deliveryId: number) => markDeliveryInTransit(Number(id), deliveryId),
    onSuccess: () => { toast.success('Marked as in transit'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deliveredMut = useMutation({
    mutationFn: (deliveryId: number) => markDeliveryDelivered(Number(id), deliveryId),
    onSuccess: () => { toast.success('Marked as delivered'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error || !order) return <Alert severity="error">Failed to load order</Alert>;

  const isDeliverable = ['confirmed', 'processing', 'shipped', 'partial_delivered'].includes(order.status);
  const isCancellable = ['quotation', 'confirmed'].includes(order.status);
  const isCloseable = order.status === 'delivered';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/orders')}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight="bold">{order.order_number}</Typography>
        <Chip label={order.status.replace('_', ' ')} color={STATUS_COLORS[order.status]} sx={{ textTransform: 'capitalize' }} />
        {order.status === 'quotation' && (
          <BillButton billType="quotation" recordId={order.id} tooltip="Download Quotation PDF" />
        )}
        {order.status !== 'quotation' && order.status !== 'cancelled' && (
          <BillButton billType="order_invoice" recordId={order.id} tooltip="Download Order Invoice" />
        )}
        <Box sx={{ flexGrow: 1 }} />
        {order.status === 'quotation' && (
          <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending}>
            Confirm Order
          </Button>
        )}
        {isCancellable && (
          <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setCancelDialogOpen(true)}>
            Cancel
          </Button>
        )}
        {isDeliverable && (
          <Button variant="contained" color="secondary" startIcon={<LocalShippingIcon />} onClick={() => setDeliveryDialogOpen(true)}>
            New Delivery
          </Button>
        )}
        {isCloseable && (
          <Button variant="contained" color="success" startIcon={<LockIcon />} onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>
            Close Order
          </Button>
        )}
        {(order.status === 'cancelled' || order.status === 'closed') && (
          <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => duplicateMut.mutate()} disabled={duplicateMut.isPending}>
            Duplicate
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Order Info */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Order Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">Date</Typography><Typography>{order.date}</Typography></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">Party</Typography><Typography>{order.party?.name}</Typography></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">City</Typography><Typography>{order.city || '-'}</Typography></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">Valid Until</Typography><Typography>{order.valid_until || '-'}</Typography></Grid>
            </Grid>
            {order.rejection_reason && (
              <Alert severity="error" sx={{ mt: 2 }}>Cancellation reason: {order.rejection_reason}</Alert>
            )}
            {order.remarks && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{order.remarks}</Typography>
            )}
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Items</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Delivered</TableCell>
                    <TableCell align="right">Returned</TableCell>
                    <TableCell align="right">Pending</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name || productMap.get(item.product_id)?.name}</TableCell>
                      <TableCell align="right">{item.qty}</TableCell>
                      <TableCell>{item.unit?.abbreviation || unitMap.get(item.unit_id)?.abbreviation}</TableCell>
                      <TableCell align="right">{formatINR(item.rate)}</TableCell>
                      <TableCell align="right">{formatINR(item.amount)}</TableCell>
                      <TableCell align="right">{item.delivered_qty}</TableCell>
                      <TableCell align="right">{item.returned_qty}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{item.pending_qty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mt: 2 }}>
              <Typography variant="body2">Subtotal: <strong>{formatINR(order.subtotal)}</strong></Typography>
              {order.discount > 0 && <Typography variant="body2">Discount: <strong>-{formatINR(order.discount)}</strong></Typography>}
              <Typography variant="body1" fontWeight="bold">Total: {formatINR(order.total_amount)}</Typography>
            </Box>
          </Paper>

          {/* Deliveries */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Deliveries</Typography>
            {(!order.deliveries || order.deliveries.length === 0) ? (
              <Typography variant="body2" color="text.secondary">No deliveries yet</Typography>
            ) : (
              order.deliveries.map((delivery) => (
                <Card key={delivery.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ pb: '8px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Typography fontWeight="bold">{delivery.delivery_number}</Typography>
                      <Chip
                        label={delivery.status.replace('_', ' ')}
                        size="small"
                        color={delivery.status === 'delivered' ? 'success' : delivery.status === 'in_transit' ? 'warning' : 'default'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Typography variant="body2" color="text.secondary">{delivery.date}</Typography>
                      {delivery.vehicle_no && <Typography variant="body2" color="text.secondary">| {delivery.vehicle_no}</Typography>}
                      {delivery.driver_name && <Typography variant="body2" color="text.secondary">| {delivery.driver_name}</Typography>}
                      {delivery.transport > 0 && <Typography variant="body2" color="text.secondary">| Transport: {formatINR(delivery.transport)}</Typography>}
                      <Box sx={{ flexGrow: 1 }} />
                      <BillButton billType="delivery_challan" recordId={delivery.id} tooltip="Delivery Challan PDF" />
                      {delivery.status === 'pending' && (
                        <Button size="small" variant="outlined" startIcon={<FlightTakeoffIcon />} onClick={() => transitMut.mutate(delivery.id)} disabled={transitMut.isPending}>
                          In Transit
                        </Button>
                      )}
                      {(delivery.status === 'pending' || delivery.status === 'in_transit') && (
                        <Button size="small" variant="contained" color="success" startIcon={<DoneAllIcon />} onClick={() => deliveredMut.mutate(delivery.id)} disabled={deliveredMut.isPending}>
                          Delivered
                        </Button>
                      )}
                      {delivery.status === 'delivered' && (
                        <Button size="small" variant="outlined" color="error" onClick={() => setCreditNoteDialog({ open: true, delivery })}>
                          Return / Credit Note
                        </Button>
                      )}
                    </Box>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell>Unit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {delivery.delivery_items.map((di) => (
                          <TableRow key={di.id}>
                            <TableCell>{di.product?.name || productMap.get(di.product_id)?.name}</TableCell>
                            <TableCell align="right">{di.qty}</TableCell>
                            <TableCell>{di.unit?.abbreviation || unitMap.get(di.unit_id)?.abbreviation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>

          {/* Credit Notes */}
          {order.order_credit_notes && order.order_credit_notes.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Credit Notes</Typography>
              {order.order_credit_notes.map((cn) => (
                <Card key={cn.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ pb: '8px !important' }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Typography fontWeight="bold">{cn.credit_note_number}</Typography>
                      <Typography variant="body2" color="text.secondary">{cn.date}</Typography>
                      <Typography variant="body2" color="error.main">-{formatINR(cn.total_amount)}</Typography>
                      <BillButton billType="order_credit_note" recordId={cn.id} tooltip="Credit Note PDF" />
                      {cn.reason && <Typography variant="body2" color="text.secondary">| {cn.reason}</Typography>}
                    </Box>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Rate</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cn.credit_note_items.map((cni) => (
                          <TableRow key={cni.id}>
                            <TableCell>{cni.product?.name || productMap.get(cni.product_id)?.name}</TableCell>
                            <TableCell align="right">{cni.qty}</TableCell>
                            <TableCell align="right">{formatINR(cni.rate)}</TableCell>
                            <TableCell align="right">{formatINR(cni.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          )}
        </Grid>

        {/* Right sidebar — Timeline & Financials */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Financials</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Total</Typography>
                <Typography fontWeight="bold">{formatINR(order.total_amount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Received</Typography>
                <Typography color="success.main">{formatINR(order.received)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Balance</Typography>
                <Typography fontWeight="bold" color={order.balance > 0 ? 'error.main' : 'success.main'}>
                  {formatINR(order.balance)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Timeline</Typography>
            {order.order_events && order.order_events.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[...order.order_events].reverse().map((event) => (
                  <Box key={event.id} sx={{ borderLeft: '2px solid', borderColor: 'divider', pl: 2, py: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                      {event.event_type.replace('_', ' ')}
                    </Typography>
                    {event.status_from && event.status_to && (
                      <Typography variant="caption" color="text.secondary">
                        {event.status_from} → {event.status_to}
                      </Typography>
                    )}
                    {event.remarks && (
                      <Typography variant="caption" display="block" color="text.secondary">{event.remarks}</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">{event.date}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No events yet</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for cancellation"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth multiline rows={3} sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Back</Button>
          <Button variant="contained" color="error" onClick={() => cancelMut.mutate(cancelReason)} disabled={cancelMut.isPending}>
            {cancelMut.isPending ? <CircularProgress size={24} /> : 'Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Dialog */}
      {deliveryDialogOpen && order && (
        <DeliveryFormDialog
          open={deliveryDialogOpen}
          onClose={() => setDeliveryDialogOpen(false)}
          order={order}
          onSuccess={() => { setDeliveryDialogOpen(false); invalidate(); }}
        />
      )}

      {/* Credit Note Dialog */}
      {creditNoteDialog.open && creditNoteDialog.delivery && order && (
        <CreditNoteFormDialog
          open={creditNoteDialog.open}
          onClose={() => setCreditNoteDialog({ open: false, delivery: null })}
          order={order}
          delivery={creditNoteDialog.delivery}
          onSuccess={() => { setCreditNoteDialog({ open: false, delivery: null }); invalidate(); }}
        />
      )}
    </Box>
  );
}
