export const categoryEmoji = {
  'Groceries': '🛒',
  'Food & Dining': '🍽️',
  'Transport': '🚗',
  'Fuel': '⛽',
  'Shopping': '🛍️',
  'Healthcare': '💊',
  'Utilities': '💡',
  'Entertainment': '🎬',
  'Education': '📚',
  'Other': '📦'
};

export const categoryColors = {
  'Groceries': '#2d9462',
  'Food & Dining': '#ea580c',
  'Transport': '#3b82f6',
  'Fuel': '#eab308',
  'Shopping': '#8b5cf6',
  'Healthcare': '#ef4444',
  'Utilities': '#06b6d4',
  'Entertainment': '#f97316',
  'Education': '#6366f1',
  'Other': '#6b7280'
};

export function getEmoji(category) {
  return categoryEmoji[category] || '📦';
}

export function getAllCategories() {
  return Object.keys(categoryEmoji);
}

export function getCategoryColor(category) {
  if (!category) return '#6b7280';
  const match = Object.keys(categoryColors).find(
    k => k.toLowerCase() === category.toLowerCase()
  );
  return match ? categoryColors[match] : '#6b7280';
}

export default categoryEmoji;

