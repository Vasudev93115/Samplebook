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
    const prompt = `You are a premium expense and income extraction assistant for India.
The input text you receive can be one of three types:
1. A casual chat message in Hindi, English, or Hinglish listing one or more entries (e.g. "100 sabzi, 200 doodh, 300 stationary").
2. Raw text transcribed from voice notes containing one or more transactions.
3. Raw OCR text containing transactions.

Your task is to carefully analyze this text, find ALL entries (spending or added cash) listed/mentioned, identify their amounts, categories, descriptions, and whether they are Debit (spending/expense) or Credit (income/added cash).

Return ONLY a valid JSON array of objects. Even if there is only one transaction, return a JSON array with a single object. No markdown, no backticks, no code block wrapping, and no extra explanation. Just raw JSON like this:
[
  {"amount": number, "category": "string", "description": "string", "transaction_type": "string", "confidence": number}
]

RULES:
1. Identify MULTIPLE transactions: If the user says "100 sabzi, 200 doodh, 300 stationary", extract THREE separate objects:
   [
     {"amount": 100, "category": "Groceries", "description": "sabzi", "transaction_type": "debit", "confidence": 0.95},
     {"amount": 200, "category": "Groceries", "description": "doodh", "transaction_type": "debit", "confidence": 0.95},
     {"amount": 300, "category": "Shopping", "description": "stationary", "transaction_type": "debit", "confidence": 0.95}
   ]
2. Amount: Must be a number. Look for currency symbols (₹, Rs., INR) or numbers. Ignore transaction IDs, dates, or account numbers.
3. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
4. Description: Write a clear description in English (max 4 words). 
5. transaction_type: Must be EXACTLY 'debit' (for expenses, spending, bills, cash-out) or 'credit' (for income, salary, added cash, money received, cash-in). Classify natural income statements (e.g. "Salary 20000", "Papa sent 1000", "Got 500 pocket money", "Added cash 2000") as "credit". Standard purchases default to "debit".
6. Confidence: Set between 0.85 and 1.0 for both debit (spending/bills) and credit (added cash/income) transactions if the amount and description are clearly mentioned. Set below 0.5 only if highly ambiguous.

EXAMPLES:
- "250 petrol scooty 100 sabzi" -> [
    {"amount": 250, "category": "Fuel", "description": "Scooty petrol", "transaction_type": "debit", "confidence": 0.95},
    {"amount": 100, "category": "Groceries", "description": "sabzi", "transaction_type": "debit", "confidence": 0.95}
  ]
- "scooty me 250 ka petrol dalwaya aur 100 ki sabzi li" -> [
    {"amount": 250, "category": "Fuel", "description": "Scooty petrol", "transaction_type": "debit", "confidence": 0.95},
    {"amount": 100, "category": "Groceries", "description": "sabzi", "transaction_type": "debit", "confidence": 0.95}
  ]
- "Paid ₹120 to Ramu Tea Stall and salary received 25000" -> [
    {"amount": 120, "category": "Food & Dining", "description": "Paid to Ramu Tea Stall", "transaction_type": "debit", "confidence": 0.95},
    {"amount": 25000, "category": "Other", "description": "Salary received", "transaction_type": "credit", "confidence": 0.95}
  ]
- "doodh 60 and pocket money 1000" -> [
    {"amount": 60, "category": "Groceries", "description": "doodh", "transaction_type": "debit", "confidence": 0.95},
    {"amount": 1000, "category": "Other", "description": "Pocket money", "transaction_type": "credit", "confidence": 0.95}
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

Your task is to locate ALL transaction amounts or line items, identify their amounts, categories, descriptions, and whether they are Debit (spending/expense) or Credit (income/added cash).

Return ONLY a valid JSON array of objects. Even if there is only one transaction/item, return a JSON array with a single object. No markdown, no backticks, no code block wrapping, and no extra explanation. Just raw JSON like this:
[
  {"amount": number, "category": "string", "description": "string", "transaction_type": "string", "confidence": number}
]

RULES:
1. Parse MULTIPLE transactions: If the image is a paper bill/receipt listing multiple items (e.g. "Bread 40, Milk 60, Apple 150"), extract EACH item as a separate transaction in the array:
   [
     {"amount": 40, "category": "Groceries", "description": "Bread", "transaction_type": "debit", "confidence": 0.95},
     {"amount": 60, "category": "Groceries", "description": "Milk", "transaction_type": "debit", "confidence": 0.95},
     {"amount": 150, "category": "Groceries", "description": "Apple", "transaction_type": "debit", "confidence": 0.95}
   ]
   If it is a single UPI transaction screenshot, return an array with one object matching that transaction.
2. Amount: Must be a number. Ignore transaction IDs, phone numbers, or dates.
3. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
4. Description: Write a clear description in English (max 4 words), e.g. "Paid to [Vendor Name]" or the item name.
5. transaction_type: Must be EXACTLY 'debit' (for expenses, spending, bills) or 'credit' (for income, refunds, salary, added cash). TCG refunds or UPI credit/received alerts should be logged as 'credit'. Standard shopping bills default to 'debit'.
6. Confidence: Set between 0.85 and 1.0 if the transaction/item is clear. Set below 0.5 if unclear.

Example output:
[
  {"amount": 800, "category": "Other", "description": "Paid to VASUDEV", "transaction_type": "debit", "confidence": 0.95}
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
Listen to the attached audio recording of a person casually describing one or more transactions (it could be spoken in English, Hindi, Hinglish, or a mix of these languages).

Your task is to listen, transcribe, identify ALL numerical transactions mentioned, identify their amount, category, description, and whether they are Debit (spending/expense) or Credit (income/added cash).

Return ONLY a valid JSON array of objects. Even if there is only one expense, return a JSON array with a single object. No markdown, no backticks, no code block wrapping, and no extra explanation. Just raw JSON like this:
[
  {"amount": number, "category": "string", "description": "string", "transaction_type": "string", "confidence": number}
]

RULES:
1. Identify MULTIPLE transactions: If the person mentions multiple items (e.g., "salary aayi 10000 aur auto ke 100 diye"), extract EACH as a separate transaction in the array:
   [
     {"amount": 10000, "category": "Other", "description": "Salary credited", "transaction_type": "credit", "confidence": 0.95},
     {"amount": 100, "category": "Transport", "description": "Auto fare", "transaction_type": "debit", "confidence": 0.95}
   ]
2. Amount: Identify numerical expense or income amounts.
3. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
4. Description: Write a short description in English (max 4 words).
5. transaction_type: Must be EXACTLY 'debit' (for expenses, spending, bills) or 'credit' (for income, salary, added cash, money received). Phrases indicating cash-in, salary credit, pocket money, or refunds are 'credit'. Standard spending is 'debit'.
6. Confidence: Set between 0.85 and 1.0 if the amount and description are clear. Set below 0.5 if unclear.

Example output:
[
  {"amount": 120, "category": "Food & Dining", "description": "Tea and snacks", "transaction_type": "debit", "confidence": 0.95}
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
