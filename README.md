# Forest Friend Invites

Forest Friend Invites lets a Matrix-powered companion generate and manage a shared registration token for a Matrix homeserver. The React frontend is paired with an Express+Redis backend: after logging in via OIDC, the authenticated Matrix user can issue, view, and revoke a single invite token that other devices sharing the same Matrix identity can reuse.

## Development

```sh
npm install
npm run dev
```

The UI lives under `src/` and the backend server (for auth, invite CRUD, and health checks) is under `server/`.

## Environment variables

```sh
MATRIX_AUTH_SECRET="replace-with-strong-secret"       # signs session cookies
REDIS_HOST="localhost"                               # host for the invite/session cache
REDIS_PORT="6379"
REDIS_USER="your-redis-username"
REDIS_PASS="your-redis-password"
REDIS_TLS="false"
REDIS_TLS_INSECURE="false"
REDIS_URL="redis://localhost:6379"                   # optional override that skips the host/port/user/pass vars
OIDC_CLIENT_ID="your-oidc-client-id"
OIDC_CLIENT_SECRET="your-oidc-client-secret"
OIDC_ISSUER_URL="https://issuer.example.com"
OIDC_REDIRECT_URI="http://localhost:5173/auth/callback"
MATRIX_HOMESERVER_URL="https://matrix.example.com"
MATRIX_ACCESS_TOKEN="your-matrix-token"
MATRIX_USER_ID="@bot:example.com"
```

## Deployment

Build the server and run it behind any HTTP proxy. The Docker container is a convenience wrapper:

```sh
docker compose up --build
```

The backend exposes:

- `POST /api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/api/me`
- `POST /api/invites`, `GET /api/invites/current`, `DELETE /api/invites/current`
- `GET /api/health`, `GET /api/config`

| Variable | Description |
| --- | --- |
| `PORT` | Port that the backend server listens on (default: `3000`). |
| `REDIS_HOST` | Redis host (optional; use with `REDIS_PORT`, `REDIS_USER`, `REDIS_PASS`). |
| `REDIS_PORT` | Redis port (default: `6379`). |
| `REDIS_USER` | Redis username (optional). |
| `REDIS_PASS` | Redis password (optional). |
| `REDIS_TLS` | Set to `true` to enable TLS when using `REDIS_HOST`. |
| `REDIS_TLS_INSECURE` | Set to `true` to skip TLS certificate validation. |
| `REDIS_URL` | Redis connection string for backend caching/state (optional, overrides host/port settings). |
| `MATRIX_AUTH_SECRET` | Secret used to sign the session cookie. |
| `OIDC_ISSUER_URL` | OIDC issuer base URL. |
| `OIDC_CLIENT_ID` | OIDC client ID. |
| `OIDC_CLIENT_SECRET` | OIDC client secret. |
| `OIDC_REDIRECT_URI` | OIDC redirect URI. |
| `MATRIX_HOMESERVER_URL` | Matrix homeserver URL. |
| `MATRIX_ACCESS_TOKEN` | Matrix access token for the bot/user. |
| `MATRIX_USER_ID` | Matrix user ID (e.g. `@bot:example.com`). |
