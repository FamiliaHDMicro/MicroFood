const WORKER_URL = 'https://microfood.hdmicro.workers.dev';

const templatesHTML = {
  'sabor-caseiro': renderSaborCaseiro,
  'loja-virtual': renderLojaVirtual,
  'consult-pro': renderConsultPro,
  'barber-shop': renderBarberShop,
  'delivery-rapido': renderDeliveryRapido,
  'mesa-farta': renderMesaFarta,
  'glamour-studio': renderGlamourStudio,
  'beauty-express': renderBeautyExpress,
  'mao-na-massa': renderMaoNaMassa,
  'tech-solutions': renderTechSolutions,
  'limpeza-total': renderLimpezaTotal,
  'eventos-plus': renderEventosPlus
};

function renderSaborCaseiro(loja, fotos, videos, musicas) {
  const galeria = fotos.length > 0 ? fotos.map(f => '<div class="card-hover rounded-2xl overflow-hidden shadow-2xl"><img src="' + f.url + '" class="w-full h-64 object-cover"></div>').join('') : '<div class="col-span-full text-center py-12 bg-roxo rounded-2xl"><div class="text-6xl mb-4">🍽️</div><div class="text-xl text-gray-400">Fotos em breve!</div></div>';
  const videosHtml = videos.length > 0 ? '<div class="max-w-6xl mx-auto px-4 pb-12"><h2 class="text-3xl font-black text-laranja mb-6 text-center">Nossos vídeos</h2><div class="grid md:grid-cols-3 gap-6">' + videos.map(v => '<div class="card-hover rounded-2xl overflow-hidden bg-card border border-roxo"><video src="' + v.url + '" controls autoplay muted loop playsinline></video><div class="p-3 text-sm text-gray-300">' + (v.titulo || '') + '</div></div>').join('') + '</div></div>' : '';
  const musicasHtml = musicas.length > 0 ? '<div class="max-w-6xl mx-auto px-4 pb-12"><h2 class="text-3xl font-black text-laranja mb-6 text-center">🎵 Trilha sonora</h2><div class="grid md:grid-cols-3 gap-6">' + musicas.map(m => '<div class="card-hover rounded-2xl overflow-hidden bg-card border border-roxo"><iframe src="' + m.url + '" class="w-full h-48" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe><div class="p-3"><div class="text-sm font-bold text-white">' + (m.titulo || '') + '</div><div class="text-xs text-gray-400">' + (m.artista || '') + '</div></div></div>').join('') + '</div></div>' : '';
  return '<div class="relative h-96 bg-gradient-to-br from-orange-900 via-red-900 to-amber-900 flex items-center justify-center overflow-hidden fade-in"><div class="relative text-center px-4"><div class="text-6xl mb-4">🍲</div><h1 class="text-5xl md:text-6xl font-black text-white mb-2">' + loja.nome_loja + '</h1><p class="text-xl text-amber-200">Feito com amor, entregue com carinho</p><a href="https://wa.me/' + loja.zap + '" target="_blank" class="inline-block mt-6 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl">💬 Pedir pelo WhatsApp</a></div></div><div class="max-w-4xl mx-auto px-4 py-12"><div class="bg-card rounded-2xl p-8 border border-roxo"><h2 class="text-3xl font-black text-laranja mb-4">Sobre nós</h2><p class="text-gray-300 text-lg">Bem-vindo à <strong class="text-white">' + loja.nome_loja + '</strong>! Preparamos cada prato com ingredientes frescos e muito carinho.</p></div></div><div class="max-w-6xl mx-auto px-4 pb-12"><h2 class="text-3xl font-black text-laranja mb-6 text-center">Nossas delícias</h2><div class="grid md:grid-cols-3 gap-6">' + galeria + '</div></div>' + videosHtml + musicasHtml + '<footer class="bg-black py-6 text-center text-gray-500 text-sm">Powered by <strong class="text-laranja">SiteOne</strong></footer>';
}

