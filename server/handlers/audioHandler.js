const { downloadMedia } = require('../services/meta');
const { transcribeAudio } = require('../services/groq');
const { extractExpense } = require('../services/gemini');
const { saveExpense } = require('../services/supabase');

async function handleAudio(from, mediaId, mimeType, group, user) {
  try {
    const base64 = await downloadMedia(mediaId);
    if (!base64) {
      return { success: false, reason: 'download_failed' };
    }

    // 1. Transcribe voice note to text using Groq's super-fast Whisper-large-v3 free API
    const transcript = await transcribeAudio(base64);
    if (!transcript || transcript.trim().length === 0) {
      return { success: false, reason: 'transcription_failed' };
    }

    console.log(`[${new Date().toISOString()}] Voice Note Transcript: "${transcript}"`);

    // 2. Extract structured expense JSON from the transcript text using Gemini 2.5 Flash
    const result = await extractExpense(transcript);
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
      input_type: 'audio',
      confidence: result.confidence
    });

    return { success: true, expense: result };
  } catch (err) {
    console.error('handleAudio error:', err.message);
    return { success: false, reason: 'error' };
  }
}

module.exports = { handleAudio };
