const { downloadMedia } = require('../services/meta');
const { extractExpenseFromImage } = require('../services/gemini');
const { saveExpense } = require('../services/supabase');

async function handleImage(from, mediaId, group, user) {
  try {
    const base64 = await downloadMedia(mediaId);
    if (!base64) {
      return { success: false, reason: 'download_failed' };
    }

    // Call Gemini Vision directly to parse the image, identify amounts, and extract structured JSON!
    const result = await extractExpenseFromImage(base64);
    if (!result || result.confidence < 0.5) {
      return { success: false, reason: 'parse_failed' };
    }

    await saveExpense({
      group_id: group.group_id,
      user_id: user.id,
      amount: result.amount,
      currency: group.currency || 'INR',
      category: result.category,
      description: result.description,
      input_type: 'image',
      confidence: result.confidence
    });

    return { success: true, expense: result };
  } catch (err) {
    console.error('handleImage error:', err.message);
    return { success: false, reason: 'error' };
  }
}

module.exports = { handleImage };
