import bcrypt from "bcrypt";
import userRepository from "../repositories/UserRepository.js";
import roleRepository from "../repositories/RoleRepository.js";
import crypto from "crypto";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";
import { revokeJti } from "../utils/tokenBlacklist.js";

class AuthService {
  async signUp({
    email,
    password,
    name,
    lastName,
    phoneNumber,
    birthdate,
    url_profile,
    address,
    roles = ["user"],
  }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error("El email ya se encuentra en uso");
      err.status = 400;
      throw err;
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10", 10);
    const hashed = await bcrypt.hash(password, saltRounds);

    const roleDocs = [];
    for (const r of roles) {
      let roleDoc = await roleRepository.findByName(r);
      if (!roleDoc) roleDoc = await roleRepository.create({ name: r });
      roleDocs.push(roleDoc._id);
    }

    const user = await userRepository.create({
      email,
      password: hashed,
      name,
      lastName,
      phoneNumber,
      birthdate: birthdate ? new Date(birthdate) : undefined,
      url_profile,
      address,
      roles: roleDocs,
    });

    return {
      id: user._id,
      email: user.email,
      name: user.name,
    };
  }

  async signIn({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const err = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    const roles = user.roles.map((r) => r.name);

    const { token } = signAccessToken({ userId: user._id, roles });
    const { token: refreshToken } = signRefreshToken({ userId: user._id });

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const refreshPayload = verifyToken(refreshToken);
    const refreshTokenExpiresAt = new Date(refreshPayload.exp * 1000);

    await userRepository.saveRefreshToken(
      user._id,
      refreshTokenHash,
      refreshTokenExpiresAt
    );

    return { token, refreshToken };
  }

  async refresh({ refreshToken }) {
    if (!refreshToken) {
      const err = new Error("No autorizado");
      err.status = 401;
      throw err;
    }

    const payload = verifyToken(refreshToken);
    if (payload.type !== "refresh") {
      const err = new Error("Token inválido");
      err.status = 401;
      throw err;
    }

    const userId = payload.sub || payload.subject;
    // Para validar hash, necesitamos leer refreshTokenHash aunque sea select:false
    // Usamos una consulta directa aquí.
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId)
      .select("+refreshTokenHash +refreshTokenExpiresAt")
      .populate("roles")
      .exec();

    if (!user || !user.refreshTokenHash) {
      const err = new Error("No autorizado");
      err.status = 401;
      throw err;
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      const err = new Error("Refresh token caducado");
      err.status = 401;
      throw err;
    }

    const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    if (hash !== user.refreshTokenHash) {
      const err = new Error("No autorizado");
      err.status = 401;
      throw err;
    }

    // Rotación: revocamos el jti anterior (mejora) y emitimos uno nuevo
    revokeJti(payload.jti, payload.exp);

    const roles = (user.roles || []).map((r) => r.name);
    const { token } = signAccessToken({ userId: user._id, roles });
    const { token: newRefresh } = signRefreshToken({ userId: user._id });

    const newHash = crypto.createHash("sha256").update(newRefresh).digest("hex");
    const newPayload = verifyToken(newRefresh);
    const newExpiresAt = new Date(newPayload.exp * 1000);
    await userRepository.saveRefreshToken(user._id, newHash, newExpiresAt);

    return { token, refreshToken: newRefresh };
  }

  async logout({ accessToken, refreshToken }) {
    if (accessToken) {
      try {
        const p = verifyToken(accessToken);
        revokeJti(p.jti, p.exp);
      } catch {
        // ignore
      }
    }
    if (refreshToken) {
      try {
        const p = verifyToken(refreshToken);
        revokeJti(p.jti, p.exp);
      } catch {
        // ignore
      }
    }
    return { ok: true };
  }
}

export default new AuthService();

