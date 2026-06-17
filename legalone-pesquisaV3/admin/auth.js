// ============================================================
// Autenticação do Painel Administrativo
// ------------------------------------------------------------
// Proteção de front-end: impede acesso casual ao /admin sem a
// senha configurada em config.js (ADMIN_PASSWORD_HASH). Não é
// uma barreira inviolável (qualquer site 100% estático não pode
// oferecer isso sem um servidor próprio), mas bloqueia quem só
// digitar a URL ou encontrá-la por acaso.
//
// A sessão fica válida apenas durante a aba aberta (sessionStorage)
// — ao fechar o navegador, a senha é solicitada novamente.
// ============================================================

const AUTH_SESSION_KEY = "legalone_admin_autenticado";

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Disponível no console do navegador para gerar o hash de uma nova senha.
// Uso: await hashAdminPassword("minhaSenhaForte123")
window.hashAdminPassword = async function (plainPassword) {
  const hash = await sha256Hex(plainPassword);
  console.log("Hash gerado — cole em ADMIN_PASSWORD_HASH no config.js:\n", hash);
  return hash;
};

const loginScreen = document.getElementById("loginScreen");
const adminApp = document.getElementById("adminApp");
const loginForm = document.getElementById("loginForm");
const loginPasswordInput = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
}

function grantAccess() {
  sessionStorage.setItem(AUTH_SESSION_KEY, "true");
  loginScreen.style.display = "none";
  adminApp.hidden = false;
  document.dispatchEvent(new CustomEvent("admin:authenticated"));
}

function showLoginError() {
  loginError.classList.add("is-visible");
  loginPasswordInput.value = "";
  loginPasswordInput.focus();
}

if (!ADMIN_PASSWORD_HASH) {
  // Nenhuma senha configurada: libera o acesso direto, mas avisa no console
  // para quem for revisar o código que a proteção está desativada.
  console.warn(
    "ADMIN_PASSWORD_HASH não configurado em config.js — o painel está sem proteção por senha."
  );
  grantAccess();
} else if (isAuthenticated()) {
  grantAccess();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.classList.remove("is-visible");

  const typed = loginPasswordInput.value;
  if (!typed) return;

  const typedHash = await sha256Hex(typed);

  if (typedHash === ADMIN_PASSWORD_HASH) {
    grantAccess();
  } else {
    showLoginError();
  }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    window.location.reload();
  });
}
