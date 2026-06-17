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

const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvY8dmJsxpyP3Rbqwia1tdgtnSw2GWwItVTOcOUbtUSzxGedXfHyVl8TpjlTPkQ9-K/exec";

// Chave secreta opcional (mesma definida no Apps Script) para
// reduzir o risco de outra pessoa enviar dados para sua planilha
// chamando a URL diretamente. Deixe igual nos dois lados ou deixe
// ambos em branco.
const GOOGLE_SHEETS_SECRET = "legalonecs2026";

// ============================================================
// SENHA DO PAINEL ADMINISTRATIVO (/admin)
// ============================================================
//
// Por segurança, NÃO colocamos a senha em texto puro aqui — em vez
// disso, guardamos o "hash" dela (um código gerado a partir da senha
// que não pode ser revertido facilmente). Mesmo alguém abrindo o
// código-fonte do site não vai conseguir ler a senha real.
//
// COMO DEFINIR/TROCAR A SENHA:
// 1. Abra a página /admin do site (a própria tela de login já é
//    suficiente, não precisa estar logado) e abra o Console do
//    navegador (F12 → aba "Console").
// 2. Digite o comando abaixo, troque "minhaSenhaForte123" pela senha
//    desejada, e aperte Enter:
//
//    await hashAdminPassword("minhaSenhaForte123")
//
// 3. Copie o texto gerado (uma sequência longa de letras e números)
//    e cole abaixo, substituindo o valor de ADMIN_PASSWORD_HASH.
// 4. Salve este arquivo e publique novamente o site.
//
// Hash correspondente à senha de exemplo "legalone2026" (TROQUE antes de publicar):
const ADMIN_PASSWORD_HASH =
  "801f2521677edae0faa73f566e947c5ae98b9499606a842b3fbab664a25f12e6";
