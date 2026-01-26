const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export type ServerConfig = {
  matrixAuthSecret: string;
  redisUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcIssuerUrl?: string;
  oidcRedirectUri?: string;
};

export const config: ServerConfig = {
  matrixAuthSecret: requireEnv('MATRIX_AUTH_SECRET'),
  redisUrl: process.env.REDIS_URL,
  oidcClientId: process.env.OIDC_CLIENT_ID,
  oidcClientSecret: process.env.OIDC_CLIENT_SECRET,
  oidcIssuerUrl: process.env.OIDC_ISSUER_URL,
  oidcRedirectUri: process.env.OIDC_REDIRECT_URI,
};
