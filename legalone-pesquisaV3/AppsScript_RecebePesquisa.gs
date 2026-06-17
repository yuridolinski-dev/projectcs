/**
 * ============================================================
 * Apps Script — Recebe respostas da Pesquisa Legal One
 * e grava cada uma como uma nova linha na planilha vinculada.
 * ============================================================
 *
 * COMO USAR (veja o passo a passo completo em GOOGLE_SHEETS_SETUP.md):
 * 1. Crie uma Planilha Google nova.
 * 2. Extensões → Apps Script.
 * 3. Apague o conteúdo padrão e cole este arquivo inteiro.
 * 4. (Opcional) Defina um valor para SECRET abaixo e use o mesmo
 *    valor em GOOGLE_SHEETS_SECRET no config.js do site.
 * 5. Implantar → Nova implantação → tipo "Aplicativo da web".
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 6. Copie a URL gerada (termina em /exec) e cole em
 *    GOOGLE_SHEETS_WEBAPP_URL no config.js do site.
 */

const SECRET = ""; // opcional — deixe igual ao GOOGLE_SHEETS_SECRET do site, ou deixe vazio nos dois lados

const SHEET_NAME = "Respostas";

// ============================================================
// NOTIFICAÇÕES — disparadas automaticamente quando alguém marcar
// "Sim, preciso de contato" no formulário.
// ============================================================

// Cole aqui a URL do Webhook do canal do Discord (veja o passo a passo
// em GOOGLE_SHEETS_SETUP.md, seção "Notificações"). Deixe em branco
// para desativar a notificação no Discord.
const DISCORD_WEBHOOK_URL = "";

// E-mails que devem receber um aviso quando houver pedido de apoio
// imediato. Pode colocar mais de um separado por vírgula, ex.:
// "equipe1@escritorio.com.br,equipe2@escritorio.com.br"
// Deixe em branco para desativar a notificação por e-mail.
const NOTIFICATION_EMAILS = "";

const HEADERS = [
  "Data/Hora",
  "Escritório",
  "CPF/CNPJ",
  "Usuário",
  "Módulos utilizados",
  "Módulos de interesse",
  "Nota sistema",
  "Justificativa sistema",
  "Nota suporte",
  "Justificativa suporte",
  "Precisa de apoio imediato",
  "Contato informado",
  "ID",
];

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (SECRET && data.secret !== SECRET) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getOrCreateSheet_();

    const dataHora = data.submittedAt
      ? new Date(data.submittedAt)
      : new Date();

    sheet.appendRow([
      dataHora,
      data.officeName || "",
      data.cnpj || "",
      data.userName || "",
      (data.modulesUsed || []).join(", "),
      (data.modulesInterest || []).join(", "),
      data.ratingSystem ?? "",
      data.justifySystem || "",
      data.ratingSupport ?? "",
      data.justifySupport || "",
      data.needSupport === "sim" ? "Sim" : "Não",
      data.contactInfo || "",
      data.id || "",
    ]);

    if (data.needSupport === "sim") {
      notifySupportRequest_(data, dataHora);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---------- Notificações ----------

function notifySupportRequest_(data, dataHora) {
  // Cada canal é tratado isoladamente: se um falhar (ex.: webhook
  // inválido), o outro ainda deve ser tentado, e a gravação na
  // planilha já aconteceu antes desta função ser chamada.
  try {
    sendDiscordNotification_(data, dataHora);
  } catch (err) {
    console.error("Falha ao notificar Discord:", err);
  }

  try {
    sendEmailNotification_(data, dataHora);
  } catch (err) {
    console.error("Falha ao notificar e-mail:", err);
  }
}

function sendDiscordNotification_(data, dataHora) {
  if (!DISCORD_WEBHOOK_URL) return;

  const dataFormatada = Utilities.formatDate(
    dataHora,
    Session.getScriptTimeZone(),
    "dd/MM/yyyy HH:mm"
  );

  const payload = {
    embeds: [
      {
        title: "🆘 Pedido de apoio imediato — Pesquisa Legal One",
        color: 15158332, // vermelho
        fields: [
          { name: "Escritório", value: data.officeName || "—", inline: true },
          { name: "Usuário", value: data.userName || "—", inline: true },
          { name: "Contato informado", value: data.contactInfo || "—", inline: false },
          { name: "Nota sistema", value: String(data.ratingSystem ?? "—"), inline: true },
          { name: "Nota suporte", value: String(data.ratingSupport ?? "—"), inline: true },
          { name: "Data/Hora", value: dataFormatada, inline: false },
        ],
      },
    ],
  };

  UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}

function sendEmailNotification_(data, dataHora) {
  if (!NOTIFICATION_EMAILS) return;

  const dataFormatada = Utilities.formatDate(
    dataHora,
    Session.getScriptTimeZone(),
    "dd/MM/yyyy HH:mm"
  );

  const assunto = `Pedido de apoio imediato — ${data.officeName || "Cliente"}`;

  const corpo =
    "Um cliente solicitou apoio imediato na Pesquisa Legal One.\n\n" +
    `Escritório: ${data.officeName || "—"}\n` +
    `Usuário: ${data.userName || "—"}\n` +
    `Contato informado: ${data.contactInfo || "—"}\n` +
    `Nota do sistema: ${data.ratingSystem ?? "—"}/10\n` +
    `Nota do suporte: ${data.ratingSupport ?? "—"}/10\n` +
    `Data/Hora: ${dataFormatada}\n`;

  NOTIFICATION_EMAILS.split(",").forEach((email) => {
    const trimmed = email.trim();
    if (trimmed) {
      MailApp.sendEmail(trimmed, assunto, corpo);
    }
  });
}

// Permite abrir a URL no navegador apenas para checar se o serviço está no ar,
// e também serve como endpoint de leitura para o painel administrativo do site.
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : null;

  if (action === "list") {
    if (SECRET && (!e.parameter || e.parameter.secret !== SECRET)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, rows: listAllRows_() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, status: "Apps Script ativo" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function listAllRows_() {
  const sheet = getOrCreateSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  return values.map((row) => ({
    submittedAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
    officeName: row[1],
    cnpj: row[2],
    userName: row[3],
    modulesUsed: row[4] ? String(row[4]).split(",").map((s) => s.trim()).filter(Boolean) : [],
    modulesInterest: row[5] ? String(row[5]).split(",").map((s) => s.trim()).filter(Boolean) : [],
    ratingSystem: row[6],
    justifySystem: row[7],
    ratingSupport: row[8],
    justifySupport: row[9],
    needSupport: row[10] === "Sim" ? "sim" : "nao",
    contactInfo: row[11],
    id: row[12],
  }));
}
