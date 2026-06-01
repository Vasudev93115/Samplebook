const { extractExpense } = require('../services/gemini');
const { saveExpense } = require('../services/supabase');

async function handleText(from, text, group, user) {
  try {
    const result = await extractExpense(text);
    if (!result) {
      return { success: false, reason: 'parse_failed' };
    }

    const expensesList = Array.isArray(result) ? result : [result];
    const validExpenses = expensesList.filter(e => e && e.amount > 0 && e.confidence >= 0.5);

    if (validExpenses.length === 0) {
      return { success: false, reason: 'low_confidence' };
    }

    const savedExpenses = [];
    for (const item of validExpenses) {
      const saved = await saveExpense({
        group_id: group.group_id,
        user_id: user.id,
        amount: item.amount,
        currency: group.currency || 'INR',
        category: item.category || 'Other',
        description: item.description || 'Expense',
        input_type: 'text',
        transaction_type: item.transaction_type || 'debit',
        confidence: item.confidence
      });
      if (saved) {
        savedExpenses.push(saved);
      }
    }

    return { success: true, expenses: savedExpenses };
  } catch (err) {
    console.error('handleText error:', err.message);
    return { success: false, reason: 'error' };
  }
}

module.exports = { handleText };
