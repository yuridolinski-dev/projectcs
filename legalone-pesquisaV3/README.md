# Pesquisa de Relacionamento e Retenção de Clientes — Legal One

Site estático (HTML/CSS/JS puro, sem build) para coletar respostas de
satisfação dos clientes do sistema Legal One, com painel administrativo
e gravação automática em uma Planilha Google.

## Estrutura de arquivos

```
index.html         → formulário público (página inicial)
styles.css          → estilos do formulário público
script.js            → lógica do formulário (máscaras, validação, envio)
config.js            → URL da planilha conectada (você edita isso)
admin/
  index.html         → painel administrativo (fica em /admin)
  admin.css
  admin.js
AppsScript_RecebePesquisa.gs  → código para colar no Google Apps Script
GOOGLE_SHEETS_SETUP.md         → passo a passo de configuração da planilha
```

## Por que `/admin` funciona sem nenhuma configuração extra

A Vercel (e qualquer hospedagem de site estático) serve automaticamente
o arquivo `admin/index.html` quando alguém acessa `/admin`. Não é preciso
criar rota, redirecionamento, ou arquivo de configuração adicional — basta
manter essa estrutura de pastas exatamente como está.

Exemplo: se o domínio for `legalonecs.vercel.app`:
- `legalonecs.vercel.app` → formulário público
- `legalonecs.vercel.app/admin` → painel administrativo

O link do painel **não aparece em nenhum lugar visível do site público** —
só quem souber a URL consegue acessar.

> Quer uma camada extra de proteção (senha para abrir o `/admin`)? Isso
> exige um pouco mais de infraestrutura (ex.: Vercel com middleware de
> autenticação, ou Google Sign-In). Posso implementar se for importante
> para vocês — me avise.

## Configurando a gravação dos dados (obrigatório)

Sem esse passo, as respostas ficam salvas apenas no navegador de quem
respondeu (modo de backup local) e não aparecem centralizadas no painel.

Siga o passo a passo completo em **GOOGLE_SHEETS_SETUP.md**. Resumo:

1. Criar uma Planilha Google.
2. Colar o conteúdo de `AppsScript_RecebePesquisa.gs` no Apps Script da planilha.
3. Publicar como "Aplicativo da Web".
4. Colar a URL gerada em `config.js`.

Depois disso, toda resposta enviada no formulário público:
- grava uma nova linha na planilha automaticamente;
- aparece em tempo real no painel administrativo (`/admin`), com KPIs,
  gráficos e a lista completa de respostas.

## Personalizações pendentes antes de publicar

- **Logo do escritório**: o espaço reservado fica no topo do site
  (`brand__logo-slot` em `index.html`); substitua pelo `<img>` do logo real.
- **WhatsApp do rodapé**: troque o número em `index.html`
  (procure por `wa.me/5551999999999`) pelo WhatsApp real, sempre no
  formato `55` + DDD + número, sem espaços ou símbolos.
- **E-mail de contato**: troque `contato@seudominio.com.br` pelo e-mail real
  (aparece duas vezes: no rodapé do `index.html` e no link `mailto:`).

## Exportar respostas para Excel

No painel administrativo, o botão **"Exportar (Excel/CSV)"** gera um
arquivo `.csv` com todas as respostas, já com acentuação correta — pode
abrir direto no Excel ou Google Sheets (embora, com a integração feita,
a planilha já fique sempre atualizada automaticamente).

## Hospedagem

Qualquer hospedagem de arquivos estáticos serve (Vercel, Netlify, GitHub
Pages, etc.). Não é necessário Node.js, build step, nem banco de dados
próprio — toda a "infraestrutura" de dados vive no Google Sheets.
