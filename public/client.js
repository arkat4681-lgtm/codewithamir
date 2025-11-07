// === SIGNUP ===
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      name: name.value,
      email: email.value,
      password: password.value,
      phone: phone.value
    };
    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (res.ok) window.location.href = "login.html";
  });
}

// === LOGIN ===
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      email: email.value,
      password: password.value
    };
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) window.location.href = result.redirect;
  });
}

// === DASHBOARD ===
const userName = document.getElementById("userName");
if (userName) {
  fetch("/user")
    .then(res => res.json())
    .then(user => {
      userName.textContent = user.name;
      document.getElementById("userEmail").textContent = user.email;
      document.getElementById("userPhone").textContent = user.phone || "Not provided";
      if (user.photo) document.getElementById("profilePhoto").src = user.photo;
    });
}

// === PHOTO UPLOAD ===
const photoForm = document.getElementById("photoForm");
if (photoForm) {
  photoForm.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(photoForm);
    const res = await fetch("/upload-photo", { method: "POST", body: formData });
    const result = await res.json();
    if (result.photo) document.getElementById("profilePhoto").src = result.photo;
  });
}

// === LOGOUT ===
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch("/logout");
    window.location.href = "index.html";
  });
}
