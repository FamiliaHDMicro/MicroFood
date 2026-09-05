const WORKER_URL = 'https://microfood.hdmicro.workers.dev';
const SITE_URL = 'https://microfood.pages.dev';

let estado = { nicho: null, plano: null, setup: 0, mensal: 0, nome: '', zap: '', subdomain: '', nomeLoja: '', lojaId: null, passoAtual: 1, dominioValido: false };
const limites = { FREE: { fotos: 3, videos: 1, musicas: 0, rotacao: 15 }, BASIC: { fotos: 10, videos: 3, musicas: 1, rotacao: 90 }, PLUS: { fotos: 13, videos: 3, musicas: 2, rotacao: 15 }, PRO: { fotos: 16, videos: 4, musicas: 3, rotacao: 0 } };
const dicasPorNicho = { alimentacao: 'Lanchonetes do PRO podem trocar fotos todo dia. Use isso a seu favor!', beleza: 'Barbeiros e tatuadores: troque a vitrine a cada 15 dias para atrair clientes novos.', servico: 'Serviços locais: fotos de antes/depois convertem 3x mais.', business: 'Advogados e contadores: sua rotação é trimestral. Aproveite para atualizar promoções.' };

const templatesPorNicho = {
  alimentacao: [
    { id: 'sabor-caseiro', nome: 'SaborCaseiro', emoji: '', desc: 'Quente e acolhedor. Ideal para marmitas, doces, bolos.' },
    { id: 'delivery-rapido', nome: 'DeliveryRápido', emoji: '🚀', desc: 'Moderno e ágil. Ideal para lanches, pizza, açaí.' },
    { id: 'mesa-farta', nome: 'MesaFarta', emoji: '️', desc: 'Elegante e completo. Ideal para restaurantes e buffets.' }
  ],
  beleza: [
    { id: 'glamour-studio', nome: 'GlamourStudio', emoji: '✨', desc: 'Luxo e sofisticação. Ideal para salões premium.' },
    { id: 'beauty-express', nome: 'BeautyExpress', emoji: '💅', desc: 'Clean e rápido. Ideal para manicure, sobrancelha.' },
    { id: 'barber-shop', nome: 'BarberShop', emoji: '💈', desc: 'Masculino e vintage. Ideal para barbearias.' }
  ],
  servico: [
    { id: 'mao-na-massa', nome: 'MãoNaMassa', emoji: '🔧', desc: 'Prático e direto. Ideal para eletricista, encanador.' },
    { id: 'tech-solutions', nome: 'TechSolutions', emoji: '💻', desc: 'Corporativo. Ideal para TI, manutenção.' },
    { id: 'limpeza-total', nome: 'LimpezaTotal', emoji: '', desc: 'Fresco e organizado. Ideal para diaristas.' }
  ],
  business: [
    { id: 'consult-pro', nome: 'ConsultPro', emoji: '💼', desc: 'Minimalista e profissional. Ideal para consultores.' },
    { id: 'loja-virtual', nome: 'LojaVirtual', emoji: '', desc: 'E-commerce completo. Ideal para varejo.' },
    { id: 'eventos-plus', nome: 'EventosPlus', emoji: '🎉', desc: 'Vibrante. Ideal para festas, DJ, fotografia.' }
  ]
};

let templateEscolhido = null;
let fotosParaUpload = [];
let videosParaUpload = [];
let musicasParaUpload = [];
let debounceTimer = null;

