const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Helper to robustly extract and parse JSON from Gemini's response
function robustJsonParse(text) {
  try {
    // Look for content between first { and last }
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in response");
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

// 1. Extract expense details from casual text messages
async function extractExpense(text) {
  try {
    const prompt = `You are a premium expense extraction assistant for India.
The input text you receive can be one of three types:
1. A casual chat message in Hindi, English, or Hinglish (e.g. "200 sabzi", "chai 20").
2. Raw OCR text scanned from a paper receipt or shop bill.
3. Raw OCR text scanned from a mobile payment screenshot (specifically Indian UPI apps like Paytm, PhonePe, Google Pay, GPay, BHIM, Yono, etc.).

Your task is to carefully analyze this text, find the payment amount, identify the vendor/receiver, describe the transaction, and categorize it.

Return ONLY a valid JSON object. No markdown, no backticks, no code block wrapping, and no extra explanation. Just raw JSON like this:
{"amount": number, "category": "string", "description": "string", "confidence": number}

RULES:
1. Amount: Must be a number. Look for currency symbols (₹, Rs., INR) or bold large numbers. Ignore transaction IDs, dates, phone numbers, or account numbers.
2. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
3. Description: Write a clear description in English (max 4 words). 
   - E.g. "Paid to [Vendor Name]" for UPI payments, or the primary items bought.
4. Confidence: 
   - Set between 0.8 and 1.0 if the amount and purpose are clear.
   - If it is a UPI screenshot and you successfully locate the payment amount (e.g., "Paid successfully", "Transfer successful", "₹150 to Ramesh") and the vendor name, set confidence above 0.85.
   - If no clear amount is found, set confidence below 0.5.

EXAMPLES:
- "Paid ₹120 to Ramu Tea Stall successfully. Txn ID..." -> {"amount": 120, "category": "Food & Dining", "description": "Paid to Ramu Tea Stall", "confidence": 0.95}
- "PhonePe: Payment of Rs. 450 to Apollo Pharmacy successful." -> {"amount": 450, "category": "Healthcare", "description": "Paid to Apollo Pharmacy", "confidence": 0.95}
- "200 sabzi" -> {"amount": 200, "category": "Groceries", "description": "Vegetables", "confidence": 0.95}
- "Petrol pump bill: Fuel Rs. 1000" -> {"amount": 1000, "category": "Fuel", "description": "Petrol bill", "confidence": 0.95}

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

// 2. Multimodal extraction: Direct Image-to-JSON expense using Gemini Vision
async function extractExpenseFromImage(base64Data, mimeType = 'image/jpeg') {
  try {
    const prompt = `You are a premium receipt and UPI payment screenshot scanning assistant for India.
Analyze the attached image (which could be a paper receipt, a shop bill, or a mobile payment successful screenshot from Paytm, PhonePe, Google Pay, GPay, BHIM, etc.).

Your task is to locate the transaction amount, identify the vendor/receiver, describe the transaction, and categorize the expense.

Reply ONLY with a valid JSON object. No markdown. No backticks. No explanation.
Just raw JSON like this:
{"amount": number, "category": "string", "description": "string", "confidence": number}

RULES:
1. Amount: Look for the paid amount. In UPI screenshots, it is usually a large bold number with a ₹, Rs., or Rs symbol (e.g. ₹800 or ₹50). Ensure you ignore UPI reference IDs, transaction IDs, bank account numbers, or dates.
2. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
3. Description: Write a clear description in English (max 4 words), e.g., "Paid to [Vendor Name]" or the primary items bought.
4. Confidence: Set between 0.85 and 1.0 if the transaction is successful and you successfully locate the amount and vendor. If the payment was failed or unclear, set confidence below 0.5.

Example output:
{"amount": 800, "category": "Other", "description": "Paid to VASUDEV", "confidence": 0.95}`;

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

// 3. Multimodal extraction: Direct Audio-to-JSON expense using Gemini Audio
async function extractExpenseFromAudio(base64Data, mimeType = 'audio/ogg') {
  try {
    const prompt = `You are a premium voice-to-expense assistant for India.
Listen to the attached audio recording of a person casually describing an expense (it could be spoken in English, Hindi, Hinglish, or a mix of these languages).

Your task is to transcribe what they said, extract the payment amount, describe the transaction, and categorize the expense.

Reply ONLY with a valid JSON object. No markdown. No backticks. No explanation.
Just raw JSON like this:
{"amount": number, "category": "string", "description": "string", "confidence": number}

RULES:
1. Amount: Identify the numerical expense amount mentioned in the speech.
2. Category: Must be EXACTLY one of:
   Groceries, Food & Dining, Transport, Fuel, Shopping, Healthcare, Utilities, Entertainment, Education, Other
3. Description: Write a short description in English (max 4 words).
4. Confidence: Set between 0.85 and 1.0 if the amount and description are clear. If you cannot understand the spoken words or no clear amount is found, set confidence below 0.5.

Example output:
{"amount": 120, "category": "Food & Dining", "description": "Tea and snacks", "confidence": 0.95}`;

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
