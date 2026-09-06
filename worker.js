const R2_PUBLIC_URL = 'https://pub-4c6d087b787a47b8ae27e1d94b5725e1.r2.dev';

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

    if (url.pathname === '/api/criar-loja' && request.method === 'POST') return await criarLoja(request, env);
    if (url.pathname === '/api/ver' && request.method === 'GET') return await verLoja(request, env);
    if (url.pathname === '/api/upload-foto' && request.method === 'POST') return await uploadFoto(request, env);
    if (url.pathname === '/api/upload-video' && request.method === 'POST') return await uploadVideo(request, env);
    if (url.pathname === '/api/upload-musica' && request.method === 'POST') return await uploadMusica(request, env);
    if (url.pathname === '/api/listar-fotos' && request.method === 'GET') return await listarFotos(request, env);
    if (url.pathname === '/api/listar-videos' && request.method === 'GET') return await listarVideos(request, env);
    if (url.pathname === '/api/listar-musicas' && request.method === 'GET') return await listarMusicas(request, env);
    if (url.pathname === '/api/deletar-foto' && request.method === 'POST') return await deletarFoto(request, env);
    if (url.pathname === '/api/deletar-video' && request.method === 'POST') return await deletarVideo(request, env);
    if (url.pathname === '/api/deletar-musica' && request.method === 'POST') return await deletarMusica(request, env);
    if (url.pathname === '/api/testar-rotacao' && request.method === 'GET') {
      await rotacionarMidiasExpiradas(env);
      return new Response(JSON.stringify({ sucesso: true, mensagem: 'Rotação testada!' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (url.pathname === '/api/registrar-visita' && request.method === 'POST') return await registrarVisita(request, env);
    if (url.pathname === '/api/analytics' && request.method === 'GET') return await getAnalytics(request, env);

    return new Response('Microfood API Online - SiteOne v1.0', {
      headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }
    });
  },

  async scheduled(event, env, ctx) {
    await rotacionarMidiasExpiradas(env);
  }
};

async function criarLoja(request, env) {
  try {
    const dados = await request.json();
    const { nome, nome_loja, subdomain, nicho, plano, zap, template_id } = dados;
    if (!nome || !nome_loja || !subdomain || !nicho || !plano) {
      return new Response(JSON.stringify({ erro: 'Campos obrigatórios ausentes' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    const subdomainLimpo = subdomain.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').substring(0, 30);
    if (subdomainLimpo.length < 3) {
      return new Response(JSON.stringify({ erro: 'Domínio muito curto' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    const existente = await env.DB.prepare('SELECT id FROM lojas WHERE subdomain = ?').bind(subdomainLimpo).first();
    if (existente) {
      return new Response(JSON.stringify({ erro: 'Domínio já em uso' }), { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    const idLoja = 'loja_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const dataExpira = new Date(); dataExpira.setDate(dataExpira.getDate() + 30);
    const dataCobranca = new Date(); dataCobranca.setDate(dataCobranca.getDate() + 30);
    await env.DB.prepare(`INSERT INTO lojas (id, nome, nome_loja, subdomain, nicho, plano, template_id, setup_pago, mensal_pago, ativa, zap, data_expira_midia, data_proxima_cobranca) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?, ?)`).bind(idLoja, nome, nome_loja, subdomainLimpo, nicho, plano, template_id || null, zap || '', dataExpira.toISOString().split('T')[0], dataCobranca.toISOString().split('T')[0]).run();
    return new Response(JSON.stringify({ sucesso: true, loja: { id: idLoja, nome: nome_loja, subdomain: subdomainLimpo, plano, nicho, template_id: template_id || null } }), { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function verLoja(request, env) {
  try {
    const url = new URL(request.url);
    const subdomain = url.searchParams.get('subdomain');
    if (!subdomain) return new Response(JSON.stringify({ erro: 'Subdomínio não fornecido' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const loja = await env.DB.prepare('SELECT * FROM lojas WHERE subdomain = ?').bind(subdomain).first();
    if (!loja) return new Response(JSON.stringify({ erro: 'Loja não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const fotos = await env.DB.prepare('SELECT * FROM midias WHERE loja_id = ? AND tipo = ? AND ativa = 1').bind(loja.id, 'foto').all();
    const videosCliente = await env.DB.prepare('SELECT * FROM videos_cliente WHERE loja_id = ? AND ativa = 1').bind(loja.id).all();
    const musicasCliente = await env.DB.prepare('SELECT * FROM musicas_cliente WHERE loja_id = ? AND ativa = 1').bind(loja.id).all();
    let videosAutorais = [];
    let musicasAutorais = [];
    if (loja.template_id) {
      const vids = await env.DB.prepare('SELECT * FROM videos_autorais WHERE template_id = ? ORDER BY ordem').bind(loja.template_id).all();
      videosAutorais = vids.results || [];
      const musics = await env.DB.prepare('SELECT * FROM musicas_autorais WHERE template_id = ? ORDER BY ordem').bind(loja.template_id).all();
      musicasAutorais = musics.results || [];
    }
    return new Response(JSON.stringify({ sucesso: true, loja, fotos: fotos.results || [], videos_cliente: videosCliente.results || [], musicas_cliente: musicasCliente.results || [], videos_autorais: videosAutorais, musicas_autorais: musicasAutorais }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function uploadFoto(request, env) {
  try {
    const formData = await request.formData();
    const arquivo = formData.get('foto');
    const lojaId = formData.get('loja_id');
    if (!arquivo || !lojaId) return new Response(JSON.stringify({ erro: 'Arquivo ou loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const tipoValido = ['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type);
    if (!tipoValido) return new Response(JSON.stringify({ erro: 'Formato inválido. Use JPG, PNG ou WEBP.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (arquivo.size > 5 * 1024 * 1024) return new Response(JSON.stringify({ erro: 'Arquivo muito grande. Máximo 5MB.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const loja = await env.DB.prepare('SELECT plano FROM lojas WHERE id = ?').bind(lojaId).first();
    if (!loja) return new Response(JSON.stringify({ erro: 'Loja não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const rotacao = { FREE: 15, BASIC: 90, PLUS: 15, PRO: 0 }[loja.plano] || 30;
    const dataExpira = new Date();
    if (rotacao > 0) dataExpira.setDate(dataExpira.getDate() + rotacao);
    const ext = arquivo.name.split('.').pop().toLowerCase();
    const r2Key = `lojas/${lojaId}/fotos/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    await env.FOTOS.put(r2Key, arquivo.stream(), { httpMetadata: { contentType: arquivo.type } });
    const urlPublica = `${R2_PUBLIC_URL}/${r2Key}`;
    const idMidia = 'mid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await env.DB.prepare(`INSERT INTO midias (id, loja_id, tipo, url, r2_key, data_upload, data_expira, ativa) VALUES (?, ?, 'foto', ?, ?, ?, ?, 1)`).bind(idMidia, lojaId, urlPublica, r2Key, new Date().toISOString().split('T')[0], rotacao > 0 ? dataExpira.toISOString().split('T')[0] : null).run();
    return new Response(JSON.stringify({ sucesso: true, midia: { id: idMidia, url: urlPublica, data_expira: rotacao > 0 ? dataExpira.toISOString().split('T')[0] : 'Nunca' } }), { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function uploadVideo(request, env) {
  try {
    const formData = await request.formData();
    const arquivo = formData.get('video');
    const lojaId = formData.get('loja_id');
    const titulo = formData.get('titulo') || '';
    if (!arquivo || !lojaId) return new Response(JSON.stringify({ erro: 'Arquivo ou loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const tipoValido = ['video/mp4', 'video/webm', 'video/quicktime'].includes(arquivo.type);
    if (!tipoValido) return new Response(JSON.stringify({ erro: 'Formato inválido. Use MP4, WEBM ou MOV.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (arquivo.size > 50 * 1024 * 1024) return new Response(JSON.stringify({ erro: 'Vídeo muito grande. Máximo 50MB.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const loja = await env.DB.prepare('SELECT plano FROM lojas WHERE id = ?').bind(lojaId).first();
    if (!loja) return new Response(JSON.stringify({ erro: 'Loja não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const rotacao = { FREE: 15, BASIC: 90, PLUS: 15, PRO: 0 }[loja.plano] || 30;
    const dataExpira = new Date();
    if (rotacao > 0) dataExpira.setDate(dataExpira.getDate() + rotacao);
    const ext = arquivo.name.split('.').pop().toLowerCase();
    const r2Key = `lojas/${lojaId}/videos/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    await env.FOTOS.put(r2Key, arquivo.stream(), { httpMetadata: { contentType: arquivo.type } });
    const urlPublica = `${R2_PUBLIC_URL}/${r2Key}`;
    const idVideo = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await env.DB.prepare(`INSERT INTO videos_cliente (id, loja_id, url, r2_key, titulo, data_upload, data_expira, ativa) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`).bind(idVideo, lojaId, urlPublica, r2Key, titulo, new Date().toISOString().split('T')[0], rotacao > 0 ? dataExpira.toISOString().split('T')[0] : null).run();
    return new Response(JSON.stringify({ sucesso: true, video: { id: idVideo, url: urlPublica, data_expira: rotacao > 0 ? dataExpira.toISOString().split('T')[0] : 'Nunca' } }), { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function uploadMusica(request, env) {
  try {
    const formData = await request.formData();
    const arquivo = formData.get('musica');
    const lojaId = formData.get('loja_id');
    const titulo = formData.get('titulo') || '';
    const artista = formData.get('artista') || '';
    if (!arquivo || !lojaId) return new Response(JSON.stringify({ erro: 'Arquivo ou loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const tipoValido = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'].includes(arquivo.type);
    if (!tipoValido) return new Response(JSON.stringify({ erro: 'Formato inválido. Use MP3, WAV, OGG ou AAC.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (arquivo.size > 10 * 1024 * 1024) return new Response(JSON.stringify({ erro: 'Música muito grande. Máximo 10MB.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const loja = await env.DB.prepare('SELECT plano FROM lojas WHERE id = ?').bind(lojaId).first();
    if (!loja) return new Response(JSON.stringify({ erro: 'Loja não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const rotacao = { FREE: 15, BASIC: 90, PLUS: 15, PRO: 0 }[loja.plano] || 30;
    const dataExpira = new Date();
    if (rotacao > 0) dataExpira.setDate(dataExpira.getDate() + rotacao);
    const ext = arquivo.name.split('.').pop().toLowerCase();
    const r2Key = `lojas/${lojaId}/musicas/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    await env.FOTOS.put(r2Key, arquivo.stream(), { httpMetadata: { contentType: arquivo.type } });
    const urlPublica = `${R2_PUBLIC_URL}/${r2Key}`;
    const idMusica = 'mus_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await env.DB.prepare(`INSERT INTO musicas_cliente (id, loja_id, url, r2_key, titulo, artista, data_upload, data_expira, ativa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`).bind(idMusica, lojaId, urlPublica, r2Key, titulo, artista, new Date().toISOString().split('T')[0], rotacao > 0 ? dataExpira.toISOString().split('T')[0] : null).run();
    return new Response(JSON.stringify({ sucesso: true, musica: { id: idMusica, url: urlPublica, data_expira: rotacao > 0 ? dataExpira.toISOString().split('T')[0] : 'Nunca' } }), { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function listarFotos(request, env) {
  try {
    const url = new URL(request.url);
    const lojaId = url.searchParams.get('loja_id');
    if (!lojaId) return new Response(JSON.stringify({ erro: 'loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const midias = await env.DB.prepare('SELECT * FROM midias WHERE loja_id = ? AND tipo = ? AND ativa = 1 ORDER BY data_upload DESC').bind(lojaId, 'foto').all();
    return new Response(JSON.stringify({ sucesso: true, midias: midias.results || [] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function listarVideos(request, env) {
  try {
    const url = new URL(request.url);
    const lojaId = url.searchParams.get('loja_id');
    if (!lojaId) return new Response(JSON.stringify({ erro: 'loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const videos = await env.DB.prepare('SELECT * FROM videos_cliente WHERE loja_id = ? AND ativa = 1 ORDER BY data_upload DESC').bind(lojaId).all();
    return new Response(JSON.stringify({ sucesso: true, videos: videos.results || [] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function listarMusicas(request, env) {
  try {
    const url = new URL(request.url);
    const lojaId = url.searchParams.get('loja_id');
    if (!lojaId) return new Response(JSON.stringify({ erro: 'loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const musicas = await env.DB.prepare('SELECT * FROM musicas_cliente WHERE loja_id = ? AND ativa = 1 ORDER BY data_upload DESC').bind(lojaId).all();
    return new Response(JSON.stringify({ sucesso: true, musicas: musicas.results || [] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function deletarFoto(request, env) {
  try {
    const dados = await request.json();
    const { midia_id, loja_id } = dados;
    if (!midia_id || !loja_id) return new Response(JSON.stringify({ erro: 'IDs ausentes' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const midia = await env.DB.prepare('SELECT * FROM midias WHERE id = ? AND loja_id = ?').bind(midia_id, loja_id).first();
    if (!midia) return new Response(JSON.stringify({ erro: 'Mídia não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (midia.r2_key) await env.FOTOS.delete(midia.r2_key);
    await env.DB.prepare('UPDATE midias SET ativa = 0 WHERE id = ?').bind(midia_id).run();
    return new Response(JSON.stringify({ sucesso: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function deletarVideo(request, env) {
  try {
    const dados = await request.json();
    const { video_id, loja_id } = dados;
    if (!video_id || !loja_id) return new Response(JSON.stringify({ erro: 'IDs ausentes' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const video = await env.DB.prepare('SELECT * FROM videos_cliente WHERE id = ? AND loja_id = ?').bind(video_id, loja_id).first();
    if (!video) return new Response(JSON.stringify({ erro: 'Vídeo não encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (video.r2_key) await env.FOTOS.delete(video.r2_key);
    await env.DB.prepare('UPDATE videos_cliente SET ativa = 0 WHERE id = ?').bind(video_id).run();
    return new Response(JSON.stringify({ sucesso: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function deletarMusica(request, env) {
  try {
    const dados = await request.json();
    const { musica_id, loja_id } = dados;
    if (!musica_id || !loja_id) return new Response(JSON.stringify({ erro: 'IDs ausentes' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const musica = await env.DB.prepare('SELECT * FROM musicas_cliente WHERE id = ? AND loja_id = ?').bind(musica_id, loja_id).first();
    if (!musica) return new Response(JSON.stringify({ erro: 'Música não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (musica.r2_key) await env.FOTOS.delete(musica.r2_key);
    await env.DB.prepare('UPDATE musicas_cliente SET ativa = 0 WHERE id = ?').bind(musica_id).run();
    return new Response(JSON.stringify({ sucesso: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function registrarVisita(request, env) {
  try {
    const dados = await request.json();
    const { loja_id, referer, user_agent } = dados;
    if (!loja_id) return new Response(JSON.stringify({ erro: 'loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const agora = new Date();
    const data = agora.toISOString().split('T')[0];
    const hora = agora.toTimeString().split(' ')[0];
    const idVisita = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await env.DB.prepare(`INSERT INTO visitas (id, loja_id, data, hora, referer, user_agent) VALUES (?, ?, ?, ?, ?, ?)`).bind(idVisita, loja_id, data, hora, referer || '', user_agent || '').run();
    return new Response(JSON.stringify({ sucesso: true, visita_id: idVisita }), { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function getAnalytics(request, env) {
  try {
    const url = new URL(request.url);
    const lojaId = url.searchParams.get('loja_id');
    if (!lojaId) return new Response(JSON.stringify({ erro: 'loja_id ausente' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    const hoje = new Date().toISOString().split('T')[0];
    const semanaAtras = new Date(); semanaAtras.setDate(semanaAtras.getDate() - 7);
    const dataSemana = semanaAtras.toISOString().split('T')[0];
    const totalVisitas = await env.DB.prepare('SELECT COUNT(*) as total FROM visitas WHERE loja_id = ?').bind(lojaId).first();
    const visitasHoje = await env.DB.prepare('SELECT COUNT(*) as total FROM visitas WHERE loja_id = ? AND data = ?').bind(lojaId, hoje).first();
    const visitasSemana = await env.DB.prepare('SELECT COUNT(*) as total FROM visitas WHERE loja_id = ? AND data >= ?').bind(lojaId, dataSemana).first();
    const ultimasVisitas = await env.DB.prepare('SELECT * FROM visitas WHERE loja_id = ? ORDER BY data DESC, hora DESC LIMIT 10').bind(lojaId).all();
    return new Response(JSON.stringify({ sucesso: true, analytics: { total: totalVisitas.total, hoje: visitasHoje.total, semana: visitasSemana.total, ultimas: ultimasVisitas.results || [] } }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

async function rotacionarMidiasExpiradas(env) {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const fotosExpiradas = await env.DB.prepare('SELECT * FROM midias WHERE tipo = ? AND ativa = 1 AND data_expira < ?').bind('foto', hoje).all();
    const videosExpirados = await env.DB.prepare('SELECT * FROM videos_cliente WHERE ativa = 1 AND data_expira < ?').bind(hoje).all();
    const musicasExpiradas = await env.DB.prepare('SELECT * FROM musicas_cliente WHERE ativa = 1 AND data_expira < ?').bind(hoje).all();
    let total = 0;
    for (const midia of [...fotosExpiradas.results, ...videosExpirados.results, ...musicasExpiradas.results]) {
      if (midia.r2_key) {
        try { await env.FOTOS.delete(midia.r2_key); console.log('Deletada do R2: ' + midia.r2_key); } catch (erro) { console.error('Erro ao deletar do R2: ' + midia.r2_key, erro); }
      }
      const tabela = midia.tipo ? 'midias' : (midia.artista !== undefined ? 'musicas_cliente' : 'videos_cliente');
      await env.DB.prepare(`UPDATE ${tabela} SET ativa = 0 WHERE id = ?`).bind(midia.id).run();
      total++;
    }
    console.log('Rotacao concluida! ' + total + ' mídias processadas.');
  } catch (erro) { console.error('Erro na rotacao:', erro); }
}
