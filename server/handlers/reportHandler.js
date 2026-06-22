const { getMonthlyExpenses } = require('../services/supabase');
const { formatCurrency } = require('../utils/formatCurrency');
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://samplebook-b2c8b.web.app';

const categoryEmoji = {
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

async function handleReport(group, user, currency) {
  try {
    const expenses = await getMonthlyExpenses(group.group_id, user.id);

    if (!expenses || expenses.length === 0) {
      return '📊 No expenses found this month.\nStart logging with: *200 sabzi*';
    }

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const count = expenses.length;

    // Group by category
    const byCategory = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    }

    // Sort by amount descending
    const sorted = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1]);

    const monthName = new Date().toLocaleString('en-US', { month: 'long' });

    let report = `📊 *Your ${monthName} Summary*\n\n`;
    report += `💸 Total Spent: ${formatCurrency(total, currency || 'INR')}\n`;
    report += `🧾 Transactions: ${count}\n\n`;
    report += `📂 *By Category:*\n`;

    for (const [cat, amt] of sorted) {
      const emoji = categoryEmoji[cat] || '📦';
      report += `${emoji} ${cat}: ${formatCurrency(amt, currency || 'INR')}\n`;
    }

    report += `\n📊 *Full Dashboard:* ${DASHBOARD_URL}\n_View detailed charts, export CSV & more!_`;
    return report;
  } catch (err) {
    console.error('handleReport error:', err.message);
    return '⚙️ Could not generate report. Please try again.';
  }
}

module.exports = { handleReport };
