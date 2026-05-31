const axios = require('axios');
require('dotenv').config();

async function sendMessage(to, text) {
  try {
    const cleanTo = to.replace(/\+/g, '').replace(/\s/g, '').trim();
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds strict timeout to prevent thread hanging
      }
    );
    console.log(`[META] ✅ Message sent successfully to ${cleanTo}`);
  } catch (err) {
    console.error(`[META] ❌ sendMessage FAILED for ${to}:`);
    console.error(`[META]   Status: ${err.response?.status}`);
    console.error(`[META]   Data:`, JSON.stringify(err.response?.data, null, 2));
    console.error(`[META]   Message: ${err.message}`);
  }
}

async function downloadMedia(mediaId) {
  try {
    // Step 1: Get media URL
    const metaResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
        }
      }
    );
    const mediaUrl = metaResponse.data.url;

    // Step 2: Download the file
    const fileResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
      },
      responseType: 'arraybuffer'
    });

    const base64 = Buffer.from(fileResponse.data).toString('base64');
    return base64;
  } catch (err) {
    console.error('downloadMedia error:', err.message);
    return null;
  }
}

module.exports = { sendMessage, downloadMedia };
