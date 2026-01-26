import cookieParser from "cookie-parser";
import crypto from "crypto";
import express from "express";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "redis";

import {
  handleCallback,
  handleLogin,
  handleLogout,
  handleMe,
  handleRefresh,
} from "./auth.js";

const port = Number(process.env.PORT ?? 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "..", "dist");

const oidcConfig = {
  issuerUrl: process.env.OIDC_ISSUER_URL,
  clientId: process.env.OIDC_CLIENT_ID,
  clientSecret: process.env.OIDC_CLIENT_SECRET,
  redirectUri: process.env.OIDC_REDIRECT_URI,
};

const matrixConfig = {
  homeserverUrl: process.env.MATRIX_HOMESERVER_URL,
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: process.env.MATRIX_USER_ID,
};
const matrixAdminApiBase = process.env.MATRIX_ADMIN_API_BASE;

const redisUrl = process.env.REDIS_URL;
const inviteRedisClient = redisUrl ? createClient({ url: redisUrl }) : null;

const INVITE_TTL_DAYS = 7;
const INVITE_TTL_SECONDS = INVITE_TTL_DAYS * 24 * 60 * 60;
const INVITE_CODE_LENGTH = 7;
const INVITE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const INVITE_SESSION_COOKIE = "invite_session_id";

const generateInviteCode = () => {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_CHARS.charAt(Math.floor(Math.random() * INVITE_CODE_CHARS.length));
  }
  return code;
};

type InvitePayload = {
  code: string;
  createdAt: number;
  expiresAt: number;
};

type RegistrationTokenAttributes = {
  token: string;
  created_at: string;
  expires_at: string | null;
};

type RegistrationTokenResponse = {
  data?: {
    attributes?: RegistrationTokenAttributes;
  };
};

const pingRedis = async (): Promise<boolean> => {
  if (!redisUrl) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(redisUrl);
  } catch {
    return false;
  }

  const port = Number(url.port || 6379);
  const host = url.hostname;
  const password = url.password;

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      if (password) {
        socket.write(`*2\r\n$4\r\nAUTH\r\n$${password.length}\r\n${password}\r\n`);
      }
      socket.write("*1\r\n$4\r\nPING\r\n");
    });

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 1500);

    socket.on("data", (data) => {
      const response = data.toString();
      if (response.includes("+PONG")) {
        clearTimeout(timeout);
        socket.end();
        resolve(true);
      }
      if (response.startsWith("-")) {
        clearTimeout(timeout);
        socket.end();
        resolve(false);
      }
    });

    socket.on("error", () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
};

const app = express();

app.use(express.json());

if (!process.env.SESSION_COOKIE_SECRET) {
  throw new Error("SESSION_COOKIE_SECRET is required to sign cookies.");
}

app.use(cookieParser(process.env.SESSION_COOKIE_SECRET));

app.get("/api/health", async (_req, res) => {
  const redisOk = await pingRedis();
  res.status(200).json({
    status: "ok",
    redis: redisUrl ? (redisOk ? "connected" : "error") : "disabled",
    oidcConfigured: Boolean(oidcConfig.issuerUrl && oidcConfig.clientId),
    matrixConfigured: Boolean(matrixConfig.homeserverUrl && matrixConfig.userId),
  });
});

app.get("/api/config", (_req, res) => {
  res.status(200).json({
    oidc: {
      issuerUrl: oidcConfig.issuerUrl,
      clientId: oidcConfig.clientId,
      redirectUri: oidcConfig.redirectUri,
      configured: Boolean(oidcConfig.issuerUrl && oidcConfig.clientId),
    },
    matrix: {
      homeserverUrl: matrixConfig.homeserverUrl,
      userId: matrixConfig.userId,
      configured: Boolean(matrixConfig.homeserverUrl && matrixConfig.userId),
    },
    redis: {
      urlSet: Boolean(redisUrl),
    },
  });
});

const getCookieValue = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");
    if (key === name) {
      return valueParts.join("=");
    }
  }
  return null;
};

const getInviteSessionId = (req: express.Request) =>
  getCookieValue(req.headers.cookie, INVITE_SESSION_COOKIE);