function irPara(idTela) { document.querySelectorAll('[id^="tela-"]').forEach(t => t.classList.add('tela-oculta')); const tela = document.getElementById(idTela); if (tela) { tela.classList.remove('tela-oculta'); window.scrollTo(0, 0); } }
function mostrarMsg(tipo, texto) { const area = document.getElementById('area-msg'); if (!area) return; const classe = tipo === 'erro' ? 'msg-erro' : 'msg-sucesso'; area.innerHTML = '<div class="' + classe + '">' + texto + '</div>'; setTimeout(() => { area.innerHTML = ''; }, 5000); }
function mostrarPasso(num) { for (let i = 1; i <= 7; i++) { const passo = document.getElementById('passo-' + i); if (passo) { passo.classList.remove('passo-ativo'); passo.classList.add('passo-inativo'); } } const passoAtual = document.getElementById('passo-' + num); if (passoAtual) { passoAtual.classList.remove('passo-inativo'); passoAtual.classList.add('passo-ativo'); } const percent = Math.round((num / 7) * 100); document.getElementById('barra-fill').style.width = percent + '%'; document.getElementById('label-passo').textContent = 'Passo ' + num + ' de 7'; document.getElementById('percent-passo').textContent = percent + '%'; const titulos = { 1: ['Seus dados', 'Vamos começar pelo básico.'], 2: ['Escolha seu plano', 'Selecione o que faz mais sentido.'], 3: ['Escolha seu domínio', 'Este será o endereço da sua loja.'], 4: ['Confirme o domínio', 'Atenção: não poderá ser trocado.'], 5: ['Termos de uso', 'Leia e aceite.'], 6: ['Pagamento', 'Ative sua loja.'], 7: ['Escolha o modelo', 'Selecione o estilo da sua loja.'] }; document.getElementById('titulo-passo').textContent = titulos[num][0]; document.getElementById('subtitulo-passo').textContent = titulos[num][1]; estado.passoAtual = num; window.scrollTo(0, 0); }
function proximoPasso(num) { if (num === 2) { if (!document.getElementById('inp-nome').value.trim()) return mostrarMsg('erro', 'Preencha seu nome'); if (!document.getElementById('inp-zap').value.trim()) return mostrarMsg('erro', 'Preencha seu WhatsApp'); if (!estado.nicho) return mostrarMsg('erro', 'Escolha um nicho'); estado.nome = document.getElementById('inp-nome').value.trim(); estado.zap = document.getElementById('inp-zap').value.trim(); } if (num === 3) { if (!estado.plano) return mostrarMsg('erro', 'Escolha um plano'); } if (num === 5) { if (!estado.dominioValido) return mostrarMsg('erro', 'Valide o domínio primeiro'); } if (num === 6) { document.getElementById('pag-plano').textContent = estado.plano; document.getElementById('pag-valor').textContent = 'R$ ' + estado.setup; document.getElementById('pag-mensal').textContent = estado.mensal > 0 ? '+ R$ ' + estado.mensal + '/mês' : 'Grátis por 15 dias'; document.getElementById('pag-dominio').textContent = estado.subdomain + '.pages.dev'; } mostrarPasso(num); }
function voltarPasso(num) { mostrarPasso(num); }
function escolherNicho(nicho, elemento) { estado.nicho = nicho; document.querySelectorAll('.btn-nicho').forEach(b => b.classList.remove('item-selecionado')); elemento.classList.add('item-selecionado'); }
function escolherPlano(plano, setup, mensal, elemento) { estado.plano = plano; estado.setup = setup; estado.mensal = mensal; document.querySelectorAll('.btn-plano').forEach(b => b.classList.remove('item-selecionado')); elemento.classList.add('item-selecionado'); const info = document.getElementById('info-plano'); info.classList.remove('hidden'); const lim = limites[plano]; info.innerHTML = '<strong class="text-laranja">' + plano + ':</strong> ' + lim.fotos + ' fotos • ' + lim.videos + ' vídeos • ' + lim.musicas + ' músicas • Rotação: ' + (lim.rotacao === 0 ? 'Livre' : lim.rotacao + ' dias'); }

function atualizarPreviewDominio() {
  const nome = document.getElementById('inp-dominio').value;
  const sub = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').substring(0, 30);
  document.getElementById('preview-dominio').textContent = (sub || 'seuloja') + '.pages.dev';
  const statusDiv = document.getElementById('dominio-status');
  const btn = document.getElementById('btn-validar-dominio');
  if (sub.length < 3) { statusDiv.className = 'mt-2 text-sm hidden'; btn.disabled = true; estado.dominioValido = false; return; }
  statusDiv.className = 'mt-2 text-sm text-gray-400';
  statusDiv.textContent = 'Digitando...';
  btn.disabled = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => validarDominio(sub), 800);
}

