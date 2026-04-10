import apiError from '../utils/apiError.js';
import { logError, logWarn } from '../utils/logger.js';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const sanitizeEnvValue = (value) => {
  const normalized = String(value || '').trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
};

const getBrevoApiKey = () => sanitizeEnvValue(process.env.BREVO_API_KEY);

const getProvider = () =>
  sanitizeEnvValue(process.env.EMAIL_PROVIDER).toLowerCase();

const getSender = () => ({
  name: sanitizeEnvValue(process.env.MAIL_FROM_NAME) || 'VidTube',
  email: sanitizeEnvValue(process.env.MAIL_FROM_EMAIL),
});

const isBrevoConfigured = () => Boolean(getBrevoApiKey() && getSender().email);

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
        'api-key': getBrevoApiKey(),
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

      if (response.status === 401) {
        logWarn('Brevo API unauthorized response', {
          hint: 'Check BREVO_API_KEY. Use an active Brevo API v3 key and avoid wrapping quotes.',
        });
      }

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
