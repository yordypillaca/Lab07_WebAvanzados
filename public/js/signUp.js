function passwordIsStrong(pw) {
  const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[#\$%&\*@]).{8,}$/;
  return re.test(pw);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signUpForm");
  const alert = document.getElementById("alert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alert.style.display = "none";

    const payload = {
      name: form.name.value.trim(),
      lastName: form.lastName.value.trim(),
      phoneNumber: form.phoneNumber.value.trim(),
      birthdate: form.birthdate.value,
      email: form.email.value.trim(),
      password: form.password.value,
      roles: ["user"],
    };

    if (!passwordIsStrong(payload.password)) {
      alert.textContent =
        "Password inválido: mínimo 8 caracteres, 1 mayúscula, 1 dígito y 1 especial (# $ % & * @).";
      alert.style.display = "block";
      return;
    }

    try {
      await apiFetch("/api/auth/signUp", { method: "POST", body: payload });
      window.location.href = "/signIn";
    } catch (err) {
      alert.textContent = err.message || "Error";
      alert.style.display = "block";
    }
  });
});

