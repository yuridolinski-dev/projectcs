# Como conectar o formulário a uma planilha do Google (gratuito)

Esse passo a passo leva ~10 minutos. Ao final, toda resposta enviada no
site cai automaticamente como uma nova linha numa Planilha Google sua,
sem custo de hospedagem ou banco de dados.

## 1. Criar a planilha

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha em branco.
2. Renomeie para algo como **"Pesquisa Legal One — Respostas"**.

## 2. Criar o Apps Script

1. Na planilha, vá em **Extensões → Apps Script**.
2. Apague todo o conteúdo do editor que abrir.
3. Abra o arquivo `AppsScript_RecebePesquisa.gs` (entregue junto com o site),
   copie todo o conteúdo e cole no editor do Apps Script.
4. Clique no ícone de salvar (💾).

## 3. (Opcional, recomendado) Definir uma chave secreta

Isso evita que outra pessoa descubra a URL e mande dados falsos para sua planilha.

1. No topo do script, na linha `const SECRET = "";`, escreva uma senha qualquer entre as aspas, por exemplo `const SECRET = "legalone2026";`.
2. Salve.
3. No arquivo `config.js` do site, coloque a mesma senha em `GOOGLE_SHEETS_SECRET`.

Se preferir pular essa etapa, deixe os dois campos vazios — vai funcionar normalmente, só fica um pouco menos protegido contra uso indevido da URL.

## 4. Publicar como aplicativo da web

1. No editor do Apps Script, clique em **Implantar → Nova implantação**.
2. No tipo, escolha **Aplicativo da web**.
3. Configure:
   - **Executar como:** Eu (sua conta)
   - **Quem tem acesso:** Qualquer pessoa
4. Clique em **Implantar**.
5. A primeira vez vai pedir autorização — clique em **Autorizar acesso**, escolha sua conta Google e, se aparecer aviso de "app não verificado", clique em **Avançado → Acessar (nome do projeto), não seguro** (é seguro, o aviso aparece porque é um script pessoal seu, não publicado na loja do Google).
6. Copie a **URL do aplicativo da web** gerada. Ela termina em `/exec`.

## 5. Colar a URL no site

1. Abra o arquivo `config.js` do site.
2. Cole a URL copiada em `GOOGLE_SHEETS_WEBAPP_URL`:

```js
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvY8dmJsxpyP3Rbqwia1tdgtnSw2GWwItVTOcOUbtUSzxGedXfHyVl8TpjlTPkQ9-K/exec";
```

3. Salve e publique o site novamente (se já estiver hospedado, basta subir o `config.js` atualizado).

## 6. Testar

1. Abra o site e preencha a pesquisa até o final.
2. Clique em **Enviar Pesquisa**.
3. Volte na planilha — uma nova linha deve aparecer na aba **Respostas** em poucos segundos.

> Se a linha não aparecer: reabra o Apps Script, vá em **Implantar → Gerenciar implantações**, confira se está com a versão mais recente do código, e confirme que escolheu "Qualquer pessoa" no acesso. Você também pode abrir a URL `/exec` direto no navegador — se aparecer `{"ok":true,"status":"Apps Script ativo"}`, o serviço está no ar.

## Sempre que atualizar o código do Apps Script

Editar o `.gs` não atualiza a URL publicada automaticamente. É preciso ir em
**Implantar → Gerenciar implantações → ✏️ (editar) → Nova versão → Implantar**
para que as alterações entrem em vigor.

## 7. Painel administrativo (/admin)

O mesmo Apps Script também alimenta o painel administrativo do site
(`/admin`), que lê os dados da planilha em tempo real usando a mesma
URL configurada em `GOOGLE_SHEETS_WEBAPP_URL`. Não é preciso nenhuma
configuração extra — uma vez feito o passo 5, tanto o formulário público
quanto o painel administrativo já funcionam.

## 8. Notificações automáticas ("Sim, preciso de contato")

Toda vez que um cliente marcar **"Sim, preciso de contato"** no formulário,
o sistema pode avisar a equipe automaticamente por Discord e/ou e-mail.
Os dois são opcionais e independentes — configure um, outro, ou os dois.

