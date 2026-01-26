import crypto from 'crypto';
import { createClient } from 'redis';
import { nanoid } from 'nanoid';
const COOKIE_NAME = 'ff_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const redisClient = createClient({
    url: process.env.REDIS_URL,
});
redisClient.on('error', (error) => {
    console.error('Redis client error', error);
});
await redisClient.connect();
let cachedOidcConfig = null;
const base64Url = (input) => input.toString('base64url');
const getOidcConfig = async () => {
    if (cachedOidcConfig) {
        return cachedOidcConfig;
    }
    if (process.env.MATRIX_OIDC_AUTHORIZATION_ENDPOINT &&
        process.env.MATRIX_OIDC_TOKEN_ENDPOINT) {
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
    const response = await fetch(process.env.MATRIX_OIDC_ISSUER);
    if (!response.ok) {
        throw new Error('Failed to fetch OIDC discovery document.');
    }
    const discovery = (await response.json());
    cachedOidcConfig = {
        authorizationEndpoint: discovery.authorization_endpoint,
        tokenEndpoint: discovery.token_endpoint,
        userinfoEndpoint: discovery.userinfo_endpoint,
    };
    return cachedOidcConfig;
};
const getSessionKey = (sessionId) => `session:${sessionId}`;
const readSession = async (sessionId) => {
    const raw = await redisClient.get(getSessionKey(sessionId));
    return raw ? JSON.parse(raw) : null;
};
const writeSession = async (sessionId, data) => {
    await redisClient.set(getSessionKey(sessionId), JSON.stringify(data), {
        EX: SESSION_TTL_SECONDS,
    });
};
const clearSession = async (sessionId) => {
    await redisClient.del(getSessionKey(sessionId));
};
const getSignedSessionId = (req) => {
    const signedCookie = req.signedCookies?.[COOKIE_NAME];
    return typeof signedCookie === 'string' ? signedCookie : null;
};
const ensureSessionId = (req, res) => {
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
const exchangeToken = async (body) => {
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
    return (await response.json());
};
const fetchUserInfo = async (accessToken) => {
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
    return (await response.json());
};
export const handleLogin = async (req, res) => {
    try {
        const sessionId = ensureSessionId(req, res);
        const state = base64Url(crypto.randomBytes(32));
        const codeVerifier = base64Url(crypto.randomBytes(32));
        const codeChallenge = base64Url(crypto.createHash('sha256').update(codeVerifier).digest());
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
        authUrl.searchParams.set('scope', process.env.MATRIX_OIDC_SCOPE ?? 'openid profile email');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        res.json({ authorizationUrl: authUrl.toString() });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const handleCallback = async (req, res) => {
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
        const matrixId = userInfo?.matrix_id ||
            userInfo?.preferred_username ||
            userInfo?.sub ||
            'unknown';
        const user = {
            id: userInfo?.sub ?? matrixId,
            displayName: userInfo?.name ||
                userInfo?.preferred_username ||
                matrixId,
            matrixId,
        };
        await writeSession(sessionId, {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            idToken: tokenResponse.id_token,
            user,
        });
        const redirectTarget = process.env.FRONTEND_REDIRECT_URI ?? '/';
        res.redirect(redirectTarget);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const handleRefresh = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const handleLogout = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const handleMe = async (req, res) => {
    try {
        const sessionId = getSignedSessionId(req);
        if (!sessionId) {
            res.json({ user: null });
            return;
        }
        const session = await readSession(sessionId);
        res.json({ user: session?.user ?? null });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
