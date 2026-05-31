const axios = require('axios');
require('dotenv').config();

async function extractTextFromImage(imageBase64) {
  try {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;
    const response = await axios.post(url, {
      requests: [{
        image: { content: imageBase64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
      }]
    });
    const text = response.data?.responses?.[0]?.textAnnotations?.[0]?.description || '';
    return text;
  } catch (err) {
    console.error('extractTextFromImage error:', err.message);
    return '';
  }
}

module.exports = { extractTextFromImage };
