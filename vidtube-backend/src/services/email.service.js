import apiError from '../utils/apiError.js';
import { logError, logWarn } from '../utils/logger.js';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const getProvider = () =>
  String(process.env.EMAIL_PROVIDER || '')
    .trim()
    .toLowerCase();

const getSender = () => ({
  name: process.env.MAIL_FROM_NAME || 'VidTube',
  email: process.env.MAIL_FROM_EMAIL || '',
});

const isBrevoConfigured = () =>
  Boolean(process.env.BREVO_API_KEY && getSender().email);

export const sendEmail = async ({
  to,
  toName,
  subject,
  htmlContent,
  textContent,
}) => {
  const provider = getProvider();

  if (!provider) {
    return {
      skipped: true,
      reason: 'provider-not-configured',
    };
  }

  if (provider !== 'brevo') {
    throw new apiError(500, `Unsupported email provider: ${provider}`);
  }

  if (!isBrevoConfigured()) {
    return {
      skipped: true,
      reason: 'provider-misconfigured',
    };
  }

  if (typeof fetch !== 'function') {
    throw new apiError(500, 'Global fetch API is unavailable in this runtime');
  }

  const sender = getSender();

  const payload = {
    sender,
    to: [
      {
        email: to,
        ...(toName ? { name: toName } : {}),
      },
    ],
    subject,
    htmlContent,
    ...(textContent ? { textContent } : {}),
  };

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const rawBody = await response.text();
      logError('Brevo API request failed', null, {
        status: response.status,
        body: rawBody,
      });
      throw new apiError(502, 'Email delivery failed');
    }

    const data = await response.json().catch(() => ({}));

    return {
      skipped: false,
      provider,
      messageId: data?.messageId,
    };
  } catch (error) {
    if (error instanceof apiError) {
      throw error;
    }

    logWarn('Email transport failed unexpectedly', {
      message: error.message,
    });

    throw new apiError(502, 'Email delivery failed');
  }
};