function renderLojaVirtual(loja, fotos, videos, musicas) {
  const produtos = fotos.length > 0 ? fotos.map(f => '<div class="card-hover bg-card rounded-2xl overflow-hidden border border-roxo"><img src="' + f.url + '" class="w-full h-48 object-cover"><div class="p-4"><div class="font-bold text-lg">Produto</div><div class="text-laranja font-black text-xl mt-2">R$ --</div><a href="https://wa.me/' + loja.zap + '" target="_blank" class="block mt-3 bg-laranja text-white text-center py-2 rounded-lg font-bold">Comprar</a></div></div>').join('') : '<div class="col-span-full text-center py-12 bg-roxo rounded-2xl"><div class="text-6xl mb-4">🛒</div><div class="text-xl text-gray-400">Produtos em breve!</div></div>';
  const videosHtml = videos.length > 0 ? '<div class="max-w-6xl mx-auto px-4 pb-12"><h2 class="text-3xl font-black text-laranja mb-6">Vídeos da loja</h2><div class="grid md:grid-cols-3 gap-6">' + videos.map(v => '<div class="card-hover rounded-2xl overflow-hidden bg-card border border-roxo"><video src="' + v.url + '" controls autoplay muted loop playsinline></video><div class="p-3 text-sm text-gray-300">' + (v.titulo || '') + '</div></div>').join('') + '</div></div>' : '';
  const musicasHtml = musicas.length > 0 ? '<div class="max-w-6xl mx-auto px-4 pb-12"><h2 class="text-3xl font-black text-laranja mb-6">🎵 Músicas da loja</h2><div class="grid md:grid-cols-3 gap-6">' + musicas.map(m => '<div class="card-hover rounded-2xl overflow-hidden bg-card border border-roxo"><iframe src="' + m.url + '" class="w-full h-48" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe><div class="p-3"><div class="text-sm font-bold text-white">' + (m.titulo || '') + '</div><div class="text-xs text-gray-400">' + (m.artista || '') + '</div></div></div>').join('') + '</div></div>' : '';
  return '<div class="bg-gradient-to-r from-blue-900 to-purple-900 py-16 text-center fade-in"><div class="text-6xl mb-4">🛍️</div><h1 class="text-5xl font-black text-white mb-4">' + loja.nome_loja + '</h1><p class="text-xl text-blue-200">Sua loja online completa</p><a href="https://wa.me/' + loja.zap + '" target="_blank" class="inline-block mt-6 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl"> Pedir pelo WhatsApp</a></div><div class="max-w-6xl mx-auto px-4 py-12"><h2 class="text-3xl font-black text-laranja mb-6">Produtos</h2><div class="grid md:grid-cols-3 gap-6">' + produtos + '</div></div>' + videosHtml + musicasHtml + '<footer class="bg-black py-6 text-center text-gray-500 text-sm">Powered by <strong class="text-laranja">SiteOne</strong></footer>';
}

function renderDefault(loja, fotos, videos, musicas, emoji, cor1, cor2) {
  const galeria = fotos.length > 0 ? '<div class="max-w-6xl mx-auto px-4 py-12"><h2 class="text-3xl font-black text-laranja mb-6 text-center">Galeria</h2><div class="grid md:grid-cols-3 gap-6">' + fotos.map(f => '<div class="card-hover rounded-2xl overflow-hidden shadow-2xl"><img src="' + f.url + '" class="w-full h-64 object-cover"></div>').join('') + '</div></div>' : '';
  const videosHtml = videos.length > 0 ? '<div class="max-w-6xl mx-auto px-4 pb-12"><h2 class="text-3xl font-black text-laranja mb-6 text-center">Vídeos</h2><div class="grid md:grid-cols-3 gap-6">' + videos.map(v => '<div class="card-hover rounded-2xl overflow-hidden bg-card border border-roxo"><video src="' + v.url + '" controls autoplay muted loop playsinline></video><div class="p-3 text-sm text-gray-300">' + (v.titulo || '') + '</div></div>').join('') + '</div></div>' : '';
  const musicasHtml = musicas.length > 0 ? '<div class="max-w-6xl mx-auto px-4 pb-12"><h2 class="text-3xl font-black text-laranja mb-6 text-center">🎵 Músicas</h2><div class="grid md:grid-cols-3 gap-6">' + musicas.map(m => '<div class="card-hover rounded-2xl overflow-hidden bg-card border border-roxo"><iframe src="' + m.url + '" class="w-full h-48" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe><div class="p-3"><div class="text-sm font-bold text-white">' + (m.titulo || '') + '</div><div class="text-xs text-gray-400">' + (m.artista || '') + '</div></div></div>').join('') + '</div></div>' : '';
  return '<div class="bg-gradient-to-r ' + cor1 + ' ' + cor2 + ' py-16 text-center fade-in"><div class="text-6xl mb-4">' + emoji + '</div><h1 class="text-5xl font-black text-white mb-4">' + loja.nome_loja + '</h1><p class="text-xl text-gray-200">Template ' + (loja.template_id || 'profissional') + '</p><a href="https://wa.me/' + loja.zap + '" target="_blank" class="inline-block mt-6 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl"> WhatsApp</a></div>' + galeria + videosHtml + musicasHtml + '<footer class="bg-black py-6 text-center text-gray-500 text-sm">Powered by <strong class="text-laranja">SiteOne</strong></footer>';
}

