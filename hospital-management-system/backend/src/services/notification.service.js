const axios = require('axios');

/**
 * Notification service (Module 1/8/10)
 *
 * Goal: NEVER crash the main business flow.
 * - If API keys missing => return { ok:false, reason:'missing_config' }
 * - If network/provider errors => return { ok:false, reason:'provider_error' }
 * - Caller should treat these as best-effort and continue.
 */

const DEFAULT_TIMEOUT_MS = 8000;

function normalizeChannels(channels) {
  // Expected shapes supported:
  // 1) { email: 'x@y.com' }
  // 2) { sms: '+91...' }
  // 3) { channels: { email, sms } }
  if (!channels || typeof channels !== 'object') return {};

  if (channels.channels && typeof channels.channels === 'object') {
    return channels.channels;
  }
  return channels;
}

async function sendEmailBrevo({ to, subject, html }) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY || null;

  if (!BREVO_API_KEY) {
    return { ok: false, reason: 'missing_config', channel: 'email' };
  }
  if (!to) {
    return { ok: false, reason: 'missing_to', channel: 'email' };
  }

  try {
    // Brevo REST API
    const url = 'https://api.brevo.com/v3/smtp/email';

    await axios.post(
      url,
      {
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'MediFlow',
          email: process.env.BREVO_SENDER_EMAIL || to, // fallback to avoid crash
        },
        to: [{ email: to }],
        subject: subject || 'Prescription Shared',
        html: html || '<p>Your prescription is ready.</p>',
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: DEFAULT_TIMEOUT_MS,
      }
    );

    return { ok: true, channel: 'email' };
  } catch (err) {
    return { ok: false, reason: 'provider_error', channel: 'email' };
  }
}

async function sendSmsFast2SMS({ to, message }) {
  const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || null;

  if (!FAST2SMS_API_KEY) {
    return { ok: false, reason: 'missing_config', channel: 'sms' };
  }
  if (!to) {
    return { ok: false, reason: 'missing_to', channel: 'sms' };
  }

  // Fast2SMS requires query params.
  // Documentation varies; this is a safe best-effort implementation.
  try {
    const url = 'https://www.fast2sms.com/api/sendSMS';

    await axios.get(url, {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: 'otp',
        // Message as plain text
        message: message || 'Your prescription is ready.',
        numbers: to,
      },
      timeout: DEFAULT_TIMEOUT_MS,
    });

    return { ok: true, channel: 'sms' };
  } catch (err) {
    return { ok: false, reason: 'provider_error', channel: 'sms' };
  }
}

async function sharePrescriptionNotifications({ prescription, channels }) {
  // Best-effort: return summary but never throw.
  const normalized = normalizeChannels(channels);

  const result = {
    ok: true,
    email: { ok: null },
    sms: { ok: null },
  };

  try {
    const toEmail = normalized.email || normalized.toEmail || null;
    const toSms = normalized.sms || normalized.toSms || null;

    const prescriptionNumber = prescription?.prescriptionNumber || 'Prescription';

    const emailHtml = `
      <p>Hello,</p>
      <p>Your <b>${prescriptionNumber}</b> prescription has been shared with you.</p>
      <p>Please login to the portal to view/download the PDF.</p>
    `;

    const smsMessage = `Your ${prescriptionNumber} prescription is ready. Please check the portal/app.`;

    const [emailRes, smsRes] = await Promise.all([
      toEmail
        ? sendEmailBrevo({
            to: toEmail,
            subject: `Prescription Shared: ${prescriptionNumber}`,
            html: emailHtml,
          })
        : Promise.resolve({ ok: false, reason: 'missing_to', channel: 'email' }),

      toSms
        ? sendSmsFast2SMS({
            to: toSms,
            message: smsMessage,
          })
        : Promise.resolve({ ok: false, reason: 'missing_to', channel: 'sms' }),
    ]);

    result.email = emailRes;
    result.sms = smsRes;

    // overall ok only if at least one channel succeeded
    result.ok = Boolean(emailRes?.ok || smsRes?.ok);
    return result;
  } catch (err) {
    result.ok = false;
    return result;
  }
}

module.exports = {
  sharePrescriptionNotifications,
};

