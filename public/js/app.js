function decodeJwt(token) {
  try {
    const payloadB64 = token.split(".")[1];
    const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function getToken() {
  return sessionStorage.getItem("token");
}

function setToken(token) {
  sessionStorage.setItem("token", token);
  // También guardamos el access token en cookie para proteger vistas del lado servidor.
  // (Se mantiene sessionStorage como pide la consigna.)
  document.cookie = `accessToken=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
}

function clearToken() {
  sessionStorage.removeItem("token");
  document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax";
}

function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

function requireAuth() {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    clearToken();
    window.location.href = "/signIn";
    return null;
  }
  return token;
}

function requireRole(requiredRoles = []) {
  const token = requireAuth();
  if (!token) return null;
  const payload = decodeJwt(token);
  const roles = (payload && payload.roles) || [];
  if (requiredRoles.length === 0) return token;
  const has = roles.some((r) => requiredRoles.includes(r));
  if (!has) {
    window.location.href = "/403";
    return null;
  }
  return token;
}

async function apiFetch(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  if (res.status === 401) {
    // Intentar refresh una vez (token expirado)
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        if (refreshed.token) {
          setToken(refreshed.token);
          headers.Authorization = `Bearer ${refreshed.token}`;
          res = await fetch(path, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            credentials: "same-origin",
          });
        }
      }
    } catch {
      // ignore
    }

    if (res.status === 401) {
      clearToken();
      window.location.href = "/signIn";
      throw new Error("No autorizado");
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || "Error";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const navSignIn = document.getElementById("navSignIn");
  const navSignUp = document.getElementById("navSignUp");
  const navProfile = document.getElementById("navProfile");
  const navDashUser = document.getElementById("navDashboardUser");
  const navDashAdmin = document.getElementById("navDashboardAdmin");
  const logout = document.getElementById("logoutLink");

  const token = getToken();
  const valid = token && !isTokenExpired(token);
  const payload = valid ? decodeJwt(token) : null;
  const roles = (payload && payload.roles) || [];

  if (!valid) clearToken();

  if (navSignIn) navSignIn.style.display = valid ? "none" : "";
  if (navSignUp) navSignUp.style.display = valid ? "none" : "";
  if (navProfile) navProfile.style.display = valid ? "" : "none";
  if (logout) logout.style.display = valid ? "" : "none";

  const isAdmin = roles.includes("admin");
  if (navDashUser) navDashUser.style.display = valid && !isAdmin ? "" : "none";
  if (navDashAdmin) navDashAdmin.style.display = valid && isAdmin ? "" : "none";

  if (logout) {
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      const token = getToken();
      fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "same-origin",
      }).catch(() => {});
      clearToken();
      window.location.href = "/signIn";
    });
  }
});