function renderConsultPro(loja, f, v, m) { return renderDefault(loja, f, v, m, '💼', 'from-slate-900', 'to-gray-900'); }
function renderBarberShop(loja, f, v, m) { return renderDefault(loja, f, v, m, '💈', 'from-gray-900', 'to-black'); }
function renderDeliveryRapido(loja, f, v, m) { return renderDefault(loja, f, v, m, '🚀', 'from-red-900', 'to-orange-900'); }
function renderMesaFarta(loja, f, v, m) { return renderDefault(loja, f, v, m, '🍽️', 'from-amber-900', 'to-yellow-900'); }
function renderGlamourStudio(loja, f, v, m) { return renderDefault(loja, f, v, m, '✨', 'from-purple-900', 'to-pink-900'); }
function renderBeautyExpress(loja, f, v, m) { return renderDefault(loja, f, v, m, '💅', 'from-pink-900', 'to-rose-900'); }
function renderMaoNaMassa(loja, f, v, m) { return renderDefault(loja, f, v, m, '🔧', 'from-orange-900', 'to-amber-900'); }
function renderTechSolutions(loja, f, v, m) { return renderDefault(loja, f, v, m, '💻', 'from-blue-900', 'to-cyan-900'); }
function renderLimpezaTotal(loja, f, v, m) { return renderDefault(loja, f, v, m, '🧹', 'from-green-900', 'to-teal-900'); }
function renderEventosPlus(loja, f, v, m) { return renderDefault(loja, f, v, m, '🎉', 'from-fuchsia-900', 'to-purple-900'); }

async function registrarVisita(lojaId) {
  try {
    await fetch(WORKER_URL + '/api/registrar-visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loja_id: lojaId,
        referer: document.referrer || '',
        user_agent: navigator.userAgent
      })
    });
  } catch (erro) {
    console.error('Erro ao registrar visita:', erro);
  }
}

async function carregarLoja() {
  const params = new URLSearchParams(window.location.search);
  const subdomain = params.get('subdomain');
  if (!subdomain) { document.getElementById('loading').classList.add('tela-oculta'); document.getElementById('erro').classList.remove('tela-oculta'); return; }
  try {
    const resposta = await fetch(WORKER_URL + '/api/ver?subdomain=' + encodeURIComponent(subdomain));
    const dados = await resposta.json();
    if (!resposta.ok || !dados.sucesso) throw new Error('Loja não encontrada');
    const loja = dados.loja;
    const fotos = dados.fotos || [];
    const videos = dados.videos || [];
    const musicas = dados.musicas || [];
    const templateId = loja.template_id || 'consult-pro';
    const renderFn = templatesHTML[templateId] || renderDefault;
    document.getElementById('titulo-loja').textContent = loja.nome_loja;
    document.getElementById('conteudo-loja').innerHTML = renderFn(loja, fotos, videos, musicas);
    document.getElementById('loading').classList.add('tela-oculta');
    document.getElementById('conteudo-loja').classList.remove('tela-oculta');
    if (loja.id) registrarVisita(loja.id);
  } catch (erro) { document.getElementById('loading').classList.add('tela-oculta'); document.getElementById('erro').classList.remove('tela-oculta'); }
}

carregarLoja();
