import { sign, verify } from 'jsonwebtoken';
import { BadTokenError, TokenExpiredError } from './ApiError';
import { jwtToken } from '@/config';

export class JwtPayload {
  userId: string;
  createdAt: Date;

  constructor(
    userId: string
  ) {
    this.userId = userId;
    this.createdAt = new Date();
  }
}

function encode(payload: { userId: string }): string {
  return sign({ ...payload }, jwtToken);
}

function validate(token: string): JwtPayload {
  try {
    return verify(token, jwtToken) as JwtPayload;
  } catch (e: any) {
    if (e && e.name === 'TokenExpiredError') throw new TokenExpiredError();
    // throws error if the token has not been encrypted by the private key
    throw new BadTokenError();
  }
}

function decode(token: string): JwtPayload {
  try {
    return verify(token, jwtToken, {
      ignoreExpiration: true,
    }) as JwtPayload;
  } catch (e) {
    throw new BadTokenError();
  }
}

export {
  encode,
  validate,
  decode,
};
