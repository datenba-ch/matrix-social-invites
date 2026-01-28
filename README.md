<div align="center">

<h2> Datenbach Matrix Social-Invites </h2>

![datenbach_matrix_social_invites](assets/header.png)

[![GitHub release](https://img.shields.io/github/v/release/datenba-ch/matrix-social-invites?color=blue&label=release)]()
[![GitHub license](https://img.shields.io/github/license/datenba-ch/matrix-social-invites?color=green)]()
[![GitHub issues](https://img.shields.io/github/issues/datenba-ch/matrix-social-invites?color=red)]()
[![GitHub stars](https://img.shields.io/github/stars/datenba-ch/matrix-social-invites?color=yellow)]()
[![GitHub forks](https://img.shields.io/github/forks/datenba-ch/matrix-social-invites?color=orange)]()
[![GitHub watchers](https://img.shields.io/github/watchers/datenba-ch/matrix-social-invites?color=blue)]()

Organically grow your Matrix community by sharing registration tokens with your friends and family.

<img src="assets/code.png" alt="code" style="width: 250px;" >
</div>

## 🗺️ map

- [<code>🗺️ About</code>](#%EF%B8%8F-about)
- [<code>📦 Installation</code>](#-installation)
- [<code>🎮 Development</code>](#-development)
- [<code>🚦️ Environment</code>](#%EF%B8%8F-environment)
- [<code>🌐 Deployment</code>](#-deployment)

## 🗺️ About

Datenba.ch runs a communal, invitation only matrix server backed by Matrix Authentication Service (MAS). Traditionally only administrators are allowed to create Registration Tokens for new users which makes organic (Peer-to-Peer) invite creation difficult.

This project is our attempt to bridge the gap between the traditional registration token creation a decentralized (Peer-to-Peer) onboarding approach.

Datenbach Social Invites lets a Matrix user generate and manage a shared registration token for a Matrix homeserver. The React frontend is paired with an Express+Redis backend: after logging in via OIDC, the authenticated Matrix user can issue, view, and revoke a single invite token that other devices sharing the same Matrix identity can reuse.

Currently these tokens are generated with a invalidation timeout of 7 days and will automatically refresh. This allows our users to share their weekly invite code with their friends and family easily.

## 📦 Installation

The easiest way to install is to use Docker Compose.

```sh
# copy the environment variables from the .env.example file to a new .env file
cp .env.example .env
#  edit according to your environment variables
# build and run the container
docker compose up
```

Then navigate to `http://localhost:8080` in your browser.

## 🎮 Development

While package.json contains a local development server configuration, we recommend using Docker Compose for development, since it bundles a local redis server.

```sh
# copy the environment variables from the .env.example file to a new .env.development file
cp .env.example .env.development
#  edit according to your environment variables
# build and run the container
docker compose -f docker-compose.dev.yml up --build
```

## 🚦️ Environment

Most deployments can copy `.env.example` and edit values. These are the variables the server actually reads:

Required:

- `SESSION_COOKIE_SECRET` - secret used to sign session cookies.
- `MATRIX_AUTH_SECRET` - HMAC secret for invite signatures.
- `MATRIX_OIDC_CLIENT_ID` - OIDC client ID (from MAS).
- `MATRIX_OIDC_ISSUER` or the explicit endpoints below.
- `MATRIX_OIDC_REDIRECT_URI` - callback URL (e.g. `http://localhost:8080/api/auth/callback`).
- `MATRIX_HOMESERVER_URL` - Matrix homeserver base URL.
- `MATRIX_ACCESS_TOKEN` - token with permissions to manage registration tokens.

OIDC options:

- `MATRIX_OIDC_ISSUER` - OIDC discovery URL (used if explicit endpoints are not provided).
- `MATRIX_OIDC_AUTHORIZATION_ENDPOINT` - override discovery.
- `MATRIX_OIDC_TOKEN_ENDPOINT` - override discovery.
- `MATRIX_OIDC_USERINFO_ENDPOINT` - optional override.
- `MATRIX_OIDC_CLIENT_SECRET` - optional.
- `MATRIX_OIDC_SCOPE` - optional; default `openid profile email`.

Redis (optional but recommended):

- `REDIS_URL` - connection string; if set, host/port/user/pass are ignored.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASS`
- `REDIS_TLS` (set `true` to enable TLS)
- `REDIS_TLS_INSECURE` (set `true` to skip TLS verification)

Other:

- `PORT` - backend port (default `3000`).
- `MATRIX_ADMIN_API_BASE` - optional override for Matrix admin API base URL.
- `MATRIX_USER_ID` - optional, used for config reporting.
- `FRONTEND_REDIRECT_URI` - optional; default `/` after auth.
- `NODE_ENV` - when `production`, cookies are marked `secure`.

## 🌐 Deployment

Build the server and run it behind any HTTP proxy. The Docker container is a convenience wrapper:

```sh
docker compose up --build
```
