document.addEventListener("DOMContentLoaded", async () => {
  const token = requireAuth();
  if (!token) return;

  const alert = document.getElementById("alert");
  const success = document.getElementById("success");
  const form = document.getElementById("profileForm");

  function showError(msg) {
    alert.textContent = msg;
    alert.style.display = "block";
    success.style.display = "none";
  }

  function showSuccess(msg) {
    success.textContent = msg;
    success.style.display = "block";
    alert.style.display = "none";
  }

  async function loadMe() {
    const me = await apiFetch("/api/users/me", { token });

    document.getElementById("uEmail").textContent = me.email || "";
    document.getElementById("uRoles").textContent = (me.roles || []).join(", ");
    document.getElementById("uAge").textContent = me.age ?? "";
    document.getElementById("uCreated").textContent = me.createdAt
      ? new Date(me.createdAt).toLocaleString()
      : "";

    form.name.value = me.name || "";
    form.lastName.value = me.lastName || "";
    form.phoneNumber.value = me.phoneNumber || "";
    form.birthdate.value = me.birthdate ? new Date(me.birthdate).toISOString().slice(0, 10) : "";
    form.url_profile.value = me.url_profile || "";
    form.address.value = me.address || "";

    M.updateTextFields();
  }

  try {
    await loadMe();
  } catch (err) {
    showError(err.message || "Error");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alert.style.display = "none";
    success.style.display = "none";

    try {
      await apiFetch("/api/users/me", {
        token,
        method: "PUT",
        body: {
          name: form.name.value.trim(),
          lastName: form.lastName.value.trim(),
          phoneNumber: form.phoneNumber.value.trim(),
          birthdate: form.birthdate.value,
          url_profile: form.url_profile.value.trim(),
          address: form.address.value.trim(),
        },
      });
      showSuccess("Datos actualizados");
      await loadMe();
    } catch (err) {
      showError(err.message || "Error");
    }
  });
});

