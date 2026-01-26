import http from 'http';
import crypto from 'crypto';
import net from 'net';
import { URL } from 'url';

const PORT = Number.parseInt(process.env.PORT ?? '8081', 10);
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const EXPIRATION_DAYS = 7;
const TTL_SECONDS = EXPIRATION_DAYS * 24 * 60 * 60;
const CODE_LENGTH = 6;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SESSION_COOKIE = 'invite_session_id';

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split('=');
    if (key === name) {
      return valueParts.join('=');
    }
  }
  return null;
}

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

function buildInvitePayload() {
  const createdAt = Date.now();
  return {
    code: generateCode(),
    createdAt,
    expiresAt: createdAt + TTL_SECONDS * 1000,
  };
}

function getSessionId(req) {
  return getCookieValue(req.headers.cookie, SESSION_COOKIE);
}

function ensureSessionId(req, res) {
  const existing = getSessionId(req);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${TTL_SECONDS}; HttpOnly; SameSite=Lax`
  );
  return sessionId;
}

function getInviteKey(sessionId) {
  return `invite:${sessionId}`;
}

function createRedisClient(redisUrl) {
  const url = new URL(redisUrl);
  const host = url.hostname;
  const port = Number.parseInt(url.port || '6379', 10);
  const password = url.password || null;

  let socket;
  let buffer = Buffer.alloc(0);
  const pending = [];

  function encodeCommand(parts) {
    const segments = [`*${parts.length}\r\n`];
    for (const part of parts) {
      const value = String(part);
      segments.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
    }
    return Buffer.from(segments.join(''), 'utf8');
  }

  function parseLine(buf, startIndex) {
    const endIndex = buf.indexOf('\r\n', startIndex);
    if (endIndex === -1) return null;
    return { line: buf.slice(startIndex, endIndex).toString('utf8'), nextIndex: endIndex + 2 };
  }

  function parseResponse(buf) {
    if (buf.length === 0) return null;
    const prefix = String.fromCharCode(buf[0]);
    if (!['+', '-', ':', '$'].includes(prefix)) {
      return null;
    }
    const line = parseLine(buf, 1);
    if (!line) return null;

    if (prefix === '+') {
      return { value: line.line, bytes: line.nextIndex };
    }

    if (prefix === '-') {
      return { value: new Error(line.line), bytes: line.nextIndex };
    }

    if (prefix === ':') {
      return { value: Number.parseInt(line.line, 10), bytes: line.nextIndex };
    }

    const length = Number.parseInt(line.line, 10);
    if (length === -1) {
      return { value: null, bytes: line.nextIndex };
    }
    const endIndex = line.nextIndex + length + 2;
    if (buf.length < endIndex) return null;
    const value = buf.slice(line.nextIndex, line.nextIndex + length).toString('utf8');
    return { value, bytes: endIndex };
  }

  function handleData(chunk) {
    buffer = Buffer.concat([buffer, chunk]);
    while (pending.length > 0) {
      const parsed = parseResponse(buffer);
      if (!parsed) return;
      buffer = buffer.slice(parsed.bytes);
      const { resolve, reject } = pending.shift();
      if (parsed.value instanceof Error) {
        reject(parsed.value);
      } else {
        resolve(parsed.value);
      }
    }
  }

  function connect() {
    return new Promise((resolve, reject) => {
      socket = net.createConnection({ host, port }, () => {
        socket.on('data', handleData);
        socket.on('error', reject);
        if (password) {
          sendCommand(['AUTH', password])
            .then(() => resolve())
            .catch(reject);
        } else {
          resolve();
        }
      });
      socket.on('error', reject);
    });
  }

  function sendCommand(parts) {
    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject });
      socket.write(encodeCommand(parts));
    });
  }

  return {
    connect,
    get: (key) => sendCommand(['GET', key]),
    set: (key, value, ttlSeconds) => sendCommand(['SET', key, value, 'EX', ttlSeconds]),
    del: (key) => sendCommand(['DEL', key]),
  };
}

const redisClient = createRedisClient(REDIS_URL);

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { message: 'Bad request.' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'POST' && url.pathname === '/api/invites') {
      const sessionId = ensureSessionId(req, res);
      const payload = buildInvitePayload();
      await redisClient.set(getInviteKey(sessionId), JSON.stringify(payload), TTL_SECONDS);
      sendJson(res, 200, payload);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/invites/current') {
      const sessionId = ensureSessionId(req, res);
      const raw = await redisClient.get(getInviteKey(sessionId));
      if (!raw) {
        sendJson(res, 404, { message: 'Invite code not found.' });
        return;
      }
      sendJson(res, 200, JSON.parse(raw));
      return;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/invites/current') {
      const sessionId = getSessionId(req);
      if (sessionId) {
        await redisClient.del(getInviteKey(sessionId));
      }
      res.writeHead(204);
      res.end();
      return;
    }

    sendJson(res, 404, { message: 'Not found.' });
  } catch (error) {
    console.error('Request error', error);
    sendJson(res, 500, { message: 'Internal server error.' });
  }
});

async function start() {
  await redisClient.connect();
  server.listen(PORT, () => {
    console.log(`Invite API listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
