document.addEventListener("DOMContentLoaded", async () => {
  const token = requireRole(["admin"]);
  if (!token) return;

  const alert = document.getElementById("alert");
  const tbody = document.getElementById("usersTbody");
  const modalEl = document.getElementById("userModal");
  const modal = modalEl ? M.Modal.init(modalEl) : null;

  const mName = document.getElementById("mName");
  const mLastName = document.getElementById("mLastName");
  const mEmail = document.getElementById("mEmail");
  const mPhone = document.getElementById("mPhone");
  const mBirthdate = document.getElementById("mBirthdate");
  const mAge = document.getElementById("mAge");
  const mRoles = document.getElementById("mRoles");
  const mCreatedAt = document.getElementById("mCreatedAt");
  const mUrl = document.getElementById("mUrl");
  const mAddress = document.getElementById("mAddress");

  function showError(msg) {
    alert.textContent = msg;
    alert.style.display = "block";
  }

  try {
    const users = await apiFetch("/api/users", { token });
    tbody.innerHTML = users
      .map((u) => {
        const roles = (u.roles || []).map((r) => (typeof r === "string" ? r : r.name)).join(", ");
        const createdAt = u.createdAt ? new Date(u.createdAt).toLocaleString() : "";
        return `
          <tr>
            <td>${u.email || ""}</td>
            <td>${[u.name, u.lastName].filter(Boolean).join(" ")}</td>
            <td>${u.phoneNumber || ""}</td>
            <td>${roles}</td>
            <td>${createdAt}</td>
            <td>
              <a
                class="btn-small blue modal-trigger"
                href="#userModal"
                data-user='${JSON.stringify(u).replace(/'/g, "&apos;")}'
              >
                Ver
              </a>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-user]");
      if (!a) return;
      const data = a.getAttribute("data-user");
      if (!data) return;
      try {
        const user = JSON.parse(data);
        if (mName) mName.textContent = user.name || "";
        if (mLastName) mLastName.textContent = user.lastName || "";
        if (mEmail) mEmail.textContent = user.email || "";
        if (mPhone) mPhone.textContent = user.phoneNumber || "";
        if (mBirthdate)
          mBirthdate.textContent = user.birthdate
            ? String(user.birthdate).slice(0, 10)
            : "";
        if (mAge) mAge.textContent = user.age ?? "";
        if (mRoles)
          mRoles.textContent = (user.roles || [])
            .map((r) => (typeof r === "string" ? r : r.name))
            .join(", ");
        if (mCreatedAt)
          mCreatedAt.textContent = user.createdAt
            ? new Date(user.createdAt).toLocaleString()
            : "";
        if (mUrl) mUrl.textContent = user.url_profile || "";
        if (mAddress) mAddress.textContent = user.address || "";
        if (modal) modal.open();
      } catch {
        // ignore
      }
    });
  } catch (err) {
    if (err.status === 403) {
      window.location.href = "/403";
      return;
    }
    showError(err.message || "Error");
  }
});

