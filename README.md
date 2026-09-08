# Vida de Dev

Jogo de simulação em formato de celular. Você faz sistemas sob medida em casa e tenta pagar R$ 9 mil de contas todo dia 5, mais o mercado, sem se destruir no caminho.

**Jogue:** https://jonibernardes.github.io/vida-de-dev/

**Servidor de contas:** https://vida-de-dev-api.jonibernardes.workers.dev — no ar desde 07/09/2026, com o KV `VIDA_DE_DEV` na conta joni.bernardes@gmail.com.

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `index.html` | O jogo inteiro. Um arquivo, sem dependência, roda direto do navegador |
| `worker.js` | O servidor de contas e partidas. Cloudflare Worker + KV |
| `deploy.sh` | Sobe o worker de novo, se um dia precisar |

## Como funciona

**O relógio corre sozinho.** Uma hora de jogo leva 40 segundos no normal, e há cinco velocidades mais a pausa. Fechou o navegador, o relógio para.

**Agora e base.** Cinco áreas têm duas medidas: o *agora*, que é o que você fez hoje, e a *base*, que é o hábito. O agora persegue a base 1,2% por hora. Quem corre sempre tem base alta e volta rápido de um fim de semana de pizza; quem parou de correr vê a base cair 0,9 por dia e aí não tem sábado bom que salve. Vale para Energia, Ânimo, Corpo, Casamento e Estresse. Fome e Higiene só têm o agora.

**O personagem tem vontade própria.** A cada hora trabalhando ele pode largar tudo sozinho: abrir o Instagram, ir beliscar, ou parar e olhar pra parede. A chance começa em 5% e sobe com ânimo baixo, estresse alto, energia baixa e horas seguidas de trabalho. **Não dá pra cancelar** — a barra fica roxa e roda até o fim.

**E ele se cuida sozinho no limite.** Energia abaixo de 8 ele apaga; fome abaixo de 10 come o que tiver na mão; higiene abaixo de 10 larga tudo e vai pro chuveiro; sujeira acima de 92 ele começa a limpar. Também involuntário.

**Suporte.** Cada sistema entregue nasce com uma cota de 3 a 10 chamados espalhados pelos primeiros 30 dias — cliente chato ganha 4 a mais e continua pedindo pra sempre. O prazo é de 48 horas, mas varia: cliente tranquilo espera 72h, o chato só 24h. Dentro do prazo custa 2 de estresse por dia; passou, custa 5 e ele pode ir pro Reclame Aqui. Dobrou o prazo, ele desiste: para de cobrar, a cota cai e a satisfação despenca.

## O balanço, medido

Simulação de 500 meses por cenário, procurando a melhor combinação de leads por dia e preço:

| Como você joga | Melhor resultado líquido |
|---|---|
| Começando, se cuidando — vendas 35, 6h/dia | R$ 5.700/mês |
| Rodando bem — vendas 60, 8h/dia | R$ 10.000/mês |
| Veterano puxando — vendas 80, 10h/dia | R$ 14.900/mês |
| Queimando a vida — vendas 95, 12h/dia | R$ 19.400/mês |

As contas são R$ 11 mil com o mercado. Ou seja: começando você endivida, jogando bem você empata, e só passa disso quem abre mão de alguma coisa.

## Atalhos de teste

Cole depois do endereço:

```
?v=demo             3 leads, 1 projeto, 1 chamado, dívida de R$ 6.200
?v=demo,mesa        abre já na mesa de trabalho
?v=demo,grana       tela de dinheiro
?v=demo,animo       painel de uma barra (vale qualquer uma das 7)
?v=demo,banho       congela uma ação pra ver a animação
?v=demo,festa       confete e som de comemoração
?v=demo,susto       flash vermelho e tremor
```

Telas: `casa`, `mesa`, `zap`, `grana`, `fama`.
Barras: `energia`, `fome`, `higiene`, `animo`, `corpo`, `casamento`, `estresse`.
Ações: `dormir`, `comer`, `banho`, `correr`, `mercado`, `limpar`, `tv`, `tania`, `insta`, `projeto`, `reuniao`.

## Subir o servidor de novo

Ele já está no ar. Isto é a receita pra recriar do zero.

**1. Gere um token na Cloudflare** em https://dash.cloudflare.com/profile/api-tokens → *Create Token* → *Create Custom Token*, com três permissões:

```
Account · Workers Scripts · Edit
Account · Workers KV Storage · Edit
Account · Account Settings · Read
```

**2. Rode o deploy:**

```bash
export CF_TOKEN=seu_token_aqui
bash deploy.sh
```

**3.** Confira se a URL que ele imprime bate com a constante `API` no `index.html`.

## Como o servidor guarda as coisas

```
u:<email>     conta — salt e hash PBKDF2 de 100 mil rodadas. A senha nunca é guardada
s:<token>     sessão, vence em 90 dias
g:<email>     a partida, em JSON
```

A senha sai do navegador só na hora de entrar, por HTTPS, e o servidor guarda apenas o hash. Senha errada e e-mail inexistente devolvem a mesma resposta, pra não revelar quais e-mails têm conta.
