import crypto from 'crypto';
import type { Request, Response } from 'express';
import { createClient } from 'redis';
import { nanoid } from 'nanoid';
import { getRedisClientOptions } from './redis.js';

const COOKIE_NAME = 'ff_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const redisClientOptions = getRedisClientOptions();
const redisClient = redisClientOptions ? createClient(redisClientOptions) : createClient();

redisClient.on('error', (error) => {
  console.error('Redis client error', error);
});

await redisClient.connect();

export interface SessionData {
  state?: string;
  codeVerifier?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  user?: {
    id: string;
    displayName: string;
    matrixId: string;
    avatarUrl?: string;
  };
}

interface OidcConfig {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint?: string;
}

let cachedOidcConfig: OidcConfig | null = null;

const base64Url = (input: Buffer) => input.toString('base64url');

const getOidcConfig = async (): Promise<OidcConfig> => {
  if (cachedOidcConfig) {
    return cachedOidcConfig;
  }

  if (
    process.env.MATRIX_OIDC_AUTHORIZATION_ENDPOINT &&
    process.env.MATRIX_OIDC_TOKEN_ENDPOINT
  ) {
    cachedOidcConfig = {
      authorizationEndpoint: process.env.MATRIX_OIDC_AUTHORIZATION_ENDPOINT,
      tokenEndpoint: process.env.MATRIX_OIDC_TOKEN_ENDPOINT,
      userinfoEndpoint: process.env.MATRIX_OIDC_USERINFO_ENDPOINT,
    };
    return cachedOidcConfig;
  }

  if (!process.env.MATRIX_OIDC_ISSUER) {
    throw new Error('MATRIX_OIDC_ISSUER is required to discover OIDC config.');
  }

  const response = await fetch(
    process.env.MATRIX_OIDC_ISSUER,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch OIDC discovery document.');
  }

  const discovery = (await response.json()) as {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint?: string;
  };

  cachedOidcConfig = {
    authorizationEndpoint: discovery.authorization_endpoint,
    tokenEndpoint: discovery.token_endpoint,
    userinfoEndpoint: discovery.userinfo_endpoint,
  };

  return cachedOidcConfig;
};

type MatrixProfile = {
  displayName?: string;
  avatarUrl?: string;
};

type MatrixLoginSession = {
  userId: string;
  accessToken: string;
};

const matrixProfileBase = () => {
  const baseUrl =
    process.env.MATRIX_ADMIN_API_BASE ?? process.env.MATRIX_HOMESERVER_URL;
  if (!baseUrl) {
    return null;
  }
  return baseUrl.replace(/\/$/, '');
};

const fetchMatrixProfile = async (
  matrixId: string,
  accessToken?: string,
): Promise<MatrixProfile | null> => {
  const base = matrixProfileBase();
  if (!base) {
    return null;
  }

  let response: globalThis.Response | null = null;
  try {
    const profileUrl = new URL(
      `/_matrix/client/v3/profile/${encodeURIComponent(matrixId)}`,
      base,
    );
    response = await fetch(profileUrl.toString(), {
      headers: {
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
      },
    });
  } catch (error) {
    console.warn('Failed to build matrix profile URL', error);
    return null;
  }

  if (!response) {
    return null;
  }

  if (!response.ok) {
    if (response.status === 403 || response.status === 404) {
      return null;
    }
    console.warn(
      'Matrix profile lookup returned unexpected status',
      response.status,
    );
    return null;
  }

  try {
    const data = (await response.json()) as Record<string, unknown>;
    return {
      displayName:
        typeof data.displayname === 'string' ? data.displayname : undefined,
      avatarUrl:
        typeof data.avatar_url === 'string' ? data.avatar_url : undefined,
    };
  } catch (error) {
    console.warn('Failed to parse matrix profile response', error);
    return null;
  }
};

