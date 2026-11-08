// Formats a rupee amount with Indian digit grouping, e.g. 125000 -> "₹1,25,000".
export const formatINR = (amount: number) =>
  `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
