// ============================================================
// Painel Administrativo — Pesquisa Legal One
// Lê dados do Google Sheets (Apps Script) com fallback local
// ============================================================

const STORAGE_KEY = "legalone_pesquisa_respostas_v1";

const statusPill = document.getElementById("statusPill");
const mainEl = document.getElementById("adminMain");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const searchInput = document.getElementById("searchInput");

let allRows = [];
let charts = {};

function setStatus(mode) {
  statusPill.className = `status-pill ${mode === "live" ? "is-live" : "is-local"}`;
  statusPill.innerHTML = mode === "live"
    ? `<span class="dot"></span> Conectado ao Google Sheets`
    : `<span class="dot"></span> Exibindo dados locais deste navegador`;
}

function loadLocalResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function loadFromSheets() {
  if (!GOOGLE_SHEETS_WEBAPP_URL) return null;
  try {
    const url = new URL(GOOGLE_SHEETS_WEBAPP_URL);
    url.searchParams.set("action", "list");
    if (GOOGLE_SHEETS_SECRET) url.searchParams.set("secret", GOOGLE_SHEETS_SECRET);

    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok) return null;
    return data.rows || [];
  } catch (err) {
    console.error("Falha ao buscar dados do Google Sheets:", err);
    return null;
  }
}

async function loadData() {
  const sheetsRows = await loadFromSheets();
  if (sheetsRows !== null) {
    setStatus("live");
    return sheetsRows;
  }
  setStatus("local");
  return loadLocalResponses();
}

// ---------- Renderização ----------

function renderEmptyState() {
  mainEl.innerHTML = `
    <div class="admin-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
      <h2>Nenhuma resposta registrada ainda</h2>
      <p>Assim que clientes responderem à pesquisa, os resultados aparecerão aqui automaticamente — com gráficos, notas médias e a lista completa de respostas.</p>
    </div>
  `;
}

