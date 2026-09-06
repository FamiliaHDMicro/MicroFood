// ==========================================
// loja.js — MicroFood Store Frontend
// JavaScript PURO de navegador (sem export default)
// ==========================================

(function() {
    'use strict';

    const DEFAULT_TEMPLATE = 'glamour-studio';

    // ---- UTILITÁRIOS ----
    function getSubdomain() {
        const params = new URLSearchParams(window.location.search);
        return params.get('subdomain') || '';
    }

    function getTemplateClass(template) {
        const map = {
            'glamour-studio': 'template-glamour',
            'elegant-gold': 'template-elegant',
            'modern-green': 'template-modern',
            'dark-purple': 'template-dark',
            'sunset-orange': 'template-sunset',
            'ocean-blue': 'template-ocean'
        };
        return map[template] || 'template-glamour';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function generatePlaceholder(width, height, text) {
        const colors = ['e94560', 'd4af37', '00d4aa', '8b5cf6', 'ff6b35', '0ea5e9'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
            '<rect width="100%" height="100%" fill="#' + color + '" opacity="0.3"/>' +
            '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:0.8"/>' +
            '<stop offset="100%" style="stop-color:#' + color + ';stop-opacity:0.4"/>' +
            '</linearGradient></defs>' +
            '<rect width="100%" height="100%" fill="url(#grad)"/>' +
            '<text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">' + text + '</text>' +
            '</svg>';
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // ---- BUSCAR DADOS DA LOJA ----
    async function fetchStoreData(subdomain) {
        try {
            const response = await fetch('/api/store?subdomain=' + encodeURIComponent(subdomain));
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.log('API não disponível, tentando localStorage...');
        }

        try {
            const stored = localStorage.getItem('store_' + subdomain);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.log('localStorage não disponível');
        }

        return getDemoData(subdomain);
    }

    function getDemoData(subdomain) {
        return {
            subdomain: subdomain,
            storeName: subdomain,
            template: DEFAULT_TEMPLATE,
            plan: 'FREE',
            photos: [
                { id: 1, url: generatePlaceholder(400, 400, subdomain + ' - Foto 1'), title: 'Foto 1', active: true, order: 1 },
                { id: 2, url: generatePlaceholder(400, 400, subdomain + ' - Foto 2'), title: 'Foto 2', active: true, order: 2 },
                { id: 3, url: generatePlaceholder(400, 400, subdomain + ' - Foto 3'), title: 'Foto 3', active: true, order: 3 },
                { id: 4, url: generatePlaceholder(400, 400, subdomain + ' - Foto 4'), title: 'Foto 4', active: true, order: 4 },
                { id: 5, url: generatePlaceholder(400, 400, subdomain + ' - Foto 5'), title: 'Foto 5', active: true, order: 5 },
                { id: 6, url: generatePlaceholder(400, 400, subdomain + ' - Foto 6'), title: 'Foto 6', active: true, order: 6 }
            ],
            videos: [
                { id: 1, url: '', title: 'Vídeo de apresentação', duration: '2:30', active: true },
                { id: 2, url: '', title: 'Bastidores', duration: '1:45', active: true }
            ],
            music: [
                { id: 1, url: '', title: 'Música ambiente 1', duration: '3:20', active: true },
                { id: 2, url: '', title: 'Música ambiente 2', duration: '4:10', active: true },
                { id: 3, url: '', title: 'Música ambiente 3', duration: '2:55', active: true }
            ],
            visits: 142,
            createdAt: '2026-09-01'
        };
    }

    // ---- REGISTRAR VISITA ----
    async function registerVisit(subdomain) {
        try {
            await fetch('/api/visit?subdomain=' + encodeURIComponent(subdomain), { method: 'POST' });
        } catch (e) {
            // silencioso
        }
    }

    // ---- RENDER: HEADER ----
    function renderHeader(store) {
        return '<header class="store-header">' +
            '<h1>' + escapeHtml(store.storeName || store.subdomain) + '</h1>' +
            '<div class="template-badge">' + (store.template || DEFAULT_TEMPLATE) + '</div>' +
            '<div class="store-stats">' +
            '<span>📸 <strong>' + (store.photos || []).filter(function(p) { return p.active; }).length + '</strong> fotos</span>' +
            '<span>🎬 <strong>' + (store.videos || []).filter(function(v) { return v.active; }).length + '</strong> vídeos</span>' +
            '<span>🎵 <strong>' + (store.music || []).filter(function(m) { return m.active; }).length + '</strong> músicas</span>' +
            '<span>👁 <strong>' + (store.visits || 0) + '</strong> visitas</span>' +
            '</div></header>';
    }

    // ---- RENDER: GALERIA ----
    function renderGallery(photos) {
        const activePhotos = (photos || []).filter(function(p) { return p.active; }).sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

        if (activePhotos.length === 0) {
            return '<section class="section"><h2 class="section-title"><span class="icon">📸</span> Galeria <span class="count">0</span></h2>' +
                '<div class="empty-state"><div class="empty-icon">📷</div><p>Nenhuma foto disponível ainda</p></div></section>';
        }

        let items = '';
        activePhotos.forEach(function(photo, index) {
            const isRotating = photo.rotation && photo.active;
            items += '<div class="gallery-item" onclick="openLightbox(\'' + photo.url + '\')">' +
                '<img src="' + photo.url + '" alt="' + escapeHtml(photo.title || 'Foto ' + (index + 1)) + '" loading="lazy">' +
                (isRotating ? '<div class="rotation-badge">🔄 Ativa</div>' : '') +
                '<div class="overlay"><span>' + escapeHtml(photo.title || 'Foto ' + (index + 1)) + '</span></div></div>';
        });

        return '<section class="section"><h2 class="section-title"><span class="icon">📸</span> Galeria <span class="count">' + activePhotos.length + '</span></h2>' +
            '<div class="gallery-grid">' + items + '</div></section>';
    }

    // ---- RENDER: VÍDEOS ----
    function renderVideos(videos) {
        const activeVideos = (videos || []).filter(function(v) { return v.active; });

        if (activeVideos.length === 0) {
            return '<section class="section"><h2 class="section-title"><span class="icon">🎬</span> Vídeos <span class="count">0</span></h2>' +
                '<div class="empty-state"><div class="empty-icon">🎥</div><p>Nenhum vídeo disponível ainda</p></div></section>';
        }

        let items = '';
        activeVideos.forEach(function(video) {
            const hasVideo = video.url && video.url.length > 0;
            if (hasVideo) {
                items += '<div class="video-item"><video controls preload="metadata"><source src="' + video.url + '" type="video/mp4">Seu navegador não suporta vídeo.</video>' +
                    '<div class="video-info"><h4>' + escapeHtml(video.title || 'Vídeo') + '</h4><span>' + (video.duration || '--:--') + '</span></div></div>';
            } else {
                items += '<div class="video-item"><div style="width:100%;aspect-ratio:16/9;background:#1a1a2e;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #2a2a4a;"><span style="font-size:3rem;">🎬</span></div>' +
                    '<div class="video-info"><h4>' + escapeHtml(video.title || 'Vídeo') + '</h4><span>' + (video.duration || '--:--') + '</span></div></div>';
            }
        });

        return '<section class="section"><h2 class="section-title"><span class="icon">🎬</span> Vídeos <span class="count">' + activeVideos.length + '</span></h2>' +
            '<div class="videos-grid">' + items + '</div></section>';
    }

    // ---- RENDER: MÚSICAS ----
    function renderMusic(music) {
        const activeMusic = (music || []).filter(function(m) { return m.active; });

        if (activeMusic.length === 0) {
            return '<section class="section"><h2 class="section-title"><span class="icon">🎵</span> Músicas <span class="count">0</span></h2>' +
                '<div class="empty-state"><div class="empty-icon">🎶</div><p>Nenhuma música disponível ainda</p></div></section>';
        }

        let items = '';
        activeMusic.forEach(function(track, index) {
            const hasAudio = track.url && track.url.length > 0;
            items += '<div class="music-item" data-index="' + index + '" data-url="' + (track.url || '') + '">' +
                '<div class="play-btn" onclick="toggleMusic(' + index + ')">' +
                '<svg viewBox="0 0 24 24" class="play-icon"><polygon points="5,3 19,12 5,21"/></svg>' +
                '<svg viewBox="0 0 24 24" class="pause-icon" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
                '</div>' +
                '<div class="music-info"><h4>' + escapeHtml(track.title || 'Música ' + (index + 1)) + '</h4><span>' + (track.duration || '--:--') + '</span></div>' +
                '<div class="music-progress"><div class="bar"><div class="fill" id="progress-' + index + '"></div></div>' +
                '<div class="time" id="time-' + index + '">' + (hasAudio ? '0:00 / ' + (track.duration || '--:--') : 'Sem áudio') + '</div></div></div>';
        });

        return '<section class="section"><h2 class="section-title"><span class="icon">🎵</span> Músicas <span class="count">' + activeMusic.length + '</span></h2>' +
            '<div class="music-list">' + items + '</div></section>';
    }

    // ---- RENDER: FOOTER ----
    function renderFooter(store) {
        return '<footer class="store-footer"><p>Loja criada com <a href="https://microfood.pages.dev" target="_blank">MicroFood</a> • ' +
            'Plano: ' + (store.plan || 'FREE') + ' • Desde: ' + (store.createdAt || '2026') + '</p></footer>';
    }

    // ---- PLAYER DE MÚSICA ----
    let currentAudio = null;
    let currentIndex = -1;

    window.toggleMusic = function(index) {
        const musicItems = document.querySelectorAll('.music-item');
        const item = musicItems[index];
        if (!item) return;

        const url = item.getAttribute('data-url');

        if (currentIndex === index && currentAudio) {
            if (currentAudio.paused) {
                currentAudio.play();
                updatePlayButton(index, true);
            } else {
                currentAudio.pause();
                updatePlayButton(index, false);
            }
            return;
        }

        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
            if (currentIndex >= 0) updatePlayButton(currentIndex, false);
        }

        if (!url || url.length === 0) {
            alert('🎵 Áudio não disponível ainda. O dono da loja precisa fazer upload do arquivo.');
            return;
        }

        currentAudio = new Audio(url);
        currentIndex = index;
        currentAudio.play();
        updatePlayButton(index, true);

        currentAudio.addEventListener('timeupdate', function() {
            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            const fillEl = document.getElementById('progress-' + index);
            const timeEl = document.getElementById('time-' + index);
            if (fillEl) fillEl.style.width = progress + '%';
            if (timeEl) timeEl.textContent = formatTime(currentAudio.currentTime) + ' / ' + formatTime(currentAudio.duration);
        });

        currentAudio.addEventListener('ended', function() {
            updatePlayButton(index, false);
            const nextIndex = index + 1;
            if (musicItems[nextIndex]) toggleMusic(nextIndex);
        });
    };

    function updatePlayButton(index, isPlaying) {
        const musicItems = document.querySelectorAll('.music-item');
        const item = musicItems[index];
        if (!item) return;

        const playBtn = item.querySelector('.play-btn');
        const playIcon = item.querySelector('.play-icon');
        const pauseIcon = item.querySelector('.pause-icon');

        if (isPlaying) {
            playBtn.classList.add('playing');
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playBtn.classList.remove('playing');
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    // ---- LIGHTBOX ----
    window.openLightbox = function(url) {
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightbox-img');
        img.src = url;
        lightbox.classList.add('active');
    };

    window.closeLightbox = function() {
        document.getElementById('lightbox').classList.remove('active');
    };

    // ---- INICIALIZAÇÃO ----
    async function init() {
        const subdomain = getSubdomain();
        const app = document.getElementById('app');

        if (!subdomain) {
            app.innerHTML = '<div class="empty-state" style="padding:100px 20px;"><div class="empty-icon">🔍</div>' +
                '<p>Subdomínio não informado.</p><p style="margin-top:10px;color:#888;">Use: ?subdomain=nome_da_loja</p></div>';
            return;
        }

        const store = await fetchStoreData(subdomain);

        if (!store) {
            app.innerHTML = '<div class="empty-state" style="padding:100px 20px;"><div class="empty-icon">❌</div>' +
                '<p>Loja "' + escapeHtml(subdomain) + '" não encontrada.</p></div>';
            return;
        }

        document.body.classList.add(getTemplateClass(store.template));
        registerVisit(subdomain);

        app.innerHTML = renderHeader(store) + renderGallery(store.photos) + renderVideos(store.videos) + renderMusic(store.music) + renderFooter(store);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