const ensureInviteSessionId = (req: express.Request, res: express.Response) => {
  const existing = getInviteSessionId(req);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  res.setHeader(
    "Set-Cookie",
    `${INVITE_SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${INVITE_TTL_SECONDS}; HttpOnly; SameSite=Lax`,
  );
  return sessionId;
};

const getInviteKey = (sessionId: string) => `invite:${sessionId}`;

const getAdminApiBase = () => {
  const base = matrixAdminApiBase ?? matrixConfig.homeserverUrl;
  if (!base) {
    throw new Error("MATRIX_ADMIN_API_BASE or MATRIX_HOMESERVER_URL is required.");
  }
  return base.replace(/\/+$/, ""); // trim trailing slash
};

const getAdminAccessToken = () => {
  const token = matrixConfig.accessToken;
  if (!token) {
    throw new Error("MATRIX_ACCESS_TOKEN is required.");
  }
  return token;
};

const createRegistrationToken = async (): Promise<InvitePayload> => {
  const adminBase = getAdminApiBase();
  const accessToken = getAdminAccessToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_SECONDS * 1000).toISOString();
  const token = generateInviteCode();

  const response = await fetch(
    new URL("api/admin/v1/user-registration-tokens", `${adminBase}/`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_at: expiresAt,
        token,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create registration token: ${errorText}`);
  }

  const payload = (await response.json()) as RegistrationTokenResponse;
  const attrs = payload.data?.attributes;
  if (!attrs?.token || !attrs.created_at) {
    throw new Error("Registration token response is missing required fields.");
  }

  const createdAtMs = Date.parse(attrs.created_at);
  const expiresAtMs = attrs.expires_at ? Date.parse(attrs.expires_at) : NaN;
  const createdAt = Number.isNaN(createdAtMs) ? Date.now() : createdAtMs;
  const expiresAtFinal = Number.isNaN(expiresAtMs)
    ? createdAt + INVITE_TTL_SECONDS * 1000
    : expiresAtMs;

  return {
    code: attrs.token,
    createdAt,
    expiresAt: expiresAtFinal,
  };
};

app.post("/api/auth/login", handleLogin);
app.get("/api/auth/callback", handleCallback);
app.post("/api/auth/refresh", handleRefresh);
app.post("/api/auth/logout", handleLogout);
app.get("/api/me", handleMe);

app.post("/api/invites", async (req, res) => {
  if (!inviteRedisClient) {
    res.status(500).json({ message: "Redis is not configured." });
    return;
  }

  try {
    const sessionId = ensureInviteSessionId(req, res);
    const payload = await createRegistrationToken();
    await inviteRedisClient.set(getInviteKey(sessionId), JSON.stringify(payload), {
      EX: INVITE_TTL_SECONDS,
    });
    res.status(200).json(payload);
  } catch (error) {
    console.error("Invite create error", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/api/invites/current", async (req, res) => {
  if (!inviteRedisClient) {
    res.status(500).json({ message: "Redis is not configured." });
    return;
  }

  try {
    const sessionId = ensureInviteSessionId(req, res);
    const raw = await inviteRedisClient.get(getInviteKey(sessionId));
    if (!raw) {
      res.status(404).json({ message: "Invite code not found." });
      return;
    }
    const parsed = JSON.parse(raw) as InvitePayload;
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      await inviteRedisClient.del(getInviteKey(sessionId));
      res.status(404).json({ message: "Invite code not found." });
      return;
    }
    res.status(200).json(parsed);
  } catch (error) {
    console.error("Invite fetch error", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/api/invites/current", async (req, res) => {
  if (!inviteRedisClient) {
    res.status(500).json({ message: "Redis is not configured." });
    return;
  }

  try {
    const sessionId = getInviteSessionId(req);
    if (sessionId) {
      await inviteRedisClient.del(getInviteKey(sessionId));
    }
    res.sendStatus(204);
  } catch (error) {
    console.error("Invite delete error", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(express.static(distPath, { index: false }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

if (inviteRedisClient) {
  inviteRedisClient.on("error", (error) => {
    console.error("Invite Redis client error", error);
  });
  inviteRedisClient.connect().catch((error) => {
    console.error("Failed to connect invite Redis client", error);
  });
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
