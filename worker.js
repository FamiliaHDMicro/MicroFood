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

    return new Response('Microfood API Online - SiteOne v1.0', {
      headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }
    });
  },
};

async function criarLoja(request, env) {
  try {
    const dados = await request.json();
    const { nome, nome_loja, subdomain, nicho, plano, zap } = dados;

    if (!nome || !nome_loja || !subdomain || !nicho || !plano) {
      return new Response(JSON.stringify({ erro: 'Campos obrigatórios ausentes' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const subdomainLimpo = subdomain.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '').substring(0, 30);

    if (subdomainLimpo.length < 3) {
      return new Response(JSON.stringify({ erro: 'Domínio muito curto' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const existente = await env.DB.prepare('SELECT id FROM lojas WHERE subdomain = ?').bind(subdomainLimpo).first();

    if (existente) {
      return new Response(JSON.stringify({ erro: 'Domínio já em uso' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const idLoja = 'loja_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const dataExpira = new Date(); dataExpira.setDate(dataExpira.getDate() + 30);
    const dataCobranca = new Date(); dataCobranca.setDate(dataCobranca.getDate() + 30);

    await env.DB.prepare(`
      INSERT INTO lojas (id, nome, nome_loja, subdomain, nicho, plano, setup_pago, mensal_pago, ativa, zap, data_expira_midia, data_proxima_cobranca)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?, ?)
    `).bind(idLoja, nome, nome_loja, subdomainLimpo, nicho, plano, zap || '', dataExpira.toISOString().split('T')[0], dataCobranca.toISOString().split('T')[0]).run();

    return new Response(JSON.stringify({
      sucesso: true,
      loja: { id: idLoja, nome: nome_loja, subdomain: subdomainLimpo, plano, nicho }
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

async function verLoja(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ erro: 'ID não fornecido' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    const loja = await env.DB.prepare('SELECT * FROM lojas WHERE id = ?').bind(id).first();
    if (!loja) return new Response(JSON.stringify({ erro: 'Loja não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    return new Response(JSON.stringify({ sucesso: true, loja }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
