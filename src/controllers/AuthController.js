import authService from "../services/AuthService.js";
import { parseOrThrow, signInSchema, signUpSchema } from "../utils/validators.js";

class AuthController {
  async signUp(req, res, next) {
    try {
      const payload = parseOrThrow(signUpSchema, req.body || {});
      const user = await authService.signUp(payload);
      return res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async signIn(req, res, next) {
    try {
      const payload = parseOrThrow(signInSchema, req.body || {});
      const { token, refreshToken } = await authService.signIn(payload);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/api/auth",
      });

      return res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const { token, refreshToken: newRefresh } = await authService.refresh({
        refreshToken,
      });

      res.cookie("refreshToken", newRefresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/api/auth",
      });

      return res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const header = req.headers.authorization;
      const accessToken =
        header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
      const refreshToken = req.cookies?.refreshToken;

      await authService.logout({ accessToken, refreshToken });
      res.clearCookie("refreshToken", { path: "/api/auth" });
      return res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();

