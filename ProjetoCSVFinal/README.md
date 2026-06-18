# Pesquisa de Relacionamento e Retenção de Clientes — Legal One

Site estático (HTML/CSS/JS puro, sem build) para coletar respostas de
satisfação dos clientes do sistema Legal One, com painel administrativo
protegido por senha, filtros, gráficos, notificações automáticas e
gravação em uma Planilha Google.

## Estrutura de arquivos

```
index.html                     → formulário público (página inicial)
styles.css                     → estilos do formulário público
script.js                      → lógica do formulário (máscaras, validação, envio)
config.js                      → URLs, chaves e senha do painel (você edita isso)
admin/
  index.html                   → painel administrativo (fica em /admin)
  admin.css
  admin.js                     → dados, filtros, gráficos, exportação
  auth.js                      → tela de login por senha
AppsScript_RecebePesquisa.gs   → código para colar no Google Apps Script
GOOGLE_SHEETS_SETUP.md         → passo a passo de configuração completa
```

## Por que `/admin` funciona sem nenhuma configuração extra

A Vercel (e qualquer hospedagem de site estático) serve automaticamente
o arquivo `admin/index.html` quando alguém acessa `/admin`. Não é preciso
criar rota, redirecionamento, ou arquivo de configuração adicional — basta
manter essa estrutura de pastas exatamente como está.

Exemplo: se o domínio for `legalonecs.vercel.app`:
- `legalonecs.vercel.app` → formulário público
- `legalonecs.vercel.app/admin` → painel administrativo (pede senha)

O link do painel não aparece em nenhum lugar visível do site público —
só quem souber a URL consegue chegar até a tela de login.

## Senha do painel administrativo

O `/admin` agora exige uma senha antes de mostrar qualquer dado. Por ser
um site 100% estático (sem servidor próprio), essa proteção funciona no
navegador: reduz bastante o acesso casual ou por curiosidade, mas não é
uma barreira de nível bancário — alguém com bastante conhecimento técnico
e tempo disponível poderia, em teoria, tentar quebrá-la offline a partir
do código-fonte. Para uma proteção mais forte (bloqueio por tentativas,
login via e-mail/Google, expiração de sessão no servidor) seria necessário
um backend — posso implementar se isso se tornar prioridade no futuro.

A senha de acesso já está configurada em `ADMIN_PASSWORD_HASH` (em
`config.js`). Para trocar por outra senha no futuro:

1. Abra a página `/admin` (a tela de login já é suficiente).
2. Abra o Console do navegador (F12 → aba "Console").
3. Digite `await hashAdminPassword("sua-nova-senha")` e aperte Enter.
4. Copie o código gerado e cole em `ADMIN_PASSWORD_HASH`, dentro de `config.js`.
5. Publique o site novamente.

A sessão de login dura enquanto a aba do navegador estiver aberta; ao
fechar e abrir de novo, a senha é solicitada outra vez. O botão "Sair"
no topo do painel também encerra a sessão imediatamente.

## Configurando a gravação dos dados (obrigatório)

Sem esse passo, as respostas ficam salvas apenas no navegador de quem
respondeu (modo de backup local) e não aparecem centralizadas no painel.

Siga o passo a passo completo em **GOOGLE_SHEETS_SETUP.md**. Resumo:

1. Criar uma Planilha Google.
2. Colar o conteúdo de `AppsScript_RecebePesquisa.gs` no Apps Script da planilha.
3. Publicar como "Aplicativo da Web".
4. Colar a URL gerada em `config.js`.

Depois disso, toda resposta enviada no formulário público grava uma nova
linha na planilha automaticamente e aparece em tempo real no painel
administrativo, com KPIs, gráficos e a lista completa de respostas.

## Notificações automáticas de apoio imediato

Quando um cliente marca **"Sim, preciso de contato"**, o Apps Script pode
avisar a equipe automaticamente por:

