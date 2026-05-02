import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import seedRoles from "./utils/seedRoles.js";
import seedUsers from "./utils/seedUsers.js";
import { verifyToken } from "./utils/jwt.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

function getAccessTokenFromReq(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.split(" ")[1];
  const fromCookie = req.cookies?.accessToken;
  if (fromCookie) return decodeURIComponent(fromCookie);
  return null;
}

function protectView(requiredRoles = []) {
  return (req, res, next) => {
    try {
      const token = getAccessTokenFromReq(req);
      if (!token) return res.redirect("/signIn");

      const payload = verifyToken(token); // si está expirado o inválido => throw
      const roles = payload.roles || [];

      if (requiredRoles.length > 0) {
        const ok = roles.some((r) => requiredRoles.includes(r));
        if (!ok) return res.redirect("/403");
      }

      req.userId = payload.sub || payload.subject;
      req.userRoles = roles;
      next();
    } catch {
      // Token no válido o caducado => cerrar sesión “server-side”
      res.clearCookie("accessToken", { path: "/" });
      return res.redirect("/signIn");
    }
  };
}

function redirectIfAuthed(req, res, next) {
  try {
    const token = getAccessTokenFromReq(req);
    if (!token) return next();
    const payload = verifyToken(token);
    const roles = payload.roles || [];
    return res.redirect(roles.includes("admin") ? "/dashboard/admin" : "/dashboard/user");
  } catch {
    res.clearCookie("accessToken", { path: "/" });
    return next();
  }
}

app.get("/", (req, res) => res.redirect("/signIn"));
app.get("/signIn", redirectIfAuthed, (req, res) => res.render("signIn"));
app.get("/signUp", redirectIfAuthed, (req, res) => res.render("signUp"));
app.get("/profile", protectView([]), (req, res) => res.render("profile"));
app.get("/dashboard/user", protectView(["user", "admin"]), (req, res) =>
  res.render("dashboard-user")
);
app.get("/dashboard/admin", protectView(["admin"]), (req, res) =>
  res.render("dashboard-admin")
);
app.get("/403", (req, res) => res.status(403).render("403"));

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Error interno del servidor" });
});

app.use((req, res) => {
  res.status(404).render("404");
});

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI, { autoIndex: true })
  .then(async () => {
    console.log("Mongo connected");
    await seedRoles();
    await seedUsers();
    app.listen(PORT, () =>
      console.log(`Servidor corriendo en el puerto ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Error al conectar con Mongo:", err);
    process.exit(1);
  });

