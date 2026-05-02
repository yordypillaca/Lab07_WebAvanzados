const blacklist = new Map();

function cleanup() {
  const now = Date.now();
  for (const [jti, expMs] of blacklist.entries()) {
    if (expMs <= now) blacklist.delete(jti);
  }
}

export function revokeJti(jti, expSeconds) {
  if (!jti || !expSeconds) return;
  blacklist.set(jti, expSeconds * 1000);
  cleanup();
}

export function isRevoked(jti) {
  cleanup();
  if (!jti) return false;
  return blacklist.has(jti);
}

