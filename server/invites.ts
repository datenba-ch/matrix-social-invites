import crypto from 'node:crypto';

import { config } from './config';

export type MatrixInvitePayload = {
  matrixUserId: string;
  roomId: string;
  issuedAt: number;
  nonce: string;
  signature: string;
};

export type Invite = {
  code: string;
  createdAt: number;
  matrixUserId: string;
  roomId: string;
};

const INVITE_TTL_MS = 15 * 60 * 1000;

const buildSignedMessage = (payload: Omit<MatrixInvitePayload, 'signature'>): string =>
  `${payload.matrixUserId}:${payload.roomId}:${payload.issuedAt}:${payload.nonce}`;

const computeSignature = (payload: Omit<MatrixInvitePayload, 'signature'>): string =>
  crypto
    .createHmac('sha256', config.matrixAuthSecret)
    .update(buildSignedMessage(payload))
    .digest('hex');

const secureCompare = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const validateMatrixInvite = (payload: MatrixInvitePayload): void => {
  const now = Date.now();

  if (now - payload.issuedAt > INVITE_TTL_MS) {
    throw new Error('Matrix invite payload has expired.');
  }

  const expectedSignature = computeSignature({
    matrixUserId: payload.matrixUserId,
    roomId: payload.roomId,
    issuedAt: payload.issuedAt,
    nonce: payload.nonce,
  });

  if (!secureCompare(expectedSignature, payload.signature)) {
    throw new Error('Matrix invite signature is invalid.');
  }
};

export const createInvite = (payload: MatrixInvitePayload): Invite => {
  validateMatrixInvite(payload);

  return {
    code: crypto.randomBytes(8).toString('hex'),
    createdAt: Date.now(),
    matrixUserId: payload.matrixUserId,
    roomId: payload.roomId,
  };
};
