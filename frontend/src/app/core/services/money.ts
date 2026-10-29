export function formatBrl(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}
