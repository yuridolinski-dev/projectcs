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
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxASnKtPaL01ki3fvZfpcF91fmmu5cioPvgFyO-R6z6EsCUzj-m_AYZsEMDMobK64tm/exec";
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

## Por que essa abordagem é gratuita e sem servidor próprio

O Apps Script roda dentro da infraestrutura do Google, vinculado à sua
conta gratuita do Gmail/Google Drive. Não há servidor para manter, não há
cobrança por uso dentro de limites normais de um formulário institucional,
e os dados ficam 100% dentro do seu Google Drive, sob seu controle.
