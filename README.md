# Vida de Dev

Jogo de simulação em formato de celular. Você faz sistemas sob medida em casa e tenta pagar R$ 9 mil de contas todo dia 5 sem se destruir no caminho.

**Jogue:** https://jonibernardes.github.io/vida-de-dev/

**Servidor de contas:** https://vida-de-dev-api.jonibernardes.workers.dev — já no ar desde 07/09/2026, com o KV `VIDA_DE_DEV` na conta joni.bernardes@gmail.com. O `deploy.sh` abaixo serve pra subir de novo ou recriar em outra conta.

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `index.html` | O jogo inteiro. Um arquivo, sem dependência, roda direto do navegador |
| `worker.js` | O servidor de contas e partidas. Cloudflare Worker + KV |

## Atalhos de teste

Cole na barra de endereço, depois do endereço do jogo:

```
?v=demo          começa com 3 leads, 1 projeto, 1 chamado, dívida de R$ 6.200
?v=demo,mesa     abre já na mesa de trabalho
?v=demo,grana    abre na tela de dinheiro
```

Vale `casa`, `mesa`, `zap`, `grana` e `fama`.

## Subir o servidor de novo

Ele já está no ar. Isto aqui é a receita pra recriar do zero, se um dia precisar.

**1. Gere um token na Cloudflare** em https://dash.cloudflare.com/profile/api-tokens → *Create Token* → *Create Custom Token*, com estas três permissões:

```
Account · Workers Scripts · Edit
Account · Workers KV Storage · Edit
Account · Account Settings · Read
```

**2. Rode o deploy** com o token na mão. O script cria o KV, sobe o Worker e devolve o endereço:

```bash
export CF_TOKEN=seu_token_aqui
bash deploy.sh
```

**3. Ajuste o endereço no jogo.** O script imprime a URL final (algo como `https://vida-de-dev-api.SEU-SUBDOMINIO.workers.dev`). Ela precisa bater com a constante `API` no topo do bloco *conta e sincronização* dentro do `index.html`.

## Como o servidor guarda as coisas

```
u:<email>     conta — salt e hash PBKDF2 de 100 mil rodadas. A senha nunca é guardada
s:<token>     sessão, vence em 90 dias
g:<email>     a partida, em JSON
```

A senha sai do navegador só na hora de entrar, por HTTPS, e o servidor guarda apenas o hash. Senha errada e e-mail inexistente devolvem a mesma resposta, pra não revelar quais e-mails têm conta.
