const { downloadMedia } = require('../services/meta');
const { extractExpenseFromImage } = require('../services/gemini');
const { saveExpense } = require('../services/supabase');

async function handleImage(from, mediaId, group, user) {
  try {
    const base64 = await downloadMedia(mediaId);
    if (!base64) {
      return { success: false, reason: 'download_failed' };
    }

    // Call Gemini Vision to parse the image, identify amounts, and extract structured JSON array
    const result = await extractExpenseFromImage(base64);
    if (!result) {
      return { success: false, reason: 'parse_failed' };
    }

    const expensesList = Array.isArray(result) ? result : [result];
    const validExpenses = expensesList.filter(e => e && e.amount > 0 && e.confidence >= 0.3);

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
        input_type: 'image',
        transaction_type: item.transaction_type || 'debit',
        confidence: item.confidence
      });
      if (saved) {
        savedExpenses.push(saved);
      }
    }

    return { success: true, expenses: savedExpenses };
  } catch (err) {
    console.error('handleImage error:', err.message);
    return { success: false, reason: 'error' };
  }
}

module.exports = { handleImage };