async function validarDominio(sub) {
  const statusDiv = document.getElementById('dominio-status');
  const btn = document.getElementById('btn-validar-dominio');
  try {
    statusDiv.textContent = 'Verificando...';
    const resposta = await fetch(WORKER_URL + '/api/ver?subdomain=' + encodeURIComponent(sub));
    const dados = await resposta.json();
    if (dados.sucesso) {
      statusDiv.className = 'mt-2 text-sm text-vermelho';
      statusDiv.textContent = '❌ Domínio já está em uso! Escolha outro.';
      btn.disabled = true;
      estado.dominioValido = false;
      document.getElementById('inp-dominio').classList.add('dominio-invalido');
      document.getElementById('inp-dominio').classList.remove('dominio-valido');
    } else {
      statusDiv.className = 'mt-2 text-sm text-verde';
      statusDiv.textContent = '✅ Domínio disponível!';
      btn.disabled = false;
      estado.dominioValido = true;
      document.getElementById('inp-dominio').classList.add('dominio-valido');
      document.getElementById('inp-dominio').classList.remove('dominio-invalido');
    }
  } catch (erro) {
    statusDiv.className = 'mt-2 text-sm text-verde';
    statusDiv.textContent = '✅ Domínio disponível!';
    btn.disabled = false;
    estado.dominioValido = true;
  }
}

function validarEDominios() {
  if (!estado.dominioValido) return mostrarMsg('erro', 'Valide o domínio primeiro');
  const dominio = document.getElementById('inp-dominio').value.trim();
  estado.subdomain = dominio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').substring(0, 30);
  estado.nomeLoja = document.getElementById('inp-nome').value.trim();
  document.getElementById('confirm-dominio').textContent = estado.subdomain + '.pages.dev';
  mostrarPasso(4);
}

function verificarTermos() { const todos = ['termo-1','termo-2','termo-3','termo-4','termo-5'].map(id => document.getElementById(id).checked); document.getElementById('btn-ir-pagamento').disabled = !todos.every(t => t); }

function confirmarPagamento() {
  document.getElementById('pag-plano').textContent = estado.plano;
  document.getElementById('pag-valor').textContent = 'R$ ' + estado.setup;
  document.getElementById('pag-mensal').textContent = estado.mensal > 0 ? '+ R$ ' + estado.mensal + '/mês' : 'Grátis por 15 dias';
  document.getElementById('pag-dominio').textContent = estado.subdomain + '.pages.dev';
  renderizarTemplates();
  mostrarPasso(7);
  // Revalidar domínio ao chegar no Passo 7
  revalidarDominioNoPasso7();
}

async function revalidarDominioNoPasso7() {
  const btnFinalizar = document.getElementById('btn-finalizar');
  const areaMsg = document.getElementById('area-msg');
  try {
    const resposta = await fetch(WORKER_URL + '/api/ver?subdomain=' + encodeURIComponent(estado.subdomain));
    const dados = await resposta.json();
    if (dados.sucesso) {
      areaMsg.innerHTML = '<div class="msg-erro">❌ Domínio "' + estado.subdomain + '" já está em uso! Volte e escolha outro.</div>';
      btnFinalizar.disabled = true;
      estado.dominioValido = false;
    } else {
      areaMsg.innerHTML = '';
      btnFinalizar.disabled = !templateEscolhido;
      estado.dominioValido = true;
    }
  } catch (erro) {
    areaMsg.innerHTML = '';
    btnFinalizar.disabled = !templateEscolhido;
  }
}

function renderizarTemplates() {
  const lista = document.getElementById('lista-templates');
  const templates = templatesPorNicho[estado.nicho] || [];
  lista.innerHTML = templates.map(t => '<button onclick="escolherTemplate(\'' + t.id + '\', this)" class="btn-template bg-roxo p-4 rounded-lg text-left hover:border-laranja border border-transparent flex items-center gap-4"><div class="text-4xl">' + t.emoji + '</div><div class="flex-1"><div class="font-bold text-lg">' + t.nome + '</div><div class="text-xs text-gray-400">' + t.desc + '</div></div></button>').join('');
}

function escolherTemplate(id, elemento) {
  templateEscolhido = id;
  document.querySelectorAll('.btn-template').forEach(b => b.classList.remove('item-selecionado'));
  elemento.classList.add('item-selecionado');
  if (estado.dominioValido) document.getElementById('btn-finalizar').disabled = false;
}

