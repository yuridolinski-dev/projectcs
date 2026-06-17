// ============================================================
// CONFIGURAÇÃO — Integração com Google Sheets (Apps Script)
// ============================================================
//
// 1. Siga o passo a passo do arquivo GOOGLE_SHEETS_SETUP.md
//    para criar a planilha e publicar o Apps Script como Web App.
// 2. Cole abaixo a URL gerada (termina em /exec).
// 3. Sem essa URL, as respostas continuam sendo salvas apenas
//    no navegador do cliente (localStorage) — não somem, mas
//    não ficam centralizadas para toda a equipe.
//
// Exemplo de URL válida:
// "https://script.google.com/macros/s/AKfycb.../exec"

const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxASnKtPaL01ki3fvZfpcF91fmmu5cioPvgFyO-R6z6EsCUzj-m_AYZsEMDMobK64tm/exec";

// Chave secreta opcional (mesma definida no Apps Script) para
// reduzir o risco de outra pessoa enviar dados para sua planilha
// chamando a URL diretamente. Deixe igual nos dois lados ou deixe
// ambos em branco.
const GOOGLE_SHEETS_SECRET = "legalonecs2026";
