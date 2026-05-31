const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

async function transcribeAudio(base64Data) {
  const tempFilePath = path.join(__dirname, `temp_audio_${Date.now()}.ogg`);
  try {
    // 1. Write base64 audio to a temporary file
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));

    // 2. Prepare FormData
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath));
    form.append('model', 'whisper-large-v3');

    // 3. Make POST request to Groq Whisper API
    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      form,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...form.getHeaders()
        }
      }
    );

    // 4. Return the transcribed text
    const transcript = response.data?.text || '';
    return transcript;
  } catch (err) {
    console.error('transcribeAudio error:', err.response?.data || err.message);
    return '';
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {
      // silent cleanup error
    }
  }
}

module.exports = { transcribeAudio };
