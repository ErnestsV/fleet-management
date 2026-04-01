function normalizeDateInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T12:00:00`;
  }

  return value;
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(normalizeDateInput(value));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'No data';
  }

  const date = new Date(normalizeDateInput(value));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-GB');
}

export function formatNumber(value: number | null | undefined, unit?: string) {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  const formatted = new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(value);

  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatCurrency(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount === null || amount === undefined) {
    return 'Not set';
  }

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? 'EUR'}`;
  }
}
