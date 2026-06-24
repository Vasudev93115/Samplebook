const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3.1-flash-lite',
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
    "description": "string (max 4 words, English translation/name of item/service)",
    "transaction_type": "string ('debit' for expenses/spending/bills, 'credit' for income/salary/added cash/refunds)",
    "confidence": number (0.85 to 1.0 for any clear transaction, below 0.5 for completely ambiguous text)
  }
]

RULES:
- MULTILINGUAL & SLANG SUPPORT: Recognize Hindi, English, and Hinglish (Hindi written in English alphabet, e.g. "kaichi dhaar", "puncture", "sabji", "doodh", "dhobi", "mali").
- LOCAL SERVICES & INFORMAL LABOUR: Recognize local services, repairs, sharpening, cleaning, tipping, tailoring, and street vendors as valid expenses (e.g. "50 kaichi dhaar" -> Scissors sharpening, "100 puncture repair" -> Puncture repair).
- CATEGORIZATION: Map items to the most logical category:
  * "Groceries": milk, vegetables, sabji, doodh, rashan, fruit, meat.
  * "Food & Dining": restaurant, cafe, tea/chai, lunch, dinner, snacks.
  * "Transport": auto, taxi, metro, bus, cab, train, travel.
  * "Fuel": petrol, diesel, gas.
  * "Shopping": clothes, shoes, electronics, items purchased.
  * "Utilities": rent, electricity bill, mobile recharge, internet, maid salary, water bill.
  * "Other": any local or specialized service (like scissors sharpening/kaichi dhaar, puncture repair, ironing/press, tailor, gardener/mali, etc.) that does not fit neatly in other categories.
- TRANSACTION TYPE: Treat naturally phrased additions ("salary", "papa sent 500", "pocket money", "added 200", "received 100") as 'credit'. Purchases, bills, or services paid are 'debit'.
- CONFIDENCE: Assign a high confidence score (0.90 to 1.0) for any entry containing a clear amount and good/service name, even if phrased informally or in Hinglish. Assign a low confidence score (<0.3) or return empty array [] ONLY if there is no amount or if the text is a greeting, question, or completely unrelated message.
- Amount must be a pure number. Ignore dates, times, or transaction IDs.

EXAMPLES:
1. Input: "50 kaichi dhaar"
   Output: [{"amount": 50, "category": "Other", "description": "Scissors sharpening", "transaction_type": "debit", "confidence": 0.95}]
2. Input: "50 scissors sharpening"
   Output: [{"amount": 50, "category": "Other", "description": "Scissors sharpening", "transaction_type": "debit", "confidence": 0.95}]
3. Input: "120 sabzi aur 60 ki bread"
   Output: [
     {"amount": 120, "category": "Groceries", "description": "Vegetables", "transaction_type": "debit", "confidence": 0.95},
     {"amount": 60, "category": "Groceries", "description": "Bread", "transaction_type": "debit", "confidence": 0.95}
   ]
4. Input: "salary account me aayi 25000"
   Output: [{"amount": 25000, "category": "Other", "description": "Salary received", "transaction_type": "credit", "confidence": 0.98}]
5. Input: "hello how are you"
   Output: []

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
    "description": "string (max 4 words, English translation/name of item/service)",
    "transaction_type": "string ('debit' for expenses/spending, 'credit' for income/salary/received money)",
    "confidence": number (0.85 to 1.0 for clear items, below 0.5 for ambiguous)
  }
]

RULES:
- MULTILINGUAL & SLANG SUPPORT: Recognize Hindi, English, and Hinglish (Hindi written in English alphabet, e.g. "kaichi dhaar", "puncture", "sabji", "doodh", "dhobi", "mali").
- LOCAL SERVICES & INFORMAL LABOUR: Recognize local services, repairs, sharpening, cleaning, tipping, tailoring, and street vendors as valid expenses (e.g. "50 kaichi dhaar" -> Scissors sharpening, "100 puncture repair" -> Puncture repair).
- CATEGORIZATION: Map items to the most logical category:
  * "Groceries": milk, vegetables, sabji, doodh, rashan, fruit, meat.
  * "Food & Dining": restaurant, cafe, tea/chai, lunch, dinner, snacks.
  * "Transport": auto, taxi, metro, bus, cab, train, travel.
  * "Fuel": petrol, diesel, gas.
  * "Shopping": clothes, shoes, electronics, items purchased.
  * "Utilities": rent, electricity bill, mobile recharge, internet, maid salary, water bill.
  * "Other": any local or specialized service (like scissors sharpening/kaichi dhaar, puncture repair, ironing/press, tailor, gardener/mali, etc.) that does not fit neatly in other categories.
- TRANSACTION TYPE: Treat naturally phrased additions ("salary", "papa sent 500", "pocket money", "added 200", "received 100") as 'credit'. Purchases, bills, or services paid are 'debit'.
- CONFIDENCE: Assign a high confidence score (0.90 to 1.0) for any entry containing a clear amount and good/service name, even if phrased informally or in Hinglish. Assign a low confidence score (<0.3) or return empty array [] ONLY if there is no amount or if the text is a greeting, question, or completely unrelated message.
- Amount must be a pure number. Ignore dates, times, or transaction IDs.`;

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
