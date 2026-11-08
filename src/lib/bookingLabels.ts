import type { BookingSource, BookingStatus, PaymentStatus } from '../types';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  enquiry: 'Enquiry',
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Part paid',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const SOURCE_LABEL: Record<BookingSource, string> = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
  walk_in: 'Walk-in',
  other: 'Other',
};

/** Badge colours for booking statuses (Badge component variants). */
export const BOOKING_STATUS_VARIANT: Record<BookingStatus, 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  enquiry: 'info',
  awaiting_payment: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};
