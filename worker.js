// Vida de Dev — servidor de contas e partidas.
// Cloudflare Worker + KV. Guarda conta (e-mail e senha) e o save de cada jogador,
// pra partida seguir do celular pro computador.
//
// KV esperado no binding JOGO:
//   u:<email>        {salt, hash, criado}
//   s:<token>        <email>            (sessao, expira em 90 dias)
//   g:<email>        {estado, quando}   (a partida)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '86400',
};
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const bytes = n => crypto.getRandomValues(new Uint8Array(n));

async function derivar(senha, saltHex) {
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, chave, 256);
  return hex(bits);
}

// comparacao de tempo constante, pra senha errada nao vazar por medicao
function iguais(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const limpaEmail = e => String(e || '').trim().toLowerCase();
const emailValido = e => /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(e);

async function novaSessao(env, email) {
  const token = hex(bytes(24));
  await env.JOGO.put('s:' + token, email, { expirationTtl: 60 * 60 * 24 * 90 });
  return token;
}

async function quemE(env, req) {
  const a = req.headers.get('Authorization') || '';
  if (!a.startsWith('Bearer ')) return null;
  return await env.JOGO.get('s:' + a.slice(7));
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const url = new URL(req.url);
    const rota = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (rota === '/' || rota === '/status') return json({ ok: true, servico: 'vida-de-dev' });

      // ---- criar conta
      if (rota === '/criar' && req.method === 'POST') {
        const { email, senha, nome } = await req.json();
        const e = limpaEmail(email);
        if (!emailValido(e)) return json({ erro: 'Esse e-mail não parece certo.' }, 400);
        if (!senha || senha.length < 6) return json({ erro: 'A senha precisa de pelo menos 6 caracteres.' }, 400);
        if (await env.JOGO.get('u:' + e)) return json({ erro: 'Já existe conta com esse e-mail. Tente entrar.' }, 409);

        const salt = hex(bytes(16));
        await env.JOGO.put('u:' + e, JSON.stringify({
          salt, hash: await derivar(senha, salt), nome: String(nome || '').slice(0, 18), criado: Date.now(),
        }));
        return json({ token: await novaSessao(env, e), email: e });
      }

      // ---- entrar
      if (rota === '/entrar' && req.method === 'POST') {
        const { email, senha } = await req.json();
        const e = limpaEmail(email);
        const bruto = await env.JOGO.get('u:' + e);
        // mesma resposta pros dois casos, pra nao dizer quais e-mails existem
        if (!bruto) return json({ erro: 'E-mail ou senha errados.' }, 401);
        const u = JSON.parse(bruto);
        if (!iguais(await derivar(senha, u.salt), u.hash)) return json({ erro: 'E-mail ou senha errados.' }, 401);
        return json({ token: await novaSessao(env, e), email: e, nome: u.nome || '' });
      }

      // ---- a partida
      if (rota === '/save') {
        const email = await quemE(env, req);
        if (!email) return json({ erro: 'Sessão expirada. Entre de novo.' }, 401);

        if (req.method === 'GET') {
          const bruto = await env.JOGO.get('g:' + email);
          return json(bruto ? JSON.parse(bruto) : { estado: null, quando: 0 });
        }
        if (req.method === 'PUT') {
          const { estado, quando } = await req.json();
          if (typeof estado !== 'string' || estado.length > 400000) return json({ erro: 'Partida inválida.' }, 400);
          await env.JOGO.put('g:' + email, JSON.stringify({ estado, quando: quando || Date.now() }));
          return json({ ok: true });
        }
      }

      return json({ erro: 'Rota não existe.' }, 404);
    } catch (err) {
      return json({ erro: 'Deu erro no servidor.', detalhe: String(err && err.message || err) }, 500);
    }
  },
};
