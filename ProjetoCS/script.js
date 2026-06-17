// ============================================================
// Pesquisa de Relacionamento e Retenção de Clientes — Legal One
// Lógica do formulário: máscaras, validação, estrelas, progresso
// Persistência local (chave compartilhada com o dashboard)
// ============================================================

const MODULES = [
  "Agenda",
  "Publicações",
  "Processos",
  "Serviços",
  "Contratos",
  "Financeiro",
  "Faturamento",
  "Boletos",
  "GED",
  "Time Sheet",
  "Legal One Conecta",
];

const STORAGE_KEY = "legalone_pesquisa_respostas_v1";

// ---------- Helpers de storage ----------
function loadResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Falha ao ler respostas salvas:", e);
    return [];
  }
}

function saveResponse(entry) {
  const all = loadResponses();
  all.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// ---------- Construção dinâmica dos grids de módulos ----------
function buildModuleGrid(containerId, namePrefix) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = MODULES.map((mod, i) => {
    const id = `${namePrefix}-${i}`;
    return `
      <div class="check-tile">
        <input type="checkbox" id="${id}" name="${namePrefix}" value="${mod}">
        <label for="${id}"><span class="box" aria-hidden="true"></span>${mod}</label>
      </div>
    `;
  }).join("");
}

buildModuleGrid("modulesUsedGrid", "modulesUsed");
buildModuleGrid("modulesInterestGrid", "modulesInterest");

// ---------- Máscara de CNPJ ----------
const cnpjInput = document.getElementById("cnpj");

function maskCNPJ(value) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  let out = digits;
  if (digits.length > 12) {
    out = digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, "$1.$2.$3/$4-$5");
  } else if (digits.length > 8) {
    out = digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, "$1.$2.$3/$4");
  } else if (digits.length > 5) {
    out = digits.replace(/^(\d{2})(\d{3})(\d{0,3})$/, "$1.$2.$3");
  } else if (digits.length > 2) {
    out = digits.replace(/^(\d{2})(\d{0,3})$/, "$1.$2");
  }
  return out;
}

cnpjInput.addEventListener("input", (e) => {
  const pos = e.target.selectionStart;
  const before = e.target.value.length;
  e.target.value = maskCNPJ(e.target.value);
  const after = e.target.value.length;
  // ajuste simples de cursor ao crescer a máscara
  const diff = after - before;
  if (pos !== null) e.target.setSelectionRange(pos + diff, pos + diff);
  clearError("cnpj");
});

function isValidCNPJFormatOrEmpty(value) {
  if (!value.trim()) return true; // opcional
  return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value.trim());
}

// ---------- Estrelas de avaliação (1 a 10) ----------
function buildStars(containerId, hiddenInputId) {
  const container = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenInputId);
  container.innerHTML = "";

  for (let i = 1; i <= 10; i++) {
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "currentColor");
    star.classList.add("stars__star");
    star.setAttribute("role", "radio");
    star.setAttribute("tabindex", "0");
    star.setAttribute("aria-checked", "false");
    star.setAttribute("aria-label", `Nota ${i}`);
    star.dataset.value = i;
    star.innerHTML = `<path d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17l-6.1 3.7 1.5-6.7-5.1-4.6 6.8-.7L12 2.5z"/>`;

    const select = () => {
      hidden.value = i;
      [...container.children].forEach((s) => {
        const v = Number(s.dataset.value);
        s.classList.toggle("is-filled", v <= i);
        s.setAttribute("aria-checked", v === i ? "true" : "false");
      });
      const errId = hiddenInputId === "ratingSystem" ? "ratingSystem" : "ratingSupport";
      clearError(errId);
      updateProgress();
    };

    star.addEventListener("click", select);
    star.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        select();
      }
    });

    container.appendChild(star);
  }

  const valueTag = document.createElement("span");
  valueTag.className = "stars__value";
  valueTag.textContent = "—";
  container.appendChild(valueTag);

  // atualiza o "valueTag" sempre que muda
  const observer = new MutationObserver(() => {
    valueTag.textContent = hidden.value ? `${hidden.value}/10` : "—";
  });
  observer.observe(hidden, { attributes: true });

  // como o input hidden não dispara mutação por .value diretamente em todos browsers de forma observável,
  // garantimos a atualização manualmente também:
  container.addEventListener("click", () => {
    valueTag.textContent = hidden.value ? `${hidden.value}/10` : "—";
  });
  container.addEventListener("keyup", () => {
    valueTag.textContent = hidden.value ? `${hidden.value}/10` : "—";
  });
}

