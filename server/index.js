require('dotenv').config();
const express = require('express');
const { getUserByPhone, createUser, getUserGroup, deleteLastExpense } = require('./services/supabase');
const { sendMessage } = require('./services/meta');
const { detectMessageType } = require('./utils/detectType');
const { currencySymbol } = require('./utils/formatCurrency');
const { handleText } = require('./handlers/textHandler');
const { handleImage } = require('./handlers/imageHandler');
const { handleAudio } = require('./handlers/audioHandler');
const { handleReport } = require('./handlers/reportHandler');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

function buildSuccessReply(expense, currency) {
  const sym = currencySymbol[currency] || currency;
  const isCredit = expense.transaction_type === 'credit';
  const prefix = isCredit ? '➕ ' : '✅ ';
  const label = isCredit ? ' Cash-In' : ' Cash-Out';
  
  if (expense.confidence >= 0.7) {
    return `${prefix}${sym}${expense.amount}${label} logged\n📂 ${expense.category} — ${expense.description}\n\nReply *report* for monthly summary`;
  } else {
    return `🤔 Logged ${sym}${expense.amount} as ${expense.category} (${isCredit ? 'Cash-In' : 'Cash-Out'})\nNot 100% sure — does this look right?`;
  }
}

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook message handler
app.post('/webhook', (req, res) => {
  // CRITICAL: Send 200 immediately
  res.sendStatus(200);

  setImmediate(async () => {
    let from = null;
    try {
      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      if (!value?.messages?.length) return;

      const message = value.messages[0];
      const contacts = value.contacts;
      from = message.from;
      const msgType = message.type;
      const text = message.text?.body || '';
      const mediaId = message.image?.id || message.audio?.id || null;
      const mimeType = message.image?.mime_type || message.audio?.mime_type || null;
      const name = contacts?.[0]?.profile?.name || 'Friend';

      console.log(`[${new Date().toISOString()}] From: ${from} Type: ${msgType} Text: ${text}`);

      // Get or create user
      let user = await getUserByPhone(from);
      if (!user) {
        user = await createUser(from, name);
      }
      if (!user) {
        console.error('Failed to get/create user for:', from);
        return;
      }

      // Get user's group
      const group = await getUserGroup(user.id);
      if (!group) {
        await sendMessage(from,
          '👋 Welcome to SampleBook!\n\n' +
          'You need to join a group first.\n' +
          'Ask your admin to invite you.\n\n' +
          'Reply *help* for instructions.');
        return;
      }

      // Detect what they sent
      const detected = detectMessageType(text, msgType);
      let reply = '';

      if (detected === 'report') {
        reply = await handleReport(group, user, group.currency);
      }
      else if (detected === 'delete') {
        const result = await deleteLastExpense(user.id);
        if (result.success) {
          const sym = currencySymbol[group.currency] || group.currency || '₹';
          reply = `🗑️ *Expense Deleted Successfully!*\n\n` +
            `Removed: *${sym}${result.expense.amount}* for *${result.expense.category}* (${result.expense.description})`;
        } else if (result.reason === 'no_expense') {
          reply = '❓ *No recent expenses found to delete.*';
        } else {
          reply = '⚠️ *Failed to delete your recent expense. Please try again.*';
        }
      }
      else if (detected === 'help') {
        reply = '🤖 *SampleBook Help*\n\n' +
          '*Log expenses by sending:*\n' +
          '💬 Text: *200 sabzi* or *500 petrol*\n' +
          '📷 Photo: receipt or bill\n' +
          '📱 Screenshot: UPI payment\n\n' +
          '*Commands:*\n' +
          '• *report* — monthly summary\n' +
          '• *delete* — delete last entry\n' +
          '• *help* — this message';
      }
      else if (detected === 'image') {
        await sendMessage(from, '⏳ Scanning your receipt...');
        const result = await handleImage(from, mediaId, group, user);
        if (result.success && result.expenses && result.expenses.length > 0) {
          for (const exp of result.expenses) {
            const successReply = buildSuccessReply(exp, group.currency);
            await sendMessage(from, successReply);
          }
          reply = '';
        } else {
          reply = '❓ Couldn\'t read that image.\nTry a clearer photo or type the amount:\n*200 sabzi*';
        }
      }
      else if (detected === 'audio') {
        await sendMessage(from, '⏳ Listening to your voice note...');
        const result = await handleAudio(from, mediaId, mimeType, group, user);
        if (result.success && result.expenses && result.expenses.length > 0) {
          for (const exp of result.expenses) {
            const successReply = buildSuccessReply(exp, group.currency);
            await sendMessage(from, successReply);
          }
          reply = '';
        } else {
          reply = '❓ Couldn\'t understand that audio.\nTry speaking clearly or typing the amount:\n*200 sabzi*';
        }
      }
      else if (detected === 'text') {
        const result = await handleText(from, text, group, user);
        if (result.success && result.expenses && result.expenses.length > 0) {
          for (const exp of result.expenses) {
            const successReply = buildSuccessReply(exp, group.currency);
            await sendMessage(from, successReply);
          }
          reply = '';
        } else {
          reply = '❓ I didn\'t understand that.\n\n' +
            'Try sending:\n' +
            '• *200 sabzi*\n' +
            '• *150 auto*\n' +
            '• *500 petrol*\n\n' +
            'Reply *help* for more tips.';
        }
      }
      else {
        reply = '❓ I didn\'t understand that.\nReply *help* for instructions.';
      }

      if (reply) await sendMessage(from, reply);

    } catch (error) {
      console.error('Webhook error:', error.message);
      if (from) {
        try {
          await sendMessage(from, '⚙️ Something went wrong. Please try again.');
        } catch (e) {
          // silent
        }
      }
    }
  });
});

