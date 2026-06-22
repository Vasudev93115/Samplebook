const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: "application/json"
  }
});

// 1. Extract expense details from casual text messages (returns a JSON array of objects)
async function extractExpense(text) {
  try {
    const prompt = `You are a fast, precise expense/income extraction API for India.
Input: A casual text message (English, Hindi, or Hinglish), voice transcription, or OCR text detailing one or more transactions.

Your task: Extract ALL financial entries mentioned and classify them.

RETURN A RAW JSON ARRAY exactly matching this schema:
[
  {
    "amount": number,
    "category": "string (MUST be one of: Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other)",
    "description": "string (max 4 words, English translation of item)",
    "transaction_type": "string ('debit' for expenses/spending/bills, 'credit' for income/salary/added cash/refunds)",
    "confidence": number (0.85 to 1.0 for clear items, below 0.5 for ambiguous)
  }
]

RULES:
- Extract MULTIPLE items if mentioned (e.g. "100 sabzi, 200 doodh" -> two separate objects).
- "transaction_type": Treat naturally phrased additions ("salary", "papa sent 500", "pocket money", "added 200") as 'credit'. All other purchases/spending are 'debit'.
- Amount must be a pure number. Ignore dates or transaction IDs.

Input Text:
${text}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('extractExpense error:', err.message);
    return null;
  }
}

// 2. Multimodal extraction: Direct Image-to-JSON expense using Gemini Vision (returns a JSON array)
async function extractExpenseFromImage(base64Data, mimeType = 'image/jpeg') {
  try {
    const prompt = `You are a premium receipt and UPI payment scanning API for India.
Analyze the attached image (paper receipt, shop bill, or UPI successful screenshot).

Your task: Extract ALL transaction amounts or line items mentioned.

RETURN A RAW JSON ARRAY exactly matching this schema:
[
  {
    "amount": number,
    "category": "string (MUST be one of: Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other)",
    "description": "string (max 4 words, English translation/name of item/vendor)",
    "transaction_type": "string ('debit' for expenses/purchases, 'credit' for income/refunds)",
    "confidence": number (0.85 to 1.0 for clear items, below 0.5 for ambiguous)
  }
]

RULES:
- Extract MULTIPLE items if it's a bill listing multiple products.
- If it's a single UPI transaction screenshot, return one object.
- "transaction_type": Standard bills and payments are 'debit'. Refunds or 'Money Received' UPI screenshots are 'credit'.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('extractExpenseFromImage error:', err.message);
    return null;
  }
}

// 3. Multimodal extraction: Direct Audio-to-JSON expense using Gemini Audio (returns a JSON array)
async function extractExpenseFromAudio(base64Data, mimeType = 'audio/ogg') {
  try {
    const prompt = `You are a premium voice-to-expense API for India.
Listen to the attached audio describing one or more transactions (English, Hindi, or Hinglish).

Your task: Transcribe and extract ALL numerical transactions mentioned.

RETURN A RAW JSON ARRAY exactly matching this schema:
[
  {
    "amount": number,
    "category": "string (MUST be one of: Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other)",
    "description": "string (max 4 words, English translation of item)",
    "transaction_type": "string ('debit' for expenses/spending, 'credit' for income/salary/received money)",
    "confidence": number (0.85 to 1.0 for clear items, below 0.5 for ambiguous)
  }
]

RULES:
- Extract MULTIPLE items if the person mentions several (e.g. "100 auto aur 500 khana").
- "transaction_type": Salary, received cash, or refunds are 'credit'. Standard spending is 'debit'.`;

    const audioPart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType.split(';')[0].trim()
      }
    };

    const result = await model.generateContent([prompt, audioPart]);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('extractExpenseFromAudio error:', err.message);
    return null;
  }
}

module.exports = { extractExpense, extractExpenseFromImage, extractExpenseFromAudio };
