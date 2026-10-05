export function formatCurrency(amount: number, currency = 'PHP'): string {
  const code = /^[A-Z]{3}$/i.test(currency.trim()) ? currency.trim().toUpperCase() : 'PHP';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return code + ' ' + Number(amount || 0).toLocaleString();
  }
}

export function formatPHP(amount: number): string {
  return formatCurrency(amount, 'PHP');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-PH').format(num);
}

export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
