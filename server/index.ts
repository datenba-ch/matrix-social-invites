import cookieParser from 'cookie-parser';
import express from 'express';
import {
  handleCallback,
  handleLogin,
  handleLogout,
  handleMe,
  handleRefresh,
} from './auth.js';

const app = express();

app.use(express.json());

if (!process.env.SESSION_COOKIE_SECRET) {
  throw new Error('SESSION_COOKIE_SECRET is required to sign cookies.');
}

app.use(cookieParser(process.env.SESSION_COOKIE_SECRET));

app.post('/api/auth/login', handleLogin);
app.get('/api/auth/callback', handleCallback);
app.post('/api/auth/refresh', handleRefresh);
app.post('/api/auth/logout', handleLogout);
app.get('/api/me', handleMe);

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`Auth server listening on port ${port}`);
});
