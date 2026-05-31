const { extractExpense } = require('../services/gemini');
const { saveExpense } = require('../services/supabase');

async function handleText(from, text, group, user) {
  try {
    const result = await extractExpense(text);
    if (!result) {
      return { success: false, reason: 'parse_failed' };
    }
    if (result.confidence < 0.5) {
      return { success: false, reason: 'low_confidence' };
    }

    await saveExpense({
      group_id: group.group_id,
      user_id: user.id,
      amount: result.amount,
      currency: group.currency || 'INR',
      category: result.category,
      description: result.description,
      input_type: 'text',
      confidence: result.confidence
    });

    return { success: true, expense: result };
  } catch (err) {
    console.error('handleText error:', err.message);
    return { success: false, reason: 'error' };
  }
}

module.exports = { handleText };
