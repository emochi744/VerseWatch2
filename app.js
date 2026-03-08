// VerseWatch - Main Application
// Premium Movie & Series Tracker

// ============================================
// STATE
// ============================================
let currentUniverseId = null;
let currentFilter = 'all'; // all | watched | unwatched
let searchTimeout = null;
let modalItem = null;
let modalTmdbData = null;
let currentView = 'home'; // home | stats
let posterCache = {}; // { itemId: tmdbData }

// User Feedback Storage Helpers
const getRatings = () => JSON.parse(localStorage.getItem('versewatch_ratings') || '{}');
const getComments = () => JSON.parse(localStorage.getItem('versewatch_comments') || '{}');
const getRecent = () => JSON.parse(localStorage.getItem('versewatch_recent') || []);

const saveRating = (itemId, rating) => {
    const r = getRatings();
    if (rating === 0) delete r[itemId];
    else r[itemId] = rating;
    localStorage.setItem('versewatch_ratings', JSON.stringify(r));
};

const saveComment = (itemId, comment) => {
    const c = getComments();
    if (!comment.trim()) delete c[itemId];
    else c[itemId] = comment;
    localStorage.setItem('versewatch_comments', JSON.stringify(c));
};

const addToRecent = (itemId) => {
    let recent = getRecent();
    recent = [itemId, ...recent.filter(id => id !== itemId)].slice(0, 10);
    localStorage.setItem('versewatch_recent', JSON.stringify(recent));
};

// ============================================
// GAMIFICATION
// ============================================
const RANKS = [
    { min: 0, name: 'Film Meraklısı', level: 1 },
    { min: 10, name: 'Sıkı İzleyici', level: 2 },
    { min: 30, name: 'Sinefil Adayı', level: 3 },
    { min: 60, name: 'Gerçek Sinefil', level: 4 },
    { min: 100, name: 'Koleksiyoncu', level: 5 },
    { min: 200, name: 'Film Gurusu', level: 6 },
    { min: 350, name: 'Sinema Üstadı', level: 7 },
    { min: 500, name: 'Efsanevi İzleyici', level: 8 }
];

function updateLevelUI() {
    let totalWatched = 0;
    UNIVERSES.forEach(u => totalWatched += getUniverseStats(u).done);

    let currentRank = RANKS[0];
    let nextRank = RANKS[1];

    for (let i = 0; i < RANKS.length; i++) {
        if (totalWatched >= RANKS[i].min) {
            currentRank = RANKS[i];
            nextRank = RANKS[i + 1] || null;
        } else {
            break;
        }
    }

    $('user-rank').textContent = currentRank.name;
    $('user-level-num').textContent = `Seviye ${currentRank.level}`;

    if (nextRank) {
        const xpInLevel = totalWatched - currentRank.min;
        const totalNeeded = nextRank.min - currentRank.min;
        const pct = Math.min(Math.round((xpInLevel / totalNeeded) * 100), 100);

        $('level-progress-fill').style.width = pct + '%';
        $('level-xp-text').textContent = `${totalWatched} / ${nextRank.min} İzleme`;
        $('level-percent').textContent = `%${pct}`;
    } else {
        $('level-progress-fill').style.width = '100%';
        $('level-xp-text').textContent = `${totalWatched} İzleme (MAX)`;
        $('level-percent').textContent = '%100';
    }
}

// ============================================
// DOM REFS
// ============================================
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// Data migration from CineTrack to VerseWatch
function migrateData() {
    const oldKeys = {
        'cinetrack_watched': 'versewatch_watched',
        'cinetrack_tmdb_key': 'versewatch_tmdb_key',
        'cinetrack_tmdb_cache': 'versewatch_tmdb_cache'
    };

    let migrated = false;
    for (const [oldKey, newKey] of Object.entries(oldKeys)) {
        const data = localStorage.getItem(oldKey);
        if (data !== null) {
            // Only migrate if new key doesn't exist or we want to force override (first time)
            if (localStorage.getItem(newKey) === null) {
                localStorage.setItem(newKey, data);
            }
            localStorage.removeItem(oldKey);
            migrated = true;
        }
    }
    if (migrated) console.log('Data successfully migrated to VerseWatch');
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    migrateData();
    // One-time cache clear for the new private key to refresh metadata
    if (!localStorage.getItem('versewatch_final_refresh_v1')) {
        localStorage.removeItem('versewatch_tmdb_cache');
        localStorage.setItem('versewatch_final_refresh_v1', 'done');
    }
    // Detect if running on file:// and suggest installation for better performance
    if (window.location.protocol === 'file:') {
        setTimeout(() => {
            showToast("İpucu: Daha hızlı ve sorunsuz bir deneyim için uygulamayı yükleyin! 📲🚀", "info");
        }, 3000);
    }

    renderHomeView();
    setupNav();
    setupSearch();
    setupModal();

    // Start preloading immediately
    preloadAllUniverses();

    // PWA Install Prompt Logic
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('PWA Install Prompt will be shown when needed');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        console.log('VerseWatch PWA Installed!');
    });
});

