# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment variables

Backend services require the following environment variables. Values shown below are examples.

```sh
MATRIX_AUTH_SECRET="replace-with-strong-secret"
REDIS_URL="redis://localhost:6379"
OIDC_CLIENT_ID="your-oidc-client-id"
OIDC_CLIENT_SECRET="your-oidc-client-secret"
OIDC_ISSUER_URL="https://issuer.example.com"
OIDC_REDIRECT_URI="http://localhost:5173/auth/callback"
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Docker deployment

This project now ships with a backend server that serves the built Vite frontend and exposes `/api/*` routes. Build and run the container like this:

```sh
docker build -t forest-friend-invites .

docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e REDIS_URL=redis://redis:6379 \
  -e OIDC_ISSUER_URL=https://issuer.example.com \
  -e OIDC_CLIENT_ID=your-client-id \
  -e OIDC_CLIENT_SECRET=your-client-secret \
  -e OIDC_REDIRECT_URI=https://your-app.example.com/callback \
  -e MATRIX_HOMESERVER_URL=https://matrix.example.com \
  -e MATRIX_ACCESS_TOKEN=your-matrix-token \
  -e MATRIX_USER_ID=@bot:example.com \
  forest-friend-invites
```

### Environment variables

| Variable | Description |
| --- | --- |
| `PORT` | Port that the backend server listens on (default: `3000`). |
| `REDIS_URL` | Redis connection string for backend caching/state (optional). |
| `OIDC_ISSUER_URL` | OIDC issuer base URL. |
| `OIDC_CLIENT_ID` | OIDC client ID. |
| `OIDC_CLIENT_SECRET` | OIDC client secret. |
| `OIDC_REDIRECT_URI` | OIDC redirect URI. |
| `MATRIX_HOMESERVER_URL` | Matrix homeserver URL. |
| `MATRIX_ACCESS_TOKEN` | Matrix access token for the bot/user. |
| `MATRIX_USER_ID` | Matrix user ID (e.g. `@bot:example.com`). |

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