const fetchMatrixWhoAmI = async (accessToken: string): Promise<string | null> => {
  const base = matrixProfileBase();
  if (!base) {
    return null;
  }

  try {
    const whoamiUrl = new URL('/_matrix/client/v3/account/whoami', base);
    const response = await fetch(whoamiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      console.warn('Matrix whoami lookup failed', response.status);
      return null;
    }

    const data = (await response.json()) as { user_id?: string };
    return typeof data.user_id === 'string' ? data.user_id : null;
  } catch (error) {
    console.warn('Failed to fetch Matrix whoami', error);
    return null;
  }
};

const exchangeOidcTokenForMatrixSession = async (
  oidcToken: string,
): Promise<MatrixLoginSession | null> => {
  const base = matrixProfileBase();
  if (!base) {
    return null;
  }

  try {
    const loginUrl = new URL('/_matrix/client/v3/login', base);
    const response = await fetch(loginUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'org.matrix.login.jwt',
        token: oidcToken,
      }),
    });

    if (!response.ok) {
      console.warn('Matrix login token exchange failed', response.status);
      return null;
    }

    const data = (await response.json()) as {
      user_id?: string;
      access_token?: string;
    };

    if (typeof data.user_id !== 'string' || typeof data.access_token !== 'string') {
      return null;
    }

    return {
      userId: data.user_id,
      accessToken: data.access_token,
    };
  } catch (error) {
    console.warn('Failed to exchange OIDC token for Matrix session', error);
    return null;
  }
};

const getSessionKey = (sessionId: string) => `session:${sessionId}`;

const readSession = async (sessionId: string): Promise<SessionData | null> => {
  const raw = await redisClient.get(getSessionKey(sessionId));
  return raw ? (JSON.parse(raw) as SessionData) : null;
};

const writeSession = async (sessionId: string, data: SessionData) => {
  await redisClient.set(getSessionKey(sessionId), JSON.stringify(data), {
    EX: SESSION_TTL_SECONDS,
  });
};

const clearSession = async (sessionId: string) => {
  await redisClient.del(getSessionKey(sessionId));
};

const getSignedSessionId = (req: Request) => {
  const signedCookie = req.signedCookies?.[COOKIE_NAME];
  return typeof signedCookie === 'string' ? signedCookie : null;
};

export const getSessionFromRequest = async (req: Request): Promise<SessionData | null> => {
  const sessionId = getSignedSessionId(req);
  if (!sessionId) {
    return null;
  }

  return readSession(sessionId);
};

const ensureSessionId = (req: Request, res: Response) => {
  const existingSessionId = getSignedSessionId(req);
  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = nanoid();
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS * 1000,
  });

  return sessionId;
};

const exchangeToken = async (body: URLSearchParams) => {
  const config = await getOidcConfig();
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  };
};

const fetchUserInfo = async (accessToken: string) => {
  const config = await getOidcConfig();
  if (!config.userinfoEndpoint) {
    return null;
  }

  const response = await fetch(config.userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info.');
  }

  return (await response.json()) as Record<string, unknown>;
};