// ============================================
// NAVIGATION
// ============================================
function setupNav() {
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });

    $('logo-home').addEventListener('click', () => switchView('home'));
}

function switchView(view) {
    currentView = view;
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));

    // Toggle main views
    $('view-home').classList.toggle('active', view === 'home');
    $('view-stats').classList.toggle('active', view === 'stats');

    // Always hide universe detail when switching main tabs
    $('view-universe-wrapper').classList.remove('active');
    currentUniverseId = null;

    if (view === 'home') renderHomeView();
    if (view === 'stats') renderStatsView();
}

// ============================================
// HOME / PORTAL VIEW
// ============================================
function renderHomeView() {
    try { renderGlobalStats(); } catch (e) { console.warn('Global stats failed:', e); }
    try { updateLevelUI(); } catch (e) { console.warn('Level UI failed:', e); }
    try { renderRecentlyWatched(); } catch (e) { console.warn('Recent panel failed:', e); }
    try { renderPortalGrid(); } catch (e) { console.warn('Portal grid failed:', e); }
}

function renderRecentlyWatched() {
    const container = $('recent-scroll');
    const panel = $('recent-panel');
    const recentIds = getRecent();

    if (recentIds.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    container.innerHTML = '';

    recentIds.forEach(id => {
        // Find item in UNIVERSES
        let foundItem = null;
        for (const u of UNIVERSES) {
            foundItem = u.items.find(i => i.id === id);
            if (foundItem) break;
        }
        if (!foundItem) return;

        const tmdb = posterCache[id];
        const card = document.createElement('div');
        card.className = 'recent-card';

        if (tmdb && tmdb.posterUrl) {
            card.innerHTML = `<img src="${tmdb.posterUrl}" alt="${foundItem.title}">`;
        } else {
            card.innerHTML = `<div class="movie-poster-placeholder" style="background:${foundItem.posterCss || '#333'}"><div class="ph-text" style="font-size:10px">${foundItem.title}</div></div>`;
        }

        card.addEventListener('click', () => openModal(foundItem));
        container.appendChild(card);
    });
}

function renderGlobalStats() {
    let totalAll = 0, doneAll = 0;
    UNIVERSES.forEach(u => {
        const s = getUniverseStats(u);
        totalAll += s.total;
        doneAll += s.done;
    });
    const pct = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

    $('stat-total').textContent = totalAll;
    $('stat-watched').textContent = doneAll;
    $('stat-percent').textContent = pct + '%';
}

function renderPortalGrid() {
    const container = $('portal-grid');
    if (!container) return;
    container.innerHTML = '';

    UNIVERSES.forEach((universe, idx) => {
        const stats = getUniverseStats(universe);
        const card = document.createElement('div');
        card.className = 'portal-card';
        card.style.animationDelay = `${idx * 100}ms`;

        // Try to find a background image from the first item
        const firstItem = universe.items[0];
        const tmdb = posterCache[firstItem?.id];
        const bgImg = tmdb?.backdropUrl || '';

        card.innerHTML = `
            ${bgImg ? `<img src="${bgImg}" class="portal-card-img" alt="${universe.name}">` : `<div class="portal-card-img" style="background:${universe.gradient}"></div>`}
            <div class="portal-card-title">${universe.shortName}</div>
            <div class="portal-card-count">${stats.done} / ${stats.total} İzlenen</div>
        `;

        card.addEventListener('click', () => showUniverseDetail(universe.id));
        container.appendChild(card);
    });
}

// ============================================
// UNIVERSE DETAIL VIEW
// ============================================
function showUniverseDetail(universeId) {
    currentUniverseId = universeId;
    currentFilter = 'all';
    const universe = UNIVERSES.find(u => u.id === universeId);
    if (!universe) return;

    // Switch view state
    $('view-home').classList.remove('active');
    $('view-universe-wrapper').classList.add('active');

    window.scrollTo(0, 0);

    // Update Header
    $('detail-universe-name').textContent = `${universe.shortName}`;
    updateDetailProgress(universe);

    renderFilterTabs();
    renderMoviesGrid(universe);
    lazyLoadPosters(universe);
}

function hideUniverseDetail() {
    $('view-universe-wrapper').classList.remove('active');
    currentUniverseId = null;

    // Go back to home view specifically 
    if (currentView === 'home') {
        $('view-home').classList.add('active');
    }
    renderHomeView(); // refresh stats
}

function updateDetailProgress(universe) {
    const stats = getUniverseStats(universe);
    $('detail-universe-progress').textContent = `${stats.done} / ${stats.total} izlendi • %${stats.percent}`;
    $('detail-progress-fill').style.width = stats.percent + '%';
    $('detail-progress-fill').style.background = universe.gradient;
}

function renderFilterTabs() {
    const container = $('filter-tabs');
    const tabs = [
        { id: 'all', label: 'Tümü' },
        { id: 'unwatched', label: 'İzlenmedi' },
        { id: 'watched', label: 'İzlendi' },
        { id: 'movie', label: 'Filmler' },
        { id: 'series', label: 'Diziler' },
    ];
    container.innerHTML = '';
    tabs.forEach(tab => {
        const el = document.createElement('button');
        el.className = `filter-tab ${currentFilter === tab.id ? 'active' : ''}`;
        el.textContent = tab.label;
        el.addEventListener('click', () => {
            currentFilter = tab.id;
            $$('.filter-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            const universe = UNIVERSES.find(u => u.id === currentUniverseId);
            if (universe) renderMoviesGrid(universe);
        });
        container.appendChild(el);
    });
}

function getFilteredItems(universe) {
    const watched = getWatched();
    return universe.items.filter(item => {
        if (currentFilter === 'watched') return !!watched[item.id];
        if (currentFilter === 'unwatched') return !watched[item.id];
        if (currentFilter === 'movie') return item.type === 'movie';
        if (currentFilter === 'series') return item.type === 'series';
        return true;
    });
}

function renderMoviesGrid(universe) {
    const grid = $('movies-grid');
    const items = getFilteredItems(universe);

    if (items.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">🎬</div>
        <div class="empty-title">İçerik bulunamadı</div>
        <div class="empty-desc">Seçili filtreyle eşleşen içerik yok.</div>
      </div>`;
        return;
    }

    grid.innerHTML = '';
    items.forEach((item, idx) => {
        const card = createMovieCard(item, idx);
        grid.appendChild(card);
    });
}

function createMovieCard(item, idx) {
    const watched = isWatched(item.id);
    const tmdb = posterCache[item.id];

    const card = document.createElement('div');
    card.className = `movie-card ${watched ? 'watched' : ''} ${!tmdb ? 'movie-skeleton' : ''}`;
    card.id = `card-${item.id}`;
    card.style.animationDelay = `${Math.min(idx * 30, 300)}ms`;

    const posterHtml = tmdb && tmdb.posterUrl
        ? `<img class="movie-poster" src="${tmdb.posterUrl}" alt="${item.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'movie-poster-placeholder\\' style=\\'background: ${item.posterCss || '#333'}\\'></div>'">`
        : `<div class="movie-poster-placeholder" style="background: ${item.posterCss || '#333'}"><div class="ph-text">${escHtml(item.title)}</div></div>`;

    const userRating = getRatings()[item.id];

    card.innerHTML = `
    ${posterHtml}
    <div class="type-badge ${item.type}">${item.type === 'series' ? 'Dizi' : 'Film'}</div>
    ${userRating ? `<div class="user-rating-badge">⭐ ${userRating}</div>` : ''}
    <div class="watched-badge">✓</div>
    <div class="movie-overlay">
      <div class="movie-title-overlay">${escHtml(item.title)}</div>
      <div class="movie-year-overlay">${item.year}</div>
    </div>
  `;

    card.addEventListener('click', () => openModal(item));
    return card;
}

function updateMovieCard(item) {
    const card = $(`card-${item.id}`);
    if (!card) return;

    const tmdb = posterCache[item.id];
    const watched = isWatched(item.id);

    card.classList.toggle('watched', watched);
    card.classList.remove('movie-skeleton');

    if (tmdb && (tmdb.thumbUrl || tmdb.posterUrl)) {
        const existing = card.querySelector('.movie-poster-placeholder');
        if (existing) {
            const img = document.createElement('img');
            img.className = 'movie-poster';
            img.src = tmdb.thumbUrl || tmdb.posterUrl;
            img.alt = item.title;
            img.loading = 'lazy';
            img.onerror = function () {
                this.parentElement.innerHTML = `<div class="movie-poster-placeholder" style="background: ${item.posterCss || '#333'}"></div>`;
            };
            existing.replaceWith(img);
        }
    } else {
        const p = card.querySelector('.movie-poster-placeholder');
        if (p) p.style.background = item.posterCss || '#333';
    }
}

async function lazyLoadPosters(universe) {
    // Load in batches
    const BATCH = 6;
    for (let i = 0; i < universe.items.length; i += BATCH) {
        const batch = universe.items.slice(i, i + BATCH);
        await Promise.all(batch.map(async item => {
            if (posterCache[item.id]) {
                updateMovieCard(item);
                return;
            }
            const data = await getMovieDetails(item.tmdbId, item.type);
            posterCache[item.id] = data;
            updateMovieCard(item);
        }));
        // Small delay between batches to be nice to the API
        if (i + BATCH < universe.items.length) {
            await new Promise(r => setTimeout(r, 100));
        }
    }
}

// Preload poster data and IMAGES for ALL universes silently in the background
async function preloadAllUniverses() {
    if (!hasTMDBKey()) return;

    const prefetchImage = (url) => {
        if (!url) return;
        const img = new Image();
        img.src = url;
    };

    // 1. Parallelize Portal/Home background metadata & images
    await Promise.all(UNIVERSES.map(async universe => {
        const firstItem = universe.items[0];
        if (!firstItem) return;
        const data = await getMovieDetails(firstItem.tmdbId, firstItem.type);
        if (data) {
            posterCache[firstItem.id] = data;
            prefetchImage(data.backdropUrl);
            prefetchImage(data.thumbUrl || data.posterUrl);
        }
    }));
    renderPortalGrid(); // Render all portals immediately as soon as metadata is ready

    // 2. Parallelize everything else in massive batches
    for (const universe of UNIVERSES) {
        const BATCH = 25; // Massive parallelization for file:// protocol
        for (let i = 0; i < universe.items.length; i += BATCH) {
            const batch = universe.items.slice(i, i + BATCH);
            await Promise.all(batch.map(async item => {
                if (posterCache[item.id]) {
                    prefetchImage(posterCache[item.id].thumbUrl || posterCache[item.id].posterUrl);
                    return;
                }
                const data = await getMovieDetails(item.tmdbId, item.type);
                if (data) {
                    posterCache[item.id] = data;
                    prefetchImage(data.thumbUrl || data.posterUrl);
                    if (currentUniverseId === universe.id) updateMovieCard(item);
                }
            }));
        }
    }
}

// ============================================
// MODAL
// ============================================
function setupModal() {
    const overlay = $('modal-overlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    $('modal-close-btn').addEventListener('click', closeModal);
    $('modal-watch-btn').addEventListener('click', toggleWatchModal);

    // Comment listener
    $('modal-comment-text').addEventListener('input', (e) => {
        if (modalItem) saveComment(modalItem.id, e.target.value);
    });
}

function renderModalStars(currentRating) {
    const container = $('modal-rating-stars');
    const display = $('modal-rating-value');
    container.innerHTML = '';
    display.textContent = currentRating > 0 ? currentRating.toFixed(1) : '0.0';

    for (let i = 1; i <= 10; i++) {
        const star = document.createElement('span');
        star.className = 'star-rating';
        star.innerHTML = '★';

        if (i <= Math.floor(currentRating)) {
            star.classList.add('active');
        } else if (i === Math.ceil(currentRating) && currentRating % 1 !== 0) {
            star.classList.add('half');
        }

        star.addEventListener('click', (e) => {
            const rect = star.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const isHalf = x < rect.width / 2;
            const clickedVal = i - (isHalf ? 0.5 : 0);

            const newRating = clickedVal === currentRating ? 0 : clickedVal;
            saveRating(modalItem.id, newRating);
            renderModalStars(newRating);

            // Update card in grid
            const card = $(`card-${modalItem.id}`);
            if (card) {
                const badge = card.querySelector('.user-rating-badge');
                if (newRating > 0) {
                    if (badge) badge.textContent = `⭐ ${newRating}`;
                    else {
                        const newBadge = document.createElement('div');
                        newBadge.className = 'user-rating-badge';
                        newBadge.textContent = `⭐ ${newRating}`;
                        card.insertBefore(newBadge, card.querySelector('.watched-badge'));
                    }
                } else if (badge) {
                    badge.remove();
                }
            }
        });
        container.appendChild(star);
    }
}

async function openModal(item) {
    modalItem = item;
    const overlay = $('modal-overlay');

    // Set basic info immediately
    $('modal-title').textContent = item.title;
    $('modal-year').textContent = item.year;
    $('modal-type').textContent = item.type === 'series' ? '📺 Dizi' : '🎬 Film';
    $('modal-rating').textContent = '...';
    $('modal-runtime').textContent = '';
    $('modal-overview').textContent = 'Yükleniyor...';
    $('modal-genres').innerHTML = '';
    $('modal-backdrop-container').innerHTML = `<div class="modal-backdrop-placeholder"></div>`;

    updateModalWatchBtn(item);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Load TMDB data
    let data = posterCache[item.id];
    if (!data) {
        data = await getMovieDetails(item.tmdbId, item.type);
        posterCache[item.id] = data;
    }

    if (!data) return;
    modalTmdbData = data;

    if (data.backdropUrl) {
        $('modal-backdrop-container').innerHTML = `
      <div class="modal-backdrop">
        <img src="${data.backdropUrl}" alt="${escHtml(item.title)}">
        <div class="modal-backdrop-overlay"></div>
      </div>`;
    } else {
        $('modal-backdrop-container').innerHTML = `
      <div class="modal-backdrop" style="background: ${item.posterCss || '#333'}">
        <div class="modal-backdrop-overlay"></div>
      </div>`;
    }
    // Removed redundant backdrop insertion

    $('modal-rating').textContent = data.rating ? `⭐ ${data.rating}` : '—';
    if (data.runtime) $('modal-runtime').textContent = `• ${data.runtime} dk`;
    $('modal-overview').textContent = data.overview || 'Bu içerik için açıklama bulunamadı.';

    if (data.genres && data.genres.length > 0) {
        $('modal-genres').innerHTML = data.genres.slice(0, 4).map(g =>
            `<span class="genre-tag">${g}</span>`
        ).join('');
    }

    // Initialize User Feedback
    const userRating = getRatings()[item.id] || 0;
    const userComment = getComments()[item.id] || '';
    renderModalStars(userRating);
    $('modal-comment-text').value = userComment;
}

function closeModal() {
    const overlay = $('modal-overlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    modalItem = null;
    modalTmdbData = null;
}

function updateModalWatchBtn(item) {
    const btn = $('modal-watch-btn');
    const watched = isWatched(item.id);
    btn.className = `btn-watch-toggle ${watched ? 'watched' : 'unwatched'}`;
    btn.innerHTML = watched
        ? `<span>✓</span><span class="toggle-text">İzlendi — Geri al</span>`
        : `<span>▶</span><span class="toggle-text">İzledim olarak işaretle</span>`;
}

function toggleWatchModal() {
    if (!modalItem) return;
    const wasWatched = isWatched(modalItem.id);
    toggleWatched(modalItem.id);
    const nowWatched = isWatched(modalItem.id);

    if (nowWatched) addToRecent(modalItem.id);

    updateModalWatchBtn(modalItem);

    // Update card in grid
    const card = $(`card-${modalItem.id}`);
    if (card) card.classList.toggle('watched', nowWatched);

    // Refresh UI Components
    const universe = UNIVERSES.find(u => u.id === currentUniverseId);
    if (universe) updateDetailProgress(universe);

    updateLevelUI();
    renderRecentlyWatched();

    showToast(nowWatched
        ? `✓ "${modalItem.title}" izlendi olarak işaretlendi!`
        : `"${modalItem.title}" işareti kaldırıldı.`,
        nowWatched ? 'success' : 'info'
    );
}

// ============================================
// SEARCH
// ============================================
function setupSearch() {
    const toggleBtn = $('search-toggle-btn');
    const bar = $('search-bar');
    const input = $('search-input');
    const results = $('search-results-container');

    toggleBtn.addEventListener('click', () => {
        const isOpen = bar.classList.toggle('open');
        toggleBtn.classList.toggle('active', isOpen);
        if (isOpen) { setTimeout(() => input.focus(), 200); }
        else { input.value = ''; results.classList.remove('open'); results.innerHTML = ''; }
    });

    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = input.value.trim();
        if (q.length < 2) { results.classList.remove('open'); results.innerHTML = ''; return; }
        searchTimeout = setTimeout(() => performSearch(q), 400);
    });
}

async function performSearch(query) {
    const results = $('search-results-container');
    results.innerHTML = '<div class="loading-spinner"></div>';
    results.classList.add('open');

    const items = await searchTMDB(query);

    if (items.length === 0) {
        results.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Sonuç bulunamadı</div></div>`;
        return;
    }

    results.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'search-result-card';
        card.innerHTML = `
      ${item.posterUrl
                ? `<img class="search-result-poster" src="${item.posterUrl}" alt="${escHtml(item.title)}">`
                : `<div class="search-result-poster" style="display:flex;align-items:center;justify-content:center;font-size:24px">🎬</div>`}
      <div class="search-result-info">
        <div class="search-result-title">${escHtml(item.title)}</div>
        <div class="search-result-meta">${item.year} • ${item.type === 'series' ? 'Dizi' : 'Film'} ${item.rating ? `• ⭐ ${item.rating}` : ''}</div>
        ${item.overview ? `<div class="search-result-overview">${escHtml(item.overview)}</div>` : ''}
      </div>
    `;
        card.addEventListener('click', () => openModal({ ...item, id: `search-${item.tmdbId}` }));
        results.appendChild(card);
    });
}