### 8.1 Configurar o aviso no Discord

1. No Discord, vá até o canal onde quer receber os avisos (ex.: um canal
   `#pesquisa-clientes` ou `#suporte`).
2. Clique no ícone de engrenagem do canal (Editar Canal) → **Integrações**
   → **Webhooks** → **Novo Webhook**.
3. Dê um nome (ex.: "Pesquisa Legal One") e clique em **Copiar URL do Webhook**.
4. Volte no editor do Apps Script (Extensões → Apps Script, na sua planilha).
5. Cole a URL copiada na linha:
   ```js
   const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1516894684897611887/fITjrIngdtxpGMaTuBnUrHop5T2iCVdv4Dh6tVJdLJjwJI5OmyXO9SwPxUJQvdzd70-V";
   ```
6. Salve e gere uma nova implantação (veja a seção **"Sempre que atualizar
   o código do Apps Script"**, um pouco mais acima — é obrigatório repetir
   esse passo sempre que editar o código).

Pronto: a partir daí, cada pedido de apoio imediato chega no canal como uma
mensagem formatada, com nome do escritório, usuário, contato informado e notas.

### 8.2 Configurar o aviso por e-mail

1. No editor do Apps Script, localize a linha:
   ```js
   const NOTIFICATION_EMAILS = "";
   ```
2. Coloque o e-mail (ou e-mails, separados por vírgula) que devem receber o aviso:
   ```js
   const NOTIFICATION_EMAILS = "suporte.legalone@teksul.com.br";
   ```
3. Salve e gere uma nova implantação.
4. Na primeira vez que um e-mail for disparado (ou ao testar), o Google pode
   pedir autorização extra de envio de e-mail — autorize normalmente, é a
   mesma conta Google que já está vinculada à planilha.

> O envio de e-mail usa o serviço gratuito `MailApp` do Google, com um limite
> diário generoso para contas normais do Gmail (mais que suficiente para o
> volume de uma pesquisa de satisfação). Não há custo envolvido.

### 8.3 Testar as notificações

Preencha a pesquisa no site público, marque "Sim, preciso de contato" e
envie. Em poucos segundos a mensagem deve aparecer no Discord e/ou chegar
no e-mail configurado, além da linha normal ser adicionada na planilha.

## 9. Senha do painel administrativo

O painel (`/admin`) agora pede uma senha antes de mostrar qualquer dado.
Veja as instruções completas dentro do próprio `config.js`, na seção
**"SENHA DO PAINEL ADMINISTRATIVO"** — resumindo:

1. Abra o `/admin` no navegador (mesmo sem senha configurada, ele libera
   o acesso e avisa no console que está sem proteção).
2. Abra o Console do navegador (F12 → aba Console).
3. Digite: `await hashAdminPassword("sua-senha-aqui")` e aperte Enter.
4. Copie o código gerado e cole em `ADMIN_PASSWORD_HASH` no `config.js`.
5. Publique o site novamente.

A senha de exemplo deixada no projeto é `legalone2026` — **troque antes
de publicar**, ou qualquer pessoa que tenha visto este guia conseguirá
acessar o painel.

> Por ser um site estático, essa senha é uma barreira de front-end: reduz
> bastante o acesso casual, mas alguém com conhecimento técnico avançado
> e muito tempo disponível ainda poderia, em teoria, tentar descobrir a
> senha por força bruta offline a partir do hash. Para uma proteção mais
> forte (ex.: bloqueio após tentativas, login por e-mail/Google, expiração
> de senha), seria necessário um backend — posso implementar se em algum
> momento isso se tornar prioridade.

## Por que essa abordagem é gratuita e sem servidor próprio

O Apps Script roda dentro da infraestrutura do Google, vinculado à sua
conta gratuita do Gmail/Google Drive. Não há servidor para manter, não há
cobrança por uso dentro de limites normais de um formulário institucional,
e os dados ficam 100% dentro do seu Google Drive, sob seu controle.