buildStars("starsSystem", "ratingSystem");
buildStars("starsSupport", "ratingSupport");

// ---------- Campo dinâmico de contato (apoio imediato) ----------
const supportYes = document.getElementById("supportYes");
const supportNo = document.getElementById("supportNo");
const contactReveal = document.getElementById("contactReveal");
const contactInfo = document.getElementById("contactInfo");

function toggleContactReveal() {
  const open = supportYes.checked;
  contactReveal.classList.toggle("is-open", open);
  contactInfo.required = open;
  if (!open) {
    clearError("contactInfo");
    contactInfo.value = contactInfo.value; // mantém valor, apenas deixa de ser obrigatório
  }
  clearError("needSupport");
  updateProgress();
}

supportYes.addEventListener("change", toggleContactReveal);
supportNo.addEventListener("change", toggleContactReveal);

// ---------- Validação ----------
function setError(fieldKey, show) {
  const errEl = document.getElementById(`err-${fieldKey}`);
  if (errEl) errEl.classList.toggle("is-visible", show);
  const inputEl = document.getElementById(fieldKey);
  if (inputEl && inputEl.tagName !== "DIV") {
    inputEl.setAttribute("aria-invalid", show ? "true" : "false");
  }
}

function clearError(fieldKey) {
  setError(fieldKey, false);
}

document.getElementById("officeName").addEventListener("input", () => clearError("officeName"));
document.getElementById("userName").addEventListener("input", () => clearError("userName"));
contactInfo.addEventListener("input", () => clearError("contactInfo"));

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
}

function isValidContact(value) {
  const v = value.trim();
  if (!v) return false;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = v.replace(/\D/g, "");
  return emailRe.test(v) || phoneDigits.length >= 10;
}

function validateForm() {
  let valid = true;

  const officeName = document.getElementById("officeName").value.trim();
  if (!officeName) {
    setError("officeName", true);
    valid = false;
  }

  const cnpj = cnpjInput.value;
  if (!isValidCNPJFormatOrEmpty(cnpj)) {
    setError("cnpj", true);
    valid = false;
  }

  const userName = document.getElementById("userName").value.trim();
  if (!userName) {
    setError("userName", true);
    valid = false;
  }

  const modulesUsed = getCheckedValues("modulesUsed");
  if (modulesUsed.length === 0) {
    setError("modulesUsed", true);
    valid = false;
  } else {
    setError("modulesUsed", false);
  }

  const ratingSystem = document.getElementById("ratingSystem").value;
  if (!ratingSystem) {
    setError("ratingSystem", true);
    valid = false;
  }

  const ratingSupport = document.getElementById("ratingSupport").value;
  if (!ratingSupport) {
    setError("ratingSupport", true);
    valid = false;
  }

  const needSupportChecked = supportYes.checked || supportNo.checked;
  if (!needSupportChecked) {
    setError("needSupport", true);
    valid = false;
  }

  if (supportYes.checked) {
    if (!isValidContact(contactInfo.value)) {
      setError("contactInfo", true);
      valid = false;
    }
  }

  return valid;
}

// ---------- Progresso (trilho lateral) ----------
const railItems = [...document.querySelectorAll(".rail__item")];
const progressPercentEl = document.getElementById("progressPercent");