function average(nums) {
  const valid = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function countByModule(rows, field) {
  const counts = {};
  rows.forEach((r) => {
    (r[field] || []).forEach((mod) => {
      counts[mod] = (counts[mod] || 0) + 1;
    });
  });
  return counts;
}

function scoreClass(score) {
  if (score >= 8) return "score-pill--high";
  if (score >= 5) return "score-pill--mid";
  return "score-pill--low";
}

function renderDashboard(rows) {
  allRows = rows;

  if (!rows.length) {
    renderEmptyState();
    return;
  }

  const avgSystem = average(rows.map((r) => Number(r.ratingSystem)));
  const avgSupport = average(rows.map((r) => Number(r.ratingSupport)));
  const pendingSupport = rows.filter((r) => r.needSupport === "sim").length;
  const usedCounts = countByModule(rows, "modulesUsed");
  const interestCounts = countByModule(rows, "modulesInterest");

  mainEl.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-card__label">Respostas recebidas</div>
        <div class="kpi-card__value">${rows.length}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">Nota média do sistema</div>
        <div class="kpi-card__value">${avgSystem.toFixed(1)} <small>/ 10</small></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">Nota média do suporte</div>
        <div class="kpi-card__value">${avgSupport.toFixed(1)} <small>/ 10</small></div>
      </div>
      <div class="kpi-card ${pendingSupport > 0 ? "kpi-card--alert" : ""}">
        <div class="kpi-card__label">Aguardando contato</div>
        <div class="kpi-card__value">${pendingSupport}</div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card__head">
          <div>
            <p class="chart-card__title">Módulos mais utilizados</p>
            <p class="chart-card__sub">Quantas respostas citaram cada módulo como em uso</p>
          </div>
        </div>
        <div class="chart-card__canvas-wrap"><canvas id="chartUsed"></canvas></div>
      </div>

      <div class="chart-card">
        <div class="chart-card__head">
          <div>
            <p class="chart-card__title">Interesse em novos módulos</p>
            <p class="chart-card__sub">Oportunidades de expansão identificadas</p>
          </div>
        </div>
        <div class="chart-card__canvas-wrap"><canvas id="chartInterest"></canvas></div>
      </div>

      <div class="chart-card">
        <div class="chart-card__head">
          <div>
            <p class="chart-card__title">Distribuição de notas — Sistema</p>
            <p class="chart-card__sub">Quantas respostas em cada faixa de nota (1 a 10)</p>
          </div>
        </div>
        <div class="chart-card__canvas-wrap"><canvas id="chartSystemDist"></canvas></div>
      </div>

      <div class="chart-card">
        <div class="chart-card__head">
          <div>
            <p class="chart-card__title">Distribuição de notas — Suporte</p>
            <p class="chart-card__sub">Quantas respostas em cada faixa de nota (1 a 10)</p>
          </div>
        </div>
        <div class="chart-card__canvas-wrap"><canvas id="chartSupportDist"></canvas></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-card__head">
        <h2 class="table-card__title">Respostas individuais</h2>
        <div class="table-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" id="searchInputInner" placeholder="Buscar por escritório ou usuário...">
        </div>
      </div>
      <div class="table-scroll">
        <table class="responses-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Escritório</th>
              <th>CNPJ</th>
              <th>Usuário</th>
              <th>Módulos em uso</th>
              <th>Interesse</th>
              <th>Sistema</th>
              <th>Suporte</th>
              <th>Apoio</th>
              <th>Contato</th>
            </tr>
          </thead>
          <tbody id="responsesTbody"></tbody>
        </table>
      </div>
      <p class="table-card__footnote">Mostrando <strong id="rowCountLabel"></strong> de ${rows.length} respostas.</p>
    </div>
  `;

  renderTable(rows);
  renderCharts(rows, usedCounts, interestCounts);

  document.getElementById("searchInputInner").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = !term
      ? rows
      : rows.filter((r) =>
          (r.officeName || "").toLowerCase().includes(term) ||
          (r.userName || "").toLowerCase().includes(term)
        );
    renderTable(filtered);
  });
}

function renderTable(rows) {
  const tbody = document.getElementById("responsesTbody");
  const rowCountLabel = document.getElementById("rowCountLabel");
  if (!tbody) return;

  rowCountLabel.textContent = rows.length;

  if (!rows.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="10">Nenhuma resposta encontrada para esse filtro.</td></tr>`;
    return;
  }

  const sorted = [...rows].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  tbody.innerHTML = sorted.map((r) => {
    const date = r.submittedAt ? new Date(r.submittedAt) : null;
    const dateLabel = date && !isNaN(date)
      ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
        " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "—";

    const usedTags = (r.modulesUsed || []).map((m) => `<span class="tag">${m}</span>`).join("") || "—";
    const interestTags = (r.modulesInterest || []).map((m) => `<span class="tag">${m}</span>`).join("") || "—";

    const sys = Number(r.ratingSystem);
    const sup = Number(r.ratingSupport);

    const supportCell = r.needSupport === "sim"
      ? `<span class="support-flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Sim</span>`
      : "Não";

    return `
      <tr>
        <td>${dateLabel}</td>
        <td><strong>${escapeHtml(r.officeName || "—")}</strong></td>
        <td>${escapeHtml(r.cnpj || "—")}</td>
        <td>${escapeHtml(r.userName || "—")}</td>
        <td>${usedTags}</td>
        <td>${interestTags}</td>
        <td><span class="score-pill ${scoreClass(sys)}">${isNaN(sys) ? "—" : sys}</span></td>
        <td><span class="score-pill ${scoreClass(sup)}">${isNaN(sup) ? "—" : sup}</span></td>
        <td>${supportCell}</td>
        <td>${escapeHtml(r.contactInfo || "—")}</td>
      </tr>
    `;
  }).join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Gráficos (Chart.js) ----------

function destroyCharts() {
  Object.values(charts).forEach((c) => c && c.destroy());
  charts = {};
}

function distribution(rows, field) {
  const buckets = Array.from({ length: 10 }, () => 0);
  rows.forEach((r) => {
    const v = Number(r[field]);
    if (v >= 1 && v <= 10) buckets[v - 1]++;
  });
  return buckets;
}

function renderCharts(rows, usedCounts, interestCounts) {
  destroyCharts();

  const palette = {
    green: "#00A88A",
    greenSoft: "#7FD0BD",
    navy: "#1A1E29",
    gold: "#C9A227",
    grid: "#E3E6EC",
    text: "#5B6478",
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: palette.text, font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: palette.grid }, ticks: { color: palette.text, font: { size: 11 }, precision: 0 } },
    },
  };

  const moduleLabels = [
    "Agenda", "Publicações", "Processos", "Serviços", "Contratos",
    "Financeiro", "Faturamento", "Boletos", "GED", "Time Sheet", "Legal One Conecta",
  ];

  charts.used = new Chart(document.getElementById("chartUsed"), {
    type: "bar",
    data: {
      labels: moduleLabels,
      datasets: [{ data: moduleLabels.map((m) => usedCounts[m] || 0), backgroundColor: palette.green, borderRadius: 5, maxBarThickness: 28 }],
    },
    options: { ...baseOptions, indexAxis: "y" },
  });

  charts.interest = new Chart(document.getElementById("chartInterest"), {
    type: "bar",
    data: {
      labels: moduleLabels,
      datasets: [{ data: moduleLabels.map((m) => interestCounts[m] || 0), backgroundColor: palette.gold, borderRadius: 5, maxBarThickness: 28 }],
    },
    options: { ...baseOptions, indexAxis: "y" },
  });

  const distLabels = Array.from({ length: 10 }, (_, i) => String(i + 1));

  charts.systemDist = new Chart(document.getElementById("chartSystemDist"), {
    type: "bar",
    data: {
      labels: distLabels,
      datasets: [{ data: distribution(rows, "ratingSystem"), backgroundColor: palette.navy, borderRadius: 5, maxBarThickness: 30 }],
    },
    options: baseOptions,
  });

  charts.supportDist = new Chart(document.getElementById("chartSupportDist"), {
    type: "bar",
    data: {
      labels: distLabels,
      datasets: [{ data: distribution(rows, "ratingSupport"), backgroundColor: palette.greenSoft, borderRadius: 5, maxBarThickness: 30 }],
    },
    options: baseOptions,
  });
}