export const handleLogin = async (req: Request, res: Response) => {
  try {
    const sessionId = ensureSessionId(req, res);
    const state = base64Url(crypto.randomBytes(32));
    const codeVerifier = base64Url(crypto.randomBytes(32));
    const codeChallenge = base64Url(
      crypto.createHash('sha256').update(codeVerifier).digest(),
    );

    const config = await getOidcConfig();
    const redirectUri = process.env.MATRIX_OIDC_REDIRECT_URI;

    if (!redirectUri || !process.env.MATRIX_OIDC_CLIENT_ID) {
      res.status(500).json({ error: 'OIDC client is not configured.' });
      return;
    }

    await writeSession(sessionId, {
      state,
      codeVerifier,
    });

    const authUrl = new URL(config.authorizationEndpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.MATRIX_OIDC_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set(
      'scope',
      process.env.MATRIX_OIDC_SCOPE ?? 'openid profile email',
    );
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.json({ authorizationUrl: authUrl.toString() });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  try {
    const sessionId = getSignedSessionId(req);
    if (!sessionId) {
      res.status(400).json({ error: 'Missing session cookie.' });
      return;
    }

    const session = await readSession(sessionId);
    if (!session?.state || !session.codeVerifier) {
      res.status(400).json({ error: 'Missing session state.' });
      return;
    }

    const { code, state } = req.query;
    if (!code || !state || state !== session.state) {
      res.status(400).json({ error: 'Invalid OIDC state.' });
      return;
    }

    if (!process.env.MATRIX_OIDC_CLIENT_ID || !process.env.MATRIX_OIDC_REDIRECT_URI) {
      res.status(500).json({ error: 'OIDC client is not configured.' });
      return;
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: process.env.MATRIX_OIDC_REDIRECT_URI,
      client_id: process.env.MATRIX_OIDC_CLIENT_ID,
      code_verifier: session.codeVerifier,
    });

    if (process.env.MATRIX_OIDC_CLIENT_SECRET) {
      body.set('client_secret', process.env.MATRIX_OIDC_CLIENT_SECRET);
    }

    const tokenResponse = await exchangeToken(body);
    const userInfo = await fetchUserInfo(tokenResponse.access_token);

    const matrixIdFromInfo =
      (userInfo?.matrix_id as string | undefined) ||
      (userInfo?.preferred_username as string | undefined) ||
      (userInfo?.sub as string | undefined) ||
      'unknown';

    const oidcLoginToken =
      tokenResponse.id_token ?? tokenResponse.access_token ?? undefined;

    const matrixSession =
      oidcLoginToken !== undefined
        ? await exchangeOidcTokenForMatrixSession(oidcLoginToken)
        : null;

    const matrixAccessToken = matrixSession?.accessToken;
    const whoAmIResult = matrixAccessToken
      ? await fetchMatrixWhoAmI(matrixAccessToken)
      : null;

    const confirmedMatrixId =
      whoAmIResult ?? matrixSession?.userId ?? matrixIdFromInfo;

    const fallbackDisplayName =
      (userInfo?.name as string | undefined) ||
      (userInfo?.preferred_username as string | undefined) ||
      matrixIdFromInfo;

    const profile = await fetchMatrixProfile(
      confirmedMatrixId,
      matrixAccessToken,
    );
    const displayName = profile?.displayName ?? fallbackDisplayName;

    const user = {
      id: (userInfo?.sub as string | undefined) ?? confirmedMatrixId,
      displayName,
      matrixId: confirmedMatrixId,
      ...(profile?.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    };

    await writeSession(sessionId, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      idToken: tokenResponse.id_token,
      user,
    });

    const redirectTarget = process.env.FRONTEND_REDIRECT_URI ?? '/';
    res.redirect(redirectTarget);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const handleRefresh = async (req: Request, res: Response) => {
  try {
    const sessionId = getSignedSessionId(req);
    if (!sessionId) {
      res.status(401).json({ error: 'Missing session.' });
      return;
    }

    const session = await readSession(sessionId);
    if (!session?.refreshToken) {
      res.status(401).json({ error: 'Missing refresh token.' });
      return;
    }

    if (!process.env.MATRIX_OIDC_CLIENT_ID) {
      res.status(500).json({ error: 'OIDC client is not configured.' });
      return;
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: process.env.MATRIX_OIDC_CLIENT_ID,
    });

    if (process.env.MATRIX_OIDC_CLIENT_SECRET) {
      body.set('client_secret', process.env.MATRIX_OIDC_CLIENT_SECRET);
    }

    const tokenResponse = await exchangeToken(body);

    await writeSession(sessionId, {
      ...session,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? session.refreshToken,
      idToken: tokenResponse.id_token ?? session.idToken,
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const handleLogout = async (req: Request, res: Response) => {
  try {
    const sessionId = getSignedSessionId(req);
    if (sessionId) {
      await clearSession(sessionId);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const handleMe = async (req: Request, res: Response) => {
  try {
    const sessionId = getSignedSessionId(req);
    if (!sessionId) {
      res.json({ user: null });
      return;
    }

    const session = await readSession(sessionId);
    res.json({ user: session?.user ?? null });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
