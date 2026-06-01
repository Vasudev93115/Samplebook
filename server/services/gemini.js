const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Helper to robustly extract and parse JSON from Gemini's response
function robustJsonParse(text) {
  try {
    // Look for content between first [ and last ] or first { and last }
    const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON structure found in response");
    }
    const cleanText = match[0];
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Failed to parse robust JSON. Original text:', text, 'Error:', err.message);
    try {
      let responseText = text.replace(/```json\n?/gi, '');
      responseText = responseText.replace(/```\n?/g, '');
      responseText = responseText.trim();
      return JSON.parse(responseText);
    } catch (e2) {
      throw err;
    }
  }
}

// 1. Extract expense details from casual text messages (returns a JSON array of objects)
async function extractExpense(text) {
  try {
    const prompt = `You are a premium expense extraction assistant for India.
The input text you receive can be one of three types:
1. A casual chat message in Hindi, English, or Hinglish listing one or more expenses (e.g. "100 sabzi, 200 doodh, 300 stationary").
2. Raw text transcribed from voice notes containing one or more transactions.
3. Raw OCR text containing transactions.

Your task is to carefully analyze this text, find ALL payment transactions listed/mentioned, identify their amounts, categories, and descriptions.

Return ONLY a valid JSON array of objects. Even if there is only one transaction, return a JSON array with a single object. No markdown, no backticks, no code block wrapping, and no extra explanation. Just raw JSON like this:
[
  {"amount": number, "category": "string", "description": "string", "confidence": number}
]

RULES:
1. Identify MULTIPLE transactions: If the user says "100 sabzi, 200 doodh, 300 stationary", extract THREE separate objects:
   [
     {"amount": 100, "category": "Groceries", "description": "sabzi", "confidence": 0.95},
     {"amount": 200, "category": "Groceries", "description": "doodh", "confidence": 0.95},
     {"amount": 300, "category": "Shopping", "description": "stationary", "confidence": 0.95}
   ]
2. Amount: Must be a number. Look for currency symbols (₹, Rs., INR) or numbers. Ignore transaction IDs, dates, or account numbers.
3. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
4. Description: Write a clear description in English (max 4 words). 
5. Confidence: Set between 0.8 and 1.0 if the amount and purpose are clear. Set below 0.5 if unclear.

EXAMPLES:
- "Paid ₹120 to Ramu Tea Stall and auto rent 80" -> [
    {"amount": 120, "category": "Food & Dining", "description": "Paid to Ramu Tea Stall", "confidence": 0.95},
    {"amount": 80, "category": "Transport", "description": "Auto rent", "confidence": 0.95}
  ]
- "doodh 60 petrol 1000" -> [
    {"amount": 60, "category": "Groceries", "description": "doodh", "confidence": 0.95},
    {"amount": 1000, "category": "Fuel", "description": "petrol", "confidence": 0.95}
  ]

Input Text:
${text}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = robustJsonParse(responseText);
    return parsed;
  } catch (err) {
    console.error('extractExpense error:', err.message);
    return null;
  }
}

// 2. Multimodal extraction: Direct Image-to-JSON expense using Gemini Vision (returns a JSON array)
async function extractExpenseFromImage(base64Data, mimeType = 'image/jpeg') {
  try {
    const prompt = `You are a premium receipt and UPI payment screenshot scanning assistant for India.
Analyze the attached image (which could be a paper receipt, a shop bill listing one or more items, or a mobile payment successful screenshot from Paytm, PhonePe, Google Pay, GPay, BHIM, etc.).

Your task is to locate ALL transaction amounts or line items, identify their amounts, categories, and descriptions.

Return ONLY a valid JSON array of objects. Even if there is only one transaction/item, return a JSON array with a single object. No markdown, no backticks, no code block wrapping, and no extra explanation. Just raw JSON like this:
[
  {"amount": number, "category": "string", "description": "string", "confidence": number}
]

RULES:
1. Parse MULTIPLE transactions: If the image is a paper bill/receipt listing multiple items (e.g. "Bread 40, Milk 60, Apple 150"), extract EACH item as a separate transaction in the array:
   [
     {"amount": 40, "category": "Groceries", "description": "Bread", "confidence": 0.95},
     {"amount": 60, "category": "Groceries", "description": "Milk", "confidence": 0.95},
     {"amount": 150, "category": "Groceries", "description": "Apple", "confidence": 0.95}
   ]
   If it is a single UPI transaction screenshot, return an array with one object matching that transaction.
2. Amount: Must be a number. Ignore transaction IDs, phone numbers, or dates.
3. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
4. Description: Write a clear description in English (max 4 words), e.g. "Paid to [Vendor Name]" or the item name.
5. Confidence: Set between 0.85 and 1.0 if the transaction/item is clear. Set below 0.5 if unclear.

Example output:
[
  {"amount": 800, "category": "Other", "description": "Paid to VASUDEV", "confidence": 0.95}
]`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsed = robustJsonParse(responseText);
    return parsed;
  } catch (err) {
    console.error('extractExpenseFromImage error:', err.message);
    return null;
  }
}

// 3. Multimodal extraction: Direct Audio-to-JSON expense using Gemini Audio (returns a JSON array)
async function extractExpenseFromAudio(base64Data, mimeType = 'audio/ogg') {
  try {
    const prompt = `You are a premium voice-to-expense assistant for India.
Listen to the attached audio recording of a person casually describing one or more expenses (it could be spoken in English, Hindi, Hinglish, or a mix of these languages).

Your task is to listen, transcribe, identify ALL numerical expenses mentioned, describe each, and categorize them.

Return ONLY a valid JSON array of objects. Even if there is only one expense, return a JSON array with a single object. No markdown, no backticks, no code block wrapping, and no extra explanation. Just raw JSON like this:
[
  {"amount": number, "category": "string", "description": "string", "confidence": number}
]

RULES:
1. Identify MULTIPLE transactions: If the person mentions multiple items (e.g., "dost ko 500 diye aur auto ke 100"), extract EACH as a separate transaction in the array:
   [
     {"amount": 500, "category": "Other", "description": "Paid to friend", "confidence": 0.95},
     {"amount": 100, "category": "Transport", "description": "Auto fare", "confidence": 0.95}
   ]
2. Amount: Identify numerical expense amounts.
3. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
4. Description: Write a short description in English (max 4 words).
5. Confidence: Set between 0.85 and 1.0 if the amount and description are clear. Set below 0.5 if unclear.

Example output:
[
  {"amount": 120, "category": "Food & Dining", "description": "Tea and snacks", "confidence": 0.95}
]`;

    const audioPart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType.split(';')[0].trim() // Clean mimeType from potential "codecs=opus" parameters
      }
    };

    const result = await model.generateContent([prompt, audioPart]);
    const responseText = result.response.text();
    const parsed = robustJsonParse(responseText);
    return parsed;
  } catch (err) {
    console.error('extractExpenseFromAudio error:', err.message);
    return null;
  }
}

module.exports = { extractExpense, extractExpenseFromImage, extractExpenseFromAudio };