function sectionIsComplete(sectionId) {
  switch (sectionId) {
    case "s1":
      return !!document.getElementById("officeName").value.trim();
    case "s2": // CNPJ é opcional — considera "feito" se preenchido corretamente ou se outro campo avançou
      return isValidCNPJFormatOrEmpty(cnpjInput.value) && cnpjInput.value.trim().length > 0;
    case "s3":
      return !!document.getElementById("userName").value.trim();
    case "s4":
      return getCheckedValues("modulesUsed").length > 0;
    case "s5":
      return getCheckedValues("modulesInterest").length > 0;
    case "s6":
      return !!document.getElementById("ratingSystem").value && !!document.getElementById("ratingSupport").value;
    case "s7":
      if (!(supportYes.checked || supportNo.checked)) return false;
      if (supportYes.checked) return isValidContact(contactInfo.value);
      return true;
    default:
      return false;
  }
}

// mapeia os itens do rail (7 itens visuais) às seções reais do form
// rail: Escritório(1)->s1, CNPJ(2)->s2(virtual,dentro do card s1), Responsável(3)->s3,
// Módulos em uso(4)->s4, Módulos de interesse(5)->s5, Avaliação(6)->s6, Apoio imediato(7)->s7
const railMap = {
  s1: () => sectionIsComplete("s1"),
  s2: () => sectionIsComplete("s2"),
  s3: () => sectionIsComplete("s3"),
  s4: () => sectionIsComplete("s4"),
  s5: () => sectionIsComplete("s5"),
  s6: () => sectionIsComplete("s6"),
  s7: () => sectionIsComplete("s7"),
};

let currentActiveIndex = 0;

function updateProgress() {
  let doneCount = 0;
  railItems.forEach((item, idx) => {
    const key = item.dataset.section;
    const done = railMap[key] ? railMap[key]() : false;
    item.classList.toggle("is-done", done);
    if (done) doneCount++;
  });

  // marca o próximo item incompleto como "ativo"
  railItems.forEach((item) => item.classList.remove("is-active"));
  const nextIncomplete = railItems.find((item) => !item.classList.contains("is-done"));
  if (nextIncomplete) nextIncomplete.classList.add("is-active");

  const percent = Math.round((doneCount / railItems.length) * 100);
  progressPercentEl.textContent = `${percent}%`;
}

// listeners genéricos para recalcular progresso
document.getElementById("survey").addEventListener("input", updateProgress);
document.getElementById("survey").addEventListener("change", updateProgress);

// ---------- Scroll-spy simples para destacar seção visível (opcional, refina UX) ----------
const sectionEls = ["s1", "s3", "s4", "s5", "s6", "s7"].map((id) => document.getElementById(id));

// ---------- Envio do formulário ----------
const form = document.getElementById("survey");
const successOverlay = document.getElementById("successOverlay");
const closeSuccessBtn = document.getElementById("closeSuccessBtn");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const ok = validateForm();
  if (!ok) {
    const firstError = document.querySelector(".field__error.is-visible");
    if (firstError) {
      firstError.closest(".section-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  submitBtn.disabled = true;

  const entry = {
    id: `resp_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    officeName: document.getElementById("officeName").value.trim(),
    cnpj: cnpjInput.value.trim(),
    userName: document.getElementById("userName").value.trim(),
    modulesUsed: getCheckedValues("modulesUsed"),
    modulesInterest: getCheckedValues("modulesInterest"),
    ratingSystem: Number(document.getElementById("ratingSystem").value),
    justifySystem: document.getElementById("justifySystem").value.trim(),
    ratingSupport: Number(document.getElementById("ratingSupport").value),
    justifySupport: document.getElementById("justifySupport").value.trim(),
    needSupport: supportYes.checked ? "sim" : "nao",
    contactInfo: supportYes.checked ? contactInfo.value.trim() : "",
  };

  saveResponse(entry);

  setTimeout(() => {
    successOverlay.classList.add("is-open");
    submitBtn.disabled = false;
  }, 350);
});

closeSuccessBtn.addEventListener("click", () => {
  successOverlay.classList.remove("is-open");
  form.reset();
  document.getElementById("ratingSystem").value = "";
  document.getElementById("ratingSupport").value = "";
  [...document.querySelectorAll(".stars__star")].forEach((s) => s.classList.remove("is-filled"));
  [...document.querySelectorAll(".stars__value")].forEach((v) => (v.textContent = "—"));
  contactReveal.classList.remove("is-open");
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// inicializa progresso
updateProgress();