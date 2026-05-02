document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signInForm");
  const alert = document.getElementById("alert");

  const token = sessionStorage.getItem("token");
  if (token && !isTokenExpired(token)) {
    const payload = decodeJwt(token) || {};
    const roles = payload.roles || [];
    window.location.href = roles.includes("admin") ? "/dashboard/admin" : "/dashboard/user";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alert.style.display = "none";

    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const { token } = await apiFetch("/api/auth/signIn", {
        method: "POST",
        body: { email, password },
      });
      setToken(token);

      const payload = decodeJwt(token) || {};
      const roles = payload.roles || [];
      window.location.href = roles.includes("admin") ? "/dashboard/admin" : "/dashboard/user";
    } catch (err) {
      alert.textContent = err.message || "Error";
      alert.style.display = "block";
    }
  });
});