// ---------- Exportação para Excel/CSV ----------

function exportToCsv() {
  if (!allRows.length) return;

  const headers = [
    "Data/Hora", "Escritório", "CNPJ", "Usuário",
    "Módulos utilizados", "Módulos de interesse",
    "Nota sistema", "Justificativa sistema",
    "Nota suporte", "Justificativa suporte",
    "Precisa de apoio imediato", "Contato informado",
  ];

  const lines = [headers.join(";")];

  allRows.forEach((r) => {
    const row = [
      r.submittedAt || "",
      r.officeName || "",
      r.cnpj || "",
      r.userName || "",
      (r.modulesUsed || []).join(", "),
      (r.modulesInterest || []).join(", "),
      r.ratingSystem ?? "",
      r.justifySystem || "",
      r.ratingSupport ?? "",
      r.justifySupport || "",
      r.needSupport === "sim" ? "Sim" : "Não",
      r.contactInfo || "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(row.join(";"));
  });

  const csvContent = "\uFEFF" + lines.join("\r\n"); // BOM para acentos no Excel
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pesquisa_legalone_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", exportToCsv);

refreshBtn.addEventListener("click", async () => {
  refreshBtn.disabled = true;
  const rows = await loadData();
  renderDashboard(rows);
  refreshBtn.disabled = false;
});

// ---------- Inicialização ----------

(async function init() {
  const rows = await loadData();
  renderDashboard(rows);
})();