// Direct receipt/screenshot scanning endpoint for Dashboard AddExpense
const { extractExpenseFromImage, extractExpenseFromAudio } = require('./services/gemini');
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Missing image data (base64)' });
    }
    
    console.log(`[${new Date().toISOString()}] Manual API Receipt Scan Requested`);
    
    // Call Gemini Vision
    const result = await extractExpenseFromImage(image, mimeType || 'image/jpeg');
    if (!result) {
      return res.status(500).json({ error: 'Failed to extract expense details from image' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('API /api/scan-receipt error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Direct voice note scanning endpoint for Dashboard AddExpense
app.post('/api/scan-audio', async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Missing audio data (base64)' });
    }
    
    console.log(`[${new Date().toISOString()}] Manual API Voice Note Scan Requested`);
    
    // Call Gemini Multimodal Audio
    const result = await extractExpenseFromAudio(audio, mimeType || 'audio/webm');
    if (!result) {
      return res.status(500).json({ error: 'Failed to extract expense details from audio' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('API /api/scan-audio error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Custom SMS Webhook: Redirects Supabase OTP to your WhatsApp Bot for 100% free deliveries!
app.post('/api/supabase-sms-webhook', async (req, res) => {
  try {
    console.log(`\n========== INCOMING SMS WEBHOOK ==========`);
    console.log(`[WEBHOOK] Raw payload:`, JSON.stringify(req.body, null, 2));
    console.log(`==========================================\n`);

    // Extract phone and OTP from various Supabase hook payload formats
    let phone = null;
    let otp = null;

    // Format 1: Supabase "Send SMS" Database Hook (most common)
    // Payload: { user: { phone: "+919311501715" }, sms: { otp: "123456" } }
    if (req.body.user?.phone && req.body.sms?.otp) {
      phone = req.body.user.phone;
      otp = req.body.sms.otp;
      console.log(`[WEBHOOK] Detected Supabase DB Hook format (user.phone + sms.otp)`);
    }
    // Format 2: Supabase HTTP Hook format
    // Payload: { phone: "+919311501715", otp: "123456" }
    else if (req.body.phone && req.body.otp) {
      phone = req.body.phone;
      otp = req.body.otp;
      console.log(`[WEBHOOK] Detected direct phone+otp format`);
    }
    // Format 3: Supabase sends raw message text
    // Payload: { phone: "+919311501715", message: "Your OTP is 123456" }
    else if (req.body.phone && req.body.message) {
      phone = req.body.phone;
      // Extract numeric OTP from message string
      const otpMatch = req.body.message.match(/\b(\d{6})\b/);
      otp = otpMatch ? otpMatch[1] : req.body.message;
      console.log(`[WEBHOOK] Detected phone+message format, extracted OTP: ${otp}`);
    }
    // Format 4: Nested user.phone with top-level message
    else if (req.body.user?.phone && req.body.message) {
      phone = req.body.user.phone;
      const otpMatch = req.body.message.match(/\b(\d{6})\b/);
      otp = otpMatch ? otpMatch[1] : req.body.message;
      console.log(`[WEBHOOK] Detected user.phone+message format, extracted OTP: ${otp}`);
    }

    if (!phone || !otp) {
      console.warn('[WEBHOOK] ❌ Could not extract phone/OTP from payload:', req.body);
      return res.status(400).json({ error: 'Missing phone number or OTP in payload' });
    }
    
    // Normalize phone: strip '+' (Meta API wants "919311501715" not "+919311501715")
    const cleanPhone = phone.replace(/^\+/, '').replace(/\s/g, '').trim();
    
    console.log(`[WEBHOOK] ✅ Phone: ${cleanPhone} | OTP: ${otp}`);
    console.log(`🔑 [DEVELOPER MODE] OTP for ${cleanPhone}: ${otp}`);
    
    // Format the message with a premium security branding
    const formattedMessage = `🤖 *SampleBook Security Code*\n\n` +
      `Your verification code is *${otp}*.\n\n` +
      `Enter this code in your browser to log in.\n\n` +
      `💬 *Tip:* You can start logging cash expenses right here in this chat!`;
      
    await sendMessage(cleanPhone, formattedMessage);
    
    // Supabase expects a 200 response to confirm the hook succeeded
    res.status(200).json({});
  } catch (err) {
    console.error('[WEBHOOK] ❌ WhatsApp SMS Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Direct welcome message endpoint called after successful dashboard profile setup
app.post('/api/welcome-user', async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ error: 'Missing phone or name parameter' });
    }
    
    console.log(`[${new Date().toISOString()}] Dispatching Welcome WhatsApp message to ${phone}`);
    
    const welcomeMessage = `🎉 *Welcome to SampleBook, ${name}!* \n\n` +
      `Your account is fully set up!\n` +
      `🔗 *Access your dashboard anytime:* https://samplebook-b2c8b.web.app/\n\n` +
      `*How to track cash expenses in this chat:*\n` +
      `💬 *Text:* Send *"200 petrol"* or *"150 auto"*\n` +
      `📷 *Photo:* Snap and send a shop receipt or UPI screenshot\n` +
      `🎙️ *Voice Note:* Send a voice note describing your expense!\n\n` +
      `Reply *help* at any time to view all options. Let's start tracking! 🚀`;
      
    await sendMessage(phone, welcomeMessage);
    res.status(200).json({});
  } catch (err) {
    console.error('Welcome WhatsApp API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ensure user exists in public.users (bypasses RLS with service role key)
// Called by the frontend before creating/joining a group
app.post('/api/ensure-user', async (req, res) => {
  try {
    const { id, phone, name } = req.body;
    if (!id || !phone) {
      return res.status(400).json({ error: 'Missing id or phone' });
    }

    const cleanPhone = phone.replace(/^\+/, '');
    console.log(`[${new Date().toISOString()}] Ensuring user exists: ${id} / ${cleanPhone}`);

    const { supabase } = require('./services/supabase');

    // 1. Check if user exists by ID
    let { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (existingUser) {
      // User exists. Update name/phone only if they are missing or currently 'Friend'
      const nameNeedsUpdate = (existingUser.name === 'Friend' || !existingUser.name) && name && name !== 'Friend';
      const phoneNeedsUpdate = !existingUser.phone && cleanPhone;

      if (nameNeedsUpdate || phoneNeedsUpdate) {
        const updateData = {};
        if (nameNeedsUpdate) updateData.name = name;
        if (phoneNeedsUpdate) updateData.phone = cleanPhone;

        const { data: updatedUser, error: updateErr } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (!updateErr && updatedUser) {
          return res.json({ user: updatedUser });
        }
      }
      return res.json({ user: existingUser });
    }

    // 2. Check if user exists by phone
    let { data: existingUserPhone } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingUserPhone) {
      const oldId = existingUserPhone.id;
      const finalName = (name && name !== 'Friend') ? name : (existingUserPhone.name || 'Friend');

      if (oldId !== id) {
        console.log(`[ENSURE-USER] Migrating old user ID ${oldId} to new authenticated ID ${id}`);

        // 1. Insert new user profile with new authenticated ID first
        const { error: insertNewErr } = await supabase
          .from('users')
          .insert({
            id: id,
            phone: cleanPhone,
            name: finalName,
            avatar_url: existingUserPhone.avatar_url
          });

        if (insertNewErr) {
          console.error('[ENSURE-USER] Error inserting new user row:', insertNewErr.message);
        }

        // 2. Update group_members references
        const { error: gmErr } = await supabase
          .from('group_members')
          .update({ user_id: id })
          .eq('user_id', oldId);
        if (gmErr) {
          console.error('[ENSURE-USER] Error migrating group_members:', gmErr.message);
        }

        // 3. Update expenses references
        const { error: expErr } = await supabase
          .from('expenses')
          .update({ user_id: id })
          .eq('user_id', oldId);
        if (expErr) {
          console.error('[ENSURE-USER] Error migrating expenses:', expErr.message);
        }

        // 4. Delete the old user row
        const { error: delErr } = await supabase
          .from('users')
          .delete()
          .eq('id', oldId);
        if (delErr) {
          console.error('[ENSURE-USER] Error deleting old user row:', delErr.message);
        }
      } else {
        // Just update name if it changed
        const nameNeedsUpdate = (existingUserPhone.name === 'Friend' || !existingUserPhone.name) && name && name !== 'Friend';
        if (nameNeedsUpdate) {
          await supabase
            .from('users')
            .update({ name: finalName })
            .eq('id', id);
        }
      }

      // Fetch the final merged user record
      const { data: finalUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      return res.json({ user: finalUser || { id, phone: cleanPhone, name: finalName } });
    }

    // 3. User does not exist. Insert a new record.
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        id,
        phone: cleanPhone,
        name: name || 'Friend'
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting new user:', insertErr.message);
      return res.status(500).json({ error: insertErr.message });
    }

    res.json({ user: newUser });
  } catch (err) {
    console.error('ensure-user error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'SampleBook', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SampleBook server running on port ${PORT}`);
});
