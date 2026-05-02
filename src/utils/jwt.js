import jwt from "jsonwebtoken";
import crypto from "crypto";

const ISSUER = process.env.JWT_ISSUER || "express-mongo-auth";
const AUDIENCE = process.env.JWT_AUDIENCE || "web";
const ALG = "HS256";

function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    const err = new Error(
      "JWT_SECRET inválido: debe existir y tener al menos 32 caracteres"
    );
    err.status = 500;
    throw err;
  }
  return secret;
}

export function signAccessToken({ userId, roles }) {
  const secret = requireSecret();
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { roles },
    secret,
    {
      algorithm: ALG,
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: String(userId),
      jwtid: jti,
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    }
  );
  return { token, jti };
}

export function signRefreshToken({ userId }) {
  const secret = requireSecret();
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { type: "refresh" },
    secret,
    {
      algorithm: ALG,
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: String(userId),
      jwtid: jti,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    }
  );
  return { token, jti };
}

export function verifyToken(token) {
  const secret = requireSecret();
  return jwt.verify(token, secret, {
    algorithms: [ALG],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

