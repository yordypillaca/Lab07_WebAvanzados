import { verifyToken } from "../utils/jwt.js";
import { isRevoked } from "../utils/tokenBlacklist.js";

export default function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer "))
      return res.status(401).json({ message: "No autorizado" });

    const token = header.split(" ")[1];
    const payload = verifyToken(token);
    if (isRevoked(payload.jti)) {
      return res.status(401).json({ message: "Token revocado" });
    }

    req.userId = payload.sub || payload.subject;
    req.userRoles = payload.roles || [];
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token no válido o caducado" });
  }
}