// ============================================
// STATS VIEW
// ============================================
function renderStatsView() {
    let totalAll = 0, doneAll = 0, moviesWatched = 0, seriesWatched = 0;
    const watched = getWatched();

    UNIVERSES.forEach(u => {
        const s = getUniverseStats(u);
        totalAll += s.total;
        doneAll += s.done;
        u.items.forEach(it => {
            if (watched[it.id]) {
                if (it.type === 'movie') moviesWatched++;
                else seriesWatched++;
            }
        });
    });

    $('stats-total-count').textContent = totalAll;
    $('stats-done-count').textContent = doneAll;

    // Universe Mastery Calculation
    const masteryGrid = $('mastery-grid');
    if (masteryGrid) {
        masteryGrid.innerHTML = '';
        UNIVERSES.forEach(u => {
            const s = getUniverseStats(u);
            if (s.done > 0) {
                const card = document.createElement('div');
                card.className = 'mastery-card';

                let title = 'Çırak';
                if (s.percent >= 100) title = 'Master';
                else if (s.percent >= 75) title = 'Uzman';
                else if (s.percent >= 50) title = 'Kıdemli';
                else if (s.percent >= 25) title = 'Gezgin';

                card.innerHTML = `
                    <div class="mastery-icon">${u.icon}</div>
                    <div class="mastery-name">${u.shortName}</div>
                    <div class="mastery-title">${title}</div>
                `;
                masteryGrid.appendChild(card);
            }
        });
    }

    // Universe breakdown
    const breakdown = $('stats-universe-breakdown');
    breakdown.innerHTML = '';
    UNIVERSES.forEach(u => {
        const s = getUniverseStats(u);
        const div = document.createElement('div');
        div.className = 'universe-progress-item';
        div.innerHTML = `
      <div class="universe-progress-header">
        <span class="universe-progress-name">${u.icon} ${u.shortName}</span>
        <span class="universe-progress-count">${s.done}/${s.total} • %${s.percent}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: ${s.percent}%; background: ${u.gradient}"></div>
      </div>
    `;
        breakdown.appendChild(div);
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
let toastTimeout;
function showToast(msg, type = 'info') {
    const toast = $('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================
// UTILS
// ============================================
function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================
// [API Key Modal Logic Removed - Using Fixed Private Key]