- **Discord**: cole a URL de um Webhook de canal em `DISCORD_WEBHOOK_URL`
  no arquivo `AppsScript_RecebePesquisa.gs`.
- **E-mail**: liste os e-mails (separados por vírgula) em
  `NOTIFICATION_EMAILS`, no mesmo arquivo.

Ambos são opcionais e independentes — o passo a passo completo (incluindo
como gerar a URL do Webhook no Discord) está na seção 8 do
**GOOGLE_SHEETS_SETUP.md**. Sempre que editar o `.gs`, é preciso gerar uma
nova implantação no Apps Script para a mudança valer (detalhes no guia).

## Filtros no painel administrativo

A tabela de respostas em `/admin` tem uma barra de filtros que permite:

- buscar por nome do escritório ou do usuário;
- mostrar só quem pediu apoio imediato (ou só quem não pediu);
- filtrar por módulo específico, tanto em uso quanto de interesse;
- filtrar por faixa de nota do sistema (promotores 8-10, neutros 5-7,
  críticos 0-4).

Os filtros podem ser combinados entre si, e o contador "Mostrando X de Y
respostas" reflete o resultado em tempo real.

## Configuração atual deste projeto

Os itens abaixo já estão configurados nesta versão dos arquivos — não é
preciso editar nada antes de publicar, a menos que algum dado mude:

- **Logo do escritório**: ainda é só o espaço reservado (`brand__logo-slot`
  em `index.html`); substitua pelo `<img>` do logo real quando tiver a imagem.
- **WhatsApp do rodapé**: (54) 3771-0909.
- **E-mail de contato (rodapé)**: suporte.legalone@teksul.com.br
- **Senha do painel admin**: já configurada (hash em `ADMIN_PASSWORD_HASH`).
- **Planilha do Google Sheets**: já conectada (`GOOGLE_SHEETS_WEBAPP_URL`
  e `GOOGLE_SHEETS_SECRET` em `config.js`, com o mesmo `SECRET` espelhado
  no Apps Script).
- **Webhook do Discord**: já configurado em `DISCORD_WEBHOOK_URL`.
- **E-mail de notificação de apoio imediato**: suporte.legalone@teksul.com.br
  (em `NOTIFICATION_EMAILS`, no Apps Script).

Pendente: a única peça que falta é colar o conteúdo atualizado de
`AppsScript_RecebePesquisa.gs` no editor do Apps Script da planilha (caso
ainda não tenha feito isso com esta versão) e gerar uma nova implantação —
veja "Sempre que atualizar o código do Apps Script" em
`GOOGLE_SHEETS_SETUP.md`.

## Exportar respostas para Excel

No painel administrativo, o botão "Exportar (Excel/CSV)" gera um arquivo
`.csv` com todas as respostas (respeitando os filtros não é necessário,
pois a exportação sempre traz o conjunto completo), já com acentuação
correta — pode abrir direto no Excel ou Google Sheets.

## Campo CPF/CNPJ

O campo aceita tanto CPF (pessoa física, para advogados autônomos) quanto
CNPJ (pessoa jurídica), com máscara automática: a formatação muda sozinha
conforme a quantidade de dígitos digitados (até 11 dígitos vira CPF, mais
que isso vira CNPJ). O campo continua opcional.

## Módulos de interesse para expansão

Além dos 11 módulos do Legal One, o campo "Módulos de interesse para
expansão" também lista oportunidades adicionais de produto: Criação de
Modelos, Intimações Eletrônicas, API, Assinatura Eletrônica, Workflow, IA
para Publicações e Analytics. Esses itens aparecem apenas no campo de
interesse — o campo "Módulos mais utilizados" continua com a lista
original de 11.

## Hospedagem

Qualquer hospedagem de arquivos estáticos serve (Vercel, Netlify, GitHub
Pages, etc.). Não é necessário Node.js, build step, nem banco de dados
próprio — toda a "infraestrutura" de dados vive no Google Sheets.
