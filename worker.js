⚙️ WORKER COMPLETO (com URL pública já inserida)

Vai em: https://dash.cloudflare.com → microfood → Editar código

Apaga TUDO e cola:

const R2PUBLICURL = 'https://pub-4c6d087b787a47b8ae27e1d94b5725e1.r2.dev';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (url.pathname === '/api/criar-loja' && request.method === 'POST') {
      return await criarLoja(request, env);
    }
    if (url.pathname === '/api/ver' && request.method === 'GET') {
      return await verLoja(request, env);
    }
    if (url.pathname === '/api/upload-foto' && request.method === 'POST') {
      return await uploadFoto(request, env);
    }
    if (url.pathname === '/api/listar-fotos' && request.method === 'GET') {
      return await listarFotos(request, env);
    }
    if (url.pathname === '/api/deletar-foto' && request.method === 'POST') {
      return await deletarFoto(request, env);
    }

    return new Response('Microfood API Online - SiteOne v1.0', {
      headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }
    });
  },
};

async function criarLoja(request, env) {
  try {
    const dados = await request.json();
    const { nome, nomeloja, subdomain, nicho, plano, zap, templateid } = dados;

    if (!nome || !nome_loja || !subdomain || !nicho || !plano) {
      return new Response(JSON.stringify({ erro: 'Campos obrigatórios ausentes' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const subdomainLimpo = subdomain.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '').substring(0, 30);

    if (subdomainLimpo.length  5  1024  1024) {
      return new Response(JSON.stringify({ erro: 'Arquivo muito grande. Máximo 5MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const loja = await env.DB.prepare('SELECT plano FROM lojas WHERE id = ?').bind(lojaId).first();
    if (!loja) {
      return new Response(JSON.stringify({ erro: 'Loja não encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const rotacao = { FREE: 15, BASIC: 90, PLUS: 15, PRO: 0 }[loja.plano] || 30;
    const dataExpira = new Date();
    if (rotacao > 0) dataExpira.setDate(dataExpira.getDate() + rotacao);

    const ext = arquivo.name.split('.').pop().toLowerCase();
    const r2Key = lojas/${lojaId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext};

    await env.FOTOS.put(r2Key, arquivo.stream(), {
      httpMetadata: { contentType: arquivo.type }
    });

    const urlPublica = ${R2PUBLICURL}/${r2Key};

    const idMidia = 'mid' + Date.now() + '' + Math.random().toString(36).substr(2, 9);
    await env.DB.prepare(
      INSERT INTO midias (id, lojaid, tipo, url, r2key, dataupload, dataexpira, ativa)
      VALUES (?, ?, 'foto', ?, ?, ?, ?, 1)
    ).bind(
      idMidia, lojaId, urlPublica, r2Key,
      new Date().toISOString().split('T')[0],
      rotacao > 0 ? dataExpira.toISOString().split('T')[0] : null
    ).run();

    return new Response(JSON.stringify({
      sucesso: true,
      midia: { id: idMidia, url: urlPublica, data_expira: rotacao > 0 ? dataExpira.toISOString().split('T')[0] : 'Nunca' }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function listarFotos(request, env) {
  try {
    const url = new URL(request.url);
    const lojaId = url.searchParams.get('loja_id');
    if (!lojaId) return new Response(JSON.stringify({ erro: 'loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    const midias = await env.DB.prepare('SELECT * FROM midias WHERE lojaid = ? AND tipo = ? AND ativa = 1 ORDER BY dataupload DESC').bind(lojaId, 'foto').all();
    return new Response(JSON.stringify({ sucesso: true, midias: midias.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function deletarFoto(request, env) {
  try {
    const dados = await request.json();
    const { midiaid, lojaid } = dados;
    if (!midiaid || !lojaid) return new Response(JSON.stringify({ erro: 'IDs ausentes' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    const midia = await env.DB.prepare('SELECT * FROM midias WHERE id = ? AND lojaid = ?').bind(midiaid, loja_id).first();
    if (!midia) return new Response(JSON.stringify({ erro: 'Mídia não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    if (midia.r2_key) {
      await env.FOTOS.delete(midia.r2_key);
    }
    await env.DB.prepare('UPDATE midias SET ativa = 0 WHERE id = ?').bind(midia_id).run();

    return new Response(JSON.stringify({ sucesso: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

Clica em "Implantar".

✅ Pronto! Agora testa:

Abre https://microfood.pages.dev/
Faz cadastro completo
No dashboard, clica em "1. Upload de Fotos"
Arrasta uma foto
Deve aparecer "Enviando..." → "✓ Enviada!" 🎉

Me avisa se funcionou! 🚀
