// public/client.js
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const welcomeText = document.getElementById("welcome-text");
  const authButtons = document.getElementById("auth-buttons");
  const enrollLinks = document.querySelectorAll(".enroll-link");

  // Token helper (server returns token on login)
  function saveToken(token) {
    localStorage.setItem("cwa_token", token);
  }
  function getToken() {
    return localStorage.getItem("cwa_token");
  }
  function clearToken() {
    localStorage.removeItem("cwa_token");
  }

  // SIGNUP (POST to /api/signup)
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const phone = document.getElementById("signupPhone").value.trim();
      const country = document.getElementById("signupCountry").value;
      const password = document.getElementById("signupPassword").value;

      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, country, password }),
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message || "Signup successful. Please login.");
          window.location.href = "/login.html";
        } else {
          alert(data.error || "Signup failed.");
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  // LOGIN (POST to /api/login)
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          saveToken(data.token);
          alert("Login successful!");
          window.location.href = "/";
        } else {
          alert(data.error || "Login failed.");
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  // If logged in: fetch user info and show profile dropdown
  async function showProfileIfLoggedIn() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        clearToken();
        return;
      }
      const user = await res.json();
      if (welcomeText) {
        welcomeText.textContent = `Welcome back, ${user.name}! Ready to continue your web journey?`;
      }
      if (authButtons) {
        authButtons.innerHTML = `
          <div class="profile-dropdown">
            <button class="btn profile-btn">${user.name} ▼</button>
            <div class="profile-content">
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Phone:</strong> ${user.phone || "N/A"}</p>
              <button id="logoutBtn" class="logout-btn">Logout</button>
            </div>
          </div>
        `;
        document.getElementById("logoutBtn").addEventListener("click", async () => {
          await fetch("/api/logout", { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
          clearToken();
          window.location.reload();
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  showProfileIfLoggedIn();

  // Enroll links: build mailto dynamically (include course and user info if logged in)
  if (enrollLinks) {
    enrollLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const course = link.dataset.course || link.closest(".card").dataset.course || "Course";
        const token = getToken();

        // If not logged in, redirect to login
        if (!token) {
          if (confirm("You need to be logged in to enroll. Go to login page?")) {
            window.location.href = "/login.html";
          }
          return;
        }

        // fetch user info
        (async () => {
          try {
            const res = await fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
              clearToken();
              alert("Session expired. Please login again.");
              window.location.href = "/login.html";
              return;
            }
            const user = await res.json();

            const to = "arkat4681@gmail.com";
            const subject = encodeURIComponent(`Enrollment Request: ${course}`);
            const bodyLines = [
              `Hello Amir,`,
              ``,
              `I would like to enroll in the ${course} course.`,
              ``,
              `Here are my details:`,
              `Name: ${user.name}`,
              `Email: ${user.email}`,
              `Phone: ${user.phone || "N/A"}`,
              `Country: ${user.country || "N/A"}`,
              ``,
              `Thank you!`
            ];
            const body = encodeURIComponent(bodyLines.join("\n"));
            const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
            window.location.href = mailto;
          } catch (err) {
            alert("Error building email: " + err.message);
          }
        })();
      });
    });
  }
});
