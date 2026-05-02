document.addEventListener("DOMContentLoaded", async () => {
  const token = requireRole(["user", "admin"]);
  if (!token) return;

  const me = await apiFetch("/api/users/me", { token });
  document.getElementById("welcome").textContent = `Bienvenido, ${me.name || me.email}`;

  document.getElementById("meName").textContent = me.name || "";
  document.getElementById("meLastName").textContent = me.lastName || "";
  document.getElementById("meEmail").textContent = me.email || "";
  document.getElementById("mePhone").textContent = me.phoneNumber || "";
  document.getElementById("meBirthdate").textContent = me.birthdate
    ? String(me.birthdate).slice(0, 10)
    : "";
  document.getElementById("meAge").textContent = me.age ?? "";
  document.getElementById("meRoles").textContent = (me.roles || []).join(", ");
  document.getElementById("meCreatedAt").textContent = me.createdAt
    ? new Date(me.createdAt).toLocaleString()
    : "";
});

