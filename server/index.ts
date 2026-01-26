import http from "http";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";

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

const redisUrl = process.env.REDIS_URL;

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
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

const sendJson = (res: http.ServerResponse, statusCode: number, payload: unknown) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
};

const serveFile = async (res: http.ServerResponse, filePath: string) => {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }

    const ext = path.extname(filePath);
    const contentType = contentTypes[ext] ?? "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end();
  }
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/health") {
      const redisOk = await pingRedis();
      sendJson(res, 200, {
        status: "ok",
        redis: redisUrl ? (redisOk ? "connected" : "error") : "disabled",
        oidcConfigured: Boolean(oidcConfig.issuerUrl && oidcConfig.clientId),
        matrixConfigured: Boolean(matrixConfig.homeserverUrl && matrixConfig.userId),
      });
      return;
    }

    if (url.pathname === "/api/config") {
      sendJson(res, 200, {
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
      return;
    }

    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const safePath = path.normalize(url.pathname).replace(/^\.+/, "");
  const filePath = path.join(distPath, safePath);

  if (safePath === "/" || safePath === "") {
    await serveFile(res, path.join(distPath, "index.html"));
    return;
  }

  try {
    await stat(filePath);
    await serveFile(res, filePath);
  } catch {
    await serveFile(res, path.join(distPath, "index.html"));
  }
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
