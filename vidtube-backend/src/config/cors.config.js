const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

const parseOriginList = (value) =>
  value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

export const getAllowedOrigins = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const envFrontend = process.env.FRONTEND_URL?.trim();
  const envAllowed = parseOriginList(process.env.ALLOWED_ORIGINS);

  const configuredOrigins = [
    ...(envFrontend ? [envFrontend] : []),
    ...envAllowed,
  ];

  const allowedOrigins = [
    ...new Set(
      isProduction
        ? configuredOrigins
        : [...defaultDevOrigins, ...configuredOrigins]
    ),
  ];

  if (isProduction && allowedOrigins.length === 0) {
    throw new Error(
      'CORS misconfiguration: set FRONTEND_URL or ALLOWED_ORIGINS in production'
    );
  }

  return allowedOrigins;
};
