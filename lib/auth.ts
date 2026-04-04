import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "cc_auth_token";

type AuthTokenPayload = {
  userId: number;
  email: string;
  name: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Add it to your environment variables.",
    );
  }

  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function createAuthToken(payload: AuthTokenPayload): string {
  const jwtSecret = getJwtSecret();
  const expiresIn = (process.env.JWT_EXPIRY ??
    "7d") as SignOptions["expiresIn"];

  return jwt.sign(payload, jwtSecret, { expiresIn });
}

export function verifyAuthToken(
  token: string,
): (JwtPayload & AuthTokenPayload) | null {
  try {
    const jwtSecret = getJwtSecret();
    return jwt.verify(token, jwtSecret) as JwtPayload & AuthTokenPayload;
  } catch {
    return null;
  }
}
