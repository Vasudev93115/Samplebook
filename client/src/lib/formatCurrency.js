export function formatCurrency(amount, currency = 'INR') {
  if (currency === 'INR') {
    const num = Number(amount);
    const formatted = num.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
    return '₹' + formatted;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return currency + ' ' + amount;
  }
}

export const currencySymbol = {
  INR: '₹', USD: '$', GBP: '£', EUR: '€',
  AED: 'AED', SGD: 'S$'
};