async function finalizarCadastro() {
  if (!estado.dominioValido) return mostrarMsg('erro', 'Domínio já está em uso! Volte e escolha outro.');
  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Criando sua loja...';
  try {
    const resposta = await fetch(WORKER_URL + '/api/criar-loja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: estado.nome, nome_loja: estado.nomeLoja, subdomain: estado.subdomain, nicho: estado.nicho, plano: estado.plano, zap: estado.zap, template_id: templateEscolhido })
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Erro ao criar loja');
    estado.lojaId = dados.loja.id;
    const lim = limites[estado.plano];
    document.getElementById('dash-nome').textContent = 'Olá, ' + estado.nome + ' 👋';
    document.getElementById('dash-link').textContent = estado.subdomain + '.pages.dev';
    document.getElementById('dash-plano').textContent = estado.plano;
    document.getElementById('dash-fotos').textContent = '0/' + lim.fotos;
    document.getElementById('dash-videos').textContent = '0/' + lim.videos;
    document.getElementById('dash-musicas').textContent = '0/' + lim.musicas;
    document.getElementById('dash-link-final').textContent = estado.subdomain + '.pages.dev';
    document.getElementById('dash-mensal').textContent = 'R$ ' + estado.mensal + '/mês';
    document.getElementById('dash-dica').textContent = dicasPorNicho[estado.nicho] || dicasPorNicho.alimentacao;
    const hoje = new Date(); hoje.setDate(hoje.getDate() + 30);
    document.getElementById('dash-cobranca').textContent = hoje.toLocaleDateString('pt-BR');
    irPara('tela-dashboard');
    carregarAnalytics();
  } catch (erro) {
    mostrarMsg('erro', '❌ ' + erro.message);
    btn.disabled = false;
    btn.innerHTML = 'Finalizar ✓';
  }
}

function copiarPix() { navigator.clipboard.writeText('5517992644042'); mostrarMsg('sucesso', '✅ Chave PIX copiada!'); }
function copiarLink() { navigator.clipboard.writeText(SITE_URL + '/loja.html?subdomain=' + estado.subdomain); mostrarMsg('sucesso', '✅ Link copiado!'); }
function abrirLoja() { window.open(SITE_URL + '/loja.html?subdomain=' + estado.subdomain, '_blank'); }
function compartilharZap() { const texto = 'Olá! Veja minha loja: ' + SITE_URL + '/loja.html?subdomain=' + estado.subdomain; window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(texto), '_blank'); }

async function carregarAnalytics() {
  if (!estado.lojaId) return;
  try {
    const resposta = await fetch(WORKER_URL + '/api/analytics?loja_id=' + estado.lojaId);
    const dados = await resposta.json();
    if (!dados.sucesso) return;
    const a = dados.analytics;
    document.getElementById('dash-visitas-total').textContent = a.total;
    document.getElementById('dash-visitas-hoje').textContent = a.hoje;
    document.getElementById('dash-visitas-semana').textContent = a.semana;
    const lista = document.getElementById('lista-ultimas-visitas');
    if (a.ultimas.length === 0) {
      lista.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">Nenhuma visita ainda. Compartilhe sua loja!</div>';
    } else {
      lista.innerHTML = a.ultimas.map(v => '<div class="bg-black rounded-lg p-3 flex items-center gap-3"><div class="text-2xl">👤</div><div class="flex-1"><div class="text-sm font-bold">Visita registrada</div><div class="text-xs text-gray-400">' + v.data + ' às ' + (v.hora || '--') + '</div></div></div>').join('');
    }
  } catch (erro) { console.error('Erro ao carregar analytics:', erro); }
}

function abrirModalUpload(tipo) {
  const lim = limites[estado.plano];
  if (tipo === 'fotos') {
    document.getElementById('modal-fotos').classList.remove('tela-oculta');
    document.getElementById('modal-fotos-contador').textContent = '0/' + lim.fotos;
    const rotacao = { FREE: 15, BASIC: 90, PLUS: 15, PRO: 0 }[estado.plano] || 30;
    document.getElementById('modal-fotos-rotacao').textContent = rotacao === 0 ? 'Nunca expira' : rotacao + ' dias';
    fotosParaUpload = [];
    document.getElementById('preview-fotos').innerHTML = '';
    document.getElementById('lista-fotos').innerHTML = '';
    carregarFotosExistentes();
  } else if (tipo === 'videos') {
    document.getElementById('modal-videos').classList.remove('tela-oculta');
    document.getElementById('modal-videos-contador').textContent = '0/' + lim.videos;
    const rotacao = { FREE: 15, BASIC: 90, PLUS: 15, PRO: 0 }[estado.plano] || 30;
    document.getElementById('modal-videos-rotacao').textContent = rotacao === 0 ? 'Nunca expira' : rotacao + ' dias';
    videosParaUpload = [];
    document.getElementById('preview-videos').innerHTML = '';
    document.getElementById('lista-videos').innerHTML = '';
    carregarVideosExistentes();
  } else if (tipo === 'musicas') {
    document.getElementById('modal-musicas').classList.remove('tela-oculta');
    document.getElementById('modal-musicas-contador').textContent = '0/' + lim.musicas;
    const rotacao = { FREE: 15, BASIC: 90, PLUS: 15, PRO: 0 }[estado.plano] || 30;
    document.getElementById('modal-musicas-rotacao').textContent = rotacao === 0 ? 'Nunca expira' : rotacao + ' dias';
    musicasParaUpload = [];
    document.getElementById('preview-musicas').innerHTML = '';
    document.getElementById('lista-musicas').innerHTML = '';
    carregarMusicasExistentes();
  }
}

function fecharModal(tipo) { document.getElementById('modal-' + tipo).classList.add('tela-oculta'); }
function handleDrop(e, tipo) { e.preventDefault(); e.currentTarget.classList.remove('border-laranja'); handleFiles(e.dataTransfer.files, tipo); }

function handleFiles(files, tipo) {
  const lim = limites[estado.plano];
  let previewArea, maxTamanho, tiposValidos;
  if (tipo === 'fotos') { previewArea = document.getElementById('preview-fotos'); maxTamanho = 5 * 1024 * 1024; tiposValidos = ['image/jpeg', 'image/png', 'image/webp']; }
  else if (tipo === 'videos') { previewArea = document.getElementById('preview-videos'); maxTamanho = 50 * 1024 * 1024; tiposValidos = ['video/mp4', 'video/webm', 'video/quicktime']; }
  else { previewArea = document.getElementById('preview-musicas'); maxTamanho = 10 * 1024 * 1024; tiposValidos = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']; }
  const campo = tipo === 'fotos' ? 'fotos' : tipo === 'videos' ? 'videos' : 'musicas';
  const itensNoPreview = previewArea.children.length;
  Array.from(files).forEach((file, idx) => {
    if (itensNoPreview + idx >= lim[campo]) { mostrarMsg('erro', '❌ Limite de ' + lim[campo] + ' atingido!'); return; }
    if (!tiposValidos.includes(file.type)) { mostrarMsg('erro', '❌ ' + file.name + ': formato inválido'); return; }
    if (file.size > maxTamanho) { mostrarMsg('erro', '❌ ' + file.name + ': muito grande (máx ' + (maxTamanho / 1024 / 1024) + 'MB)'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const id = 'preview-' + tipo + '-' + Date.now() + '-' + idx;
      if (tipo === 'fotos') fotosParaUpload.push({ id, file, dataUrl: e.target.result });
      else if (tipo === 'videos') videosParaUpload.push({ id, file, dataUrl: e.target.result });
      else musicasParaUpload.push({ id, file, dataUrl: e.target.result });
      const div = document.createElement('div');
      div.id = id;
      div.className = 'bg-roxo rounded-lg p-3 flex items-center gap-3';
      let previewHtml = '';
      if (tipo === 'fotos') previewHtml = '<img src="' + e.target.result + '" class="w-16 h-16 object-cover rounded">';
      else if (tipo === 'videos') previewHtml = '<video src="' + e.target.result + '" class="w-16 h-16 object-cover rounded"></video>';
      else previewHtml = '<div class="w-16 h-16 bg-black rounded flex items-center justify-center text-2xl">🎵</div>';
      div.innerHTML = previewHtml + '<div class="flex-1"><div class="text-sm font-bold truncate">' + file.name + '</div><div class="text-xs text-gray-400">' + (file.size / 1024).toFixed(1) + ' KB</div><div class="text-xs text-amarelo status-text">Aguardando upload...</div></div><button onclick="removerPreview(\'' + id + '\', \'' + tipo + '\')" class="text-vermelho hover:text-white">✕</button>';
      previewArea.appendChild(div);
      atualizarContador(tipo);
      uploadAutomatico(id, file, tipo);
    };
    reader.readAsDataURL(file);
  });
}

function removerPreview(id, tipo) {
  if (tipo === 'fotos') fotosParaUpload = fotosParaUpload.filter(f => f.id !== id);
  else if (tipo === 'videos') videosParaUpload = videosParaUpload.filter(f => f.id !== id);
  else musicasParaUpload = musicasParaUpload.filter(f => f.id !== id);
  const el = document.getElementById(id);
  if (el) el.remove();
  atualizarContador(tipo);
}

function atualizarContador(tipo) {
  const lim = limites[estado.plano];
  const previewArea = document.getElementById('preview-' + tipo);
  const listaArea = document.getElementById('lista-' + tipo);
  const noPreview = previewArea ? previewArea.children.length : 0;
  const naLista = listaArea ? listaArea.querySelectorAll('.item-midia').length : 0;
  const total = noPreview + naLista;
  const campo = tipo === 'fotos' ? 'fotos' : tipo === 'videos' ? 'videos' : 'musicas';
  const contadorEl = document.getElementById('modal-' + tipo + '-contador');
  const dashEl = document.getElementById('dash-' + campo);
  if (contadorEl) contadorEl.textContent = total + '/' + lim[campo];
  if (dashEl) dashEl.textContent = total + '/' + lim[campo];
}

async function uploadAutomatico(id, file, tipo) {
  const formData = new FormData();
  const campo = tipo === 'fotos' ? 'foto' : tipo === 'videos' ? 'video' : 'musica';
  formData.append(campo, file);
  formData.append('loja_id', estado.lojaId);
  const el = document.getElementById(id);
  if (!el) return;
  const statusText = el.querySelector('.status-text');
  try {
    statusText.textContent = 'Enviando...';
    statusText.className = 'text-xs text-amarelo status-text';
    const endpoint = tipo === 'fotos' ? '/api/upload-foto' : tipo === 'videos' ? '/api/upload-video' : '/api/upload-musica';
    const resposta = await fetch(WORKER_URL + endpoint, { method: 'POST', body: formData });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Erro no upload');
    const resultado = tipo === 'fotos' ? dados.midia : tipo === 'videos' ? dados.video : dados.musica;
    statusText.textContent = '✓ Enviado! Expira: ' + resultado.data_expira;
    statusText.className = 'text-xs text-verde status-text';
    atualizarContador(tipo);
  } catch (erro) {
    statusText.textContent = '❌ ' + erro.message;
    statusText.className = 'text-xs text-vermelho status-text';
  }
}

async function carregarFotosExistentes() {
  if (!estado.lojaId) return;
  try {
    const resposta = await fetch(WORKER_URL + '/api/listar-fotos?loja_id=' + estado.lojaId);
    const dados = await resposta.json();
    if (!dados.sucesso) return;
    const lista = document.getElementById('lista-fotos');
    if (dados.midias.length === 0) { lista.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">Nenhuma foto enviada ainda.</div>'; }
    else { lista.innerHTML = '<div class="text-sm font-bold text-amarelo mb-2">Fotos ativas:</div>' + dados.midias.map(m => '<div class="item-midia bg-black rounded-lg p-3 flex items-center gap-3"><img src="' + m.url + '" class="w-16 h-16 object-cover rounded"><div class="flex-1"><div class="text-sm font-bold">Foto</div><div class="text-xs text-gray-400">Upload: ' + (m.data_upload || '--') + '</div><div class="text-xs ' + (m.data_expira ? 'text-amarelo' : 'text-verde') + '">Expira: ' + (m.data_expira || 'Nunca') + '</div></div><button onclick="deletarMidia(\'' + m.id + '\', \'fotos\')" class="bg-vermelho px-3 py-1 rounded text-xs font-bold hover:bg-red-600">Excluir</button></div>').join(''); }
    atualizarContador('fotos');
  } catch (erro) { console.error('Erro ao carregar fotos:', erro); }
}

async function carregarVideosExistentes() {
  if (!estado.lojaId) return;
  try {
    const resposta = await fetch(WORKER_URL + '/api/listar-videos?loja_id=' + estado.lojaId);
    const dados = await resposta.json();
    if (!dados.sucesso) return;
    const lista = document.getElementById('lista-videos');
    if (dados.videos.length === 0) { lista.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">Nenhum vídeo enviado ainda.</div>'; }
    else { lista.innerHTML = '<div class="text-sm font-bold text-amarelo mb-2">Vídeos ativos:</div>' + dados.videos.map(v => '<div class="item-midia bg-black rounded-lg p-3 flex items-center gap-3"><video src="' + v.url + '" class="w-16 h-16 object-cover rounded"></video><div class="flex-1"><div class="text-sm font-bold">' + (v.titulo || 'Vídeo') + '</div><div class="text-xs text-gray-400">Upload: ' + (v.data_upload || '--') + '</div><div class="text-xs ' + (v.data_expira ? 'text-amarelo' : 'text-verde') + '">Expira: ' + (v.data_expira || 'Nunca') + '</div></div><button onclick="deletarMidia(\'' + v.id + '\', \'videos\')" class="bg-vermelho px-3 py-1 rounded text-xs font-bold hover:bg-red-600">Excluir</button></div>').join(''); }
    atualizarContador('videos');
  } catch (erro) { console.error('Erro ao carregar vídeos:', erro); }
}

async function carregarMusicasExistentes() {
  if (!estado.lojaId) return;
  try {
    const resposta = await fetch(WORKER_URL + '/api/listar-musicas?loja_id=' + estado.lojaId);
    const dados = await resposta.json();
    if (!dados.sucesso) return;
    const lista = document.getElementById('lista-musicas');
    if (dados.musicas.length === 0) { lista.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">Nenhuma música enviada ainda.</div>'; }
    else { lista.innerHTML = '<div class="text-sm font-bold text-amarelo mb-2">Músicas ativas:</div>' + dados.musicas.map(m => '<div class="item-midia bg-black rounded-lg p-3 flex items-center gap-3"><div class="w-16 h-16 bg-black rounded flex items-center justify-center text-2xl"></div><div class="flex-1"><div class="text-sm font-bold">' + (m.titulo || 'Música') + '</div><div class="text-xs text-gray-400">' + (m.artista || '--') + '</div><div class="text-xs ' + (m.data_expira ? 'text-amarelo' : 'text-verde') + '">Expira: ' + (m.data_expira || 'Nunca') + '</div></div><button onclick="deletarMidia(\'' + m.id + '\', \'musicas\')" class="bg-vermelho px-3 py-1 rounded text-xs font-bold hover:bg-red-600">Excluir</button></div>').join(''); }
    atualizarContador('musicas');
  } catch (erro) { console.error('Erro ao carregar músicas:', erro); }
}

async function deletarMidia(id, tipo) {
  if (!confirm('Tem certeza que quer excluir?')) return;
  try {
    const endpoint = tipo === 'fotos' ? '/api/deletar-foto' : tipo === 'videos' ? '/api/deletar-video' : '/api/deletar-musica';
    const campoId = tipo === 'fotos' ? 'midia_id' : tipo === 'videos' ? 'video_id' : 'musica_id';
    const resposta = await fetch(WORKER_URL + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [campoId]: id, loja_id: estado.lojaId }) });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro);
    if (tipo === 'fotos') carregarFotosExistentes();
    else if (tipo === 'videos') carregarVideosExistentes();
    else carregarMusicasExistentes();
    mostrarMsg('sucesso', '✅ Excluído!');
  } catch (erro) { mostrarMsg('erro', '❌ ' + erro.message); }
}

document.addEventListener('DOMContentLoaded', () => { console.log('SiteOne carregado.'); });
