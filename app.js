// VerseWatch - Main Application
// Premium Movie & Series Tracker

// ============================================
// STATE
// ============================================
let currentUniverseId = null;
let currentFilter = 'all'; // all | watched | unwatched
let currentSort = 'default'; // default | name | year | rating
let currentSortDir = 1; // 1 = asc, -1 = desc
let searchTimeout = null;
let modalItem = null;
let modalTmdbData = null;
let currentView = 'home'; // home | stats
let posterCache = {}; // { itemId: tmdbData }
let currentUniverseRef = null; // universe reference for color

// User Feedback Storage Helpers
const getWatched = () => { try { return JSON.parse(localStorage.getItem('versewatch_watched')) || {}; } catch (e) { return {}; } };
const isWatched = (itemId) => !!getWatched()[itemId];
const getWatchDates = () => { try { return JSON.parse(localStorage.getItem('versewatch_watch_dates')) || {}; } catch (e) { return {}; } };
const toggleWatched = (itemId) => {
    const w = getWatched();
    const dates = getWatchDates();
    if (w[itemId]) {
        delete w[itemId];
        delete dates[itemId];
    } else {
        w[itemId] = true;
        dates[itemId] = Date.now();
    }
    localStorage.setItem('versewatch_watched', JSON.stringify(w));
    localStorage.setItem('versewatch_watch_dates', JSON.stringify(dates));
    return !!w[itemId];
};

const getRatings = () => { try { return JSON.parse(localStorage.getItem('versewatch_ratings')) || {}; } catch (e) { return {}; } };
const getComments = () => { try { return JSON.parse(localStorage.getItem('versewatch_comments')) || {}; } catch (e) { return {}; } };
const getRecent = () => { try { return JSON.parse(localStorage.getItem('versewatch_recent')) || []; } catch (e) { return []; } };

const getWatchlist = () => { try { return JSON.parse(localStorage.getItem('versewatch_watchlist')) || []; } catch (e) { return []; } };
const toggleWatchlist = (itemId) => {
    let list = getWatchlist();
    const index = list.indexOf(itemId);
    if (index > -1) list.splice(index, 1);
    else list.push(itemId);
    localStorage.setItem('versewatch_watchlist', JSON.stringify(list));
    return list.includes(itemId);
};

const saveRating = (itemId, rating) => {
    const r = getRatings();
    if (rating === 0) delete r[itemId];
    else r[itemId] = rating;
    localStorage.setItem('versewatch_ratings', JSON.stringify(r));
};

const getEpisodes = () => { try { return JSON.parse(localStorage.getItem('versewatch_episodes')) || {}; } catch (e) { return {}; } };

const saveEpisodeProgress = (itemId, season, episode) => {
    const ep = getEpisodes();
    if (season === 0 && episode === 0) {
        delete ep[itemId];
    } else {
        ep[itemId] = { season, episode };
    }
    localStorage.setItem('versewatch_episodes', JSON.stringify(ep));
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

const getTheme = () => localStorage.getItem('versewatch_theme') || 'theme-purple';
const saveTheme = (themeClass) => {
    localStorage.setItem('versewatch_theme', themeClass);
    document.body.className = themeClass;
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

function getUniverseStats(universe) {
    const watchedMap = getWatched();
    let done = 0;
    universe.items.forEach(item => {
        if (watchedMap[item.id]) done++;
    });
    return {
        total: universe.items.length,
        done,
        percent: universe.items.length > 0 ? Math.round((done / universe.items.length) * 100) : 0
    };
}

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
// GENRE PICKER MODAL (Özellik 11)
// ============================================
const GENRE_CHIPS = [
    { id: 28, label: 'Aksiyon', emoji: '💥' },
    { id: 35, label: 'Komedi', emoji: '😂' },
    { id: 27, label: 'Korku', emoji: '👻' },
    { id: 10749, label: 'Romantik', emoji: '❤️' },
    { id: 878, label: 'Sci-Fi', emoji: '🚀' },
    { id: 18, label: 'Drama', emoji: '🎭' },
    { id: 12, label: 'Macera', emoji: '🗺️' },
    { id: 16, label: 'Animasyon', emoji: '🎨' },
    { id: 53, label: 'Gerilim', emoji: '⚡' },
    { id: 99, label: 'Belgesel', emoji: '📽️' },
];

let genreModalSelectedIds = [];

function openGenreModal() {
    let overlay = document.getElementById('genre-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'genre-modal-overlay';
        overlay.className = 'genre-modal-overlay';
        overlay.innerHTML = `
            <div class="genre-modal-sheet">
                <div class="genre-modal-handle"></div>
                <div class="genre-modal-title">🎲 Ne İzlesem?</div>
                <div class="genre-modal-sub">Bir mood seç, senin için önerelim!</div>
                <div class="genre-chips" id="genre-chips-wrap"></div>
                <button class="genre-modal-btn" id="genre-modal-go">🎬 Film Bul</button>
                <span class="genre-modal-skip" id="genre-modal-skip">Rastgele İzlet</span>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeGenreModal(); });
        document.getElementById('genre-modal-skip').addEventListener('click', () => { closeGenreModal(); suggestRandomItemDirect(); });
        document.getElementById('genre-modal-go').addEventListener('click', () => {
            closeGenreModal();
            suggestWithGenre(genreModalSelectedIds);
        });
    }
    // Render chips
    genreModalSelectedIds = [];
    const wrap = document.getElementById('genre-chips-wrap');
    wrap.innerHTML = '';
    GENRE_CHIPS.forEach(g => {
        const chip = document.createElement('button');
        chip.className = 'genre-chip';
        chip.innerHTML = `<span>${g.emoji}</span>${g.label}`;
        chip.addEventListener('click', () => {
            const idx = genreModalSelectedIds.indexOf(g.id);
            if (idx > -1) { genreModalSelectedIds.splice(idx, 1); chip.classList.remove('selected'); }
            else { genreModalSelectedIds.push(g.id); chip.classList.add('selected'); }
        });
        wrap.appendChild(chip);
    });
    setTimeout(() => overlay.classList.add('open'), 10);
}

function closeGenreModal() {
    const overlay = document.getElementById('genre-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

async function suggestWithGenre(genreIds) {
    showToast('Seçiminize göre film aranıyor... 🎯', 'info');
    try {
        const params = { sort_by: 'popularity.desc', include_adult: false, page: Math.floor(Math.random() * 10) + 1 };
        if (genreIds.length > 0) params.with_genres = genreIds.join(',');
        const data = await fetchTMDB('/discover/movie', params);
        if (data && data.results && data.results.length > 0) {
            const results = data.results.filter(r => r.poster_path && r.overview);
            if (results.length > 0) {
                const r = results[Math.floor(Math.random() * results.length)];
                const item = {
                    id: `genre-${r.id}`,
                    tmdbId: r.id,
                    title: r.title || r.name,
                    year: (r.release_date || '').slice(0, 4),
                    type: 'movie',
                    posterUrl: r.poster_path ? `https://wsrv.nl/?url=image.tmdb.org/t/p/w342${r.poster_path}&output=webp&n=1&q=70` : null,
                    backdropUrl: r.backdrop_path ? `https://wsrv.nl/?url=image.tmdb.org/t/p/w780${r.backdrop_path}&output=webp&n=1&q=70` : null,
                    rating: Math.round((r.vote_average || 0) * 10) / 10,
                    overview: r.overview
                };
                posterCache[item.id] = item;
                openModal(item);
                return;
            }
        }
    } catch (e) { console.warn('Genre suggest failed:', e); }
    suggestRandomItemDirect();
}

async function suggestRandomItemDirect() {
    showToast('Tüm veritabanından rastgele içerik aranıyor 🎲', 'info');
    const randMovie = await fetchRandomTMDBMovie();
    if (randMovie) {
        randMovie.id = `random-${randMovie.tmdbId}`;
        if (!isWatched(randMovie.id)) {
            posterCache[randMovie.id] = randMovie;
            openModal(randMovie);
            return;
        }
    }
    const allItems = [];
    UNIVERSES.forEach(u => allItems.push(...u.items));
    const unwatchedItems = allItems.filter(item => !isWatched(item.id));
    if (unwatchedItems.length === 0) { showToast('İzlenecek hiçbir şey kalmadı, efsanesin!', 'success'); return; }
    openModal(unwatchedItems[Math.floor(Math.random() * unwatchedItems.length)]);
}

async function suggestRandomItem() {
    openGenreModal();
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

    renderHomeView();
    setupNav();
    setupSearch();
    setupModal();

    // Init Theme and Random Button
    document.body.className = getTheme();
    $$('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => saveTheme(btn.dataset.theme));
    });

    const btnRandom = $('btn-random-suggest');
    if (btnRandom) btnRandom.addEventListener('click', suggestRandomItem);

    // Start preloading immediately
    preloadAllUniverses();

    // PWA Install Prompt Logic
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });
    window.addEventListener('appinstalled', () => { deferredPrompt = null; });

    // ============================================
    // FIREBASE INIT + AUTH STATE
    // ============================================
    if (typeof firebase !== 'undefined') {
        initFirebase();
        setupFirebaseUI();

        onAuthReady(async (user) => {
            if (user) {
                currentUser = user;
                $('login-overlay').style.display = 'none';
                // Load or create profile
                const profile = await createOrGetUserProfile(user);
                if (profile && (profile.isNew || !profile.nick || profile.nick.trim() === '')) {
                    // Force user to set nickname if missing
                    showNicknameModal(false);
                } else if (profile) {
                    localStorage.setItem('vw_user_nick', profile.nick || '');
                    localStorage.setItem('vw_user_avatar', profile.avatar || '🎬');
                    localStorage.setItem('vw_user_photo', profile.photoURL || '');
                    // Sync local watched to Firestore
                    syncLocalToFirestore(user.uid).catch(e => console.warn('[Firebase] Sync error:', e));
                    renderProfileViewFirebase(profile);
                }
            } else {
                currentUser = null;
                // Show login overlay
                if (window.location.protocol !== 'file:') {
                    $('login-overlay').style.display = 'flex';
                } else {
                    // On file:// — skip login, run offline
                    console.log('[Firebase] file:// detected, running offline mode');
                    showToast('Çevrimdışı mod: Sosyal özellikler için http://localhost üzerinden aç 🌐', 'info');
                }
            }
        });
    } else {
        console.warn('[Firebase] SDK not loaded, running offline');
    }
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

    $('logo-home').addEventListener('click', () => {
        window.scrollTo(0, 0);
        switchView('home');
    });
}

function switchView(view) {
    window.scrollTo(0, 0);
    currentView = view;
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));

    // Toggle main views
    $('view-home').classList.toggle('active', view === 'home');
    $('view-popular').classList.toggle('active', view === 'popular');
    $('view-stats').classList.toggle('active', view === 'stats');
    const profileView = $('view-profile');
    if (profileView) profileView.classList.toggle('active', view === 'profile');

    // Always hide universe detail when switching main tabs
    $('view-universe-wrapper').classList.remove('active');
    currentUniverseId = null;

    if (view === 'home') renderHomeView();
    if (view === 'popular') renderPopularView();
    if (view === 'stats') renderStatsView();
    if (view === 'profile') renderProfileView();
}

function renderProfileView() {
    const grid = $('profile-grid');
    const profileView = $('view-profile');
    if (!grid || !profileView) return;

    const watchedMap = getWatched();
    const ratings = getRatings();
    grid.innerHTML = '';

    // Remove old profile stats section if exists
    const oldStats = profileView.querySelector('.profile-stats-strip');
    if (oldStats) oldStats.remove();
    const oldGenre = profileView.querySelector('.profile-genre-section');
    if (oldGenre) oldGenre.remove();
    const oldTop = profileView.querySelector('.profile-top-rated');
    if (oldTop) oldTop.remove();

    const watchedItems = [];
    UNIVERSES.forEach(u => {
        u.items.forEach(item => {
            if (watchedMap[item.id]) watchedItems.push(item);
        });
    });
    Object.keys(watchedMap).forEach(id => {
        if (!watchedItems.find(i => i.id === id)) {
            const cached = posterCache[id];
            if (cached) watchedItems.push(cached);
        }
    });

    // --- Profile Stats Strip (Feature 8) ---
    const moviesCount = watchedItems.filter(i => i.type === 'movie').length;
    const seriesCount = watchedItems.filter(i => i.type === 'series').length;
    const ratedItems = watchedItems.filter(i => ratings[i.id]);
    const avgRating = ratedItems.length > 0
        ? (ratedItems.reduce((sum, i) => sum + ratings[i.id], 0) / ratedItems.length).toFixed(1)
        : '—';

    const statsStrip = document.createElement('div');
    statsStrip.className = 'profile-stats-strip';
    statsStrip.innerHTML = `
        <div class="profile-stat-card"><div class="profile-stat-val" style="color:var(--accent-blue)">${moviesCount}</div><div class="profile-stat-lbl">Film</div></div>
        <div class="profile-stat-card"><div class="profile-stat-val" style="color:#f59e0b">${seriesCount}</div><div class="profile-stat-lbl">Dizi</div></div>
        <div class="profile-stat-card"><div class="profile-stat-val" style="color:#ffc107">${avgRating === '—' ? '—' : '⭐' + avgRating}</div><div class="profile-stat-lbl">Ort. Puan</div></div>
    `;

    // --- Genre Breakdown ---
    const genreCount = {};
    watchedItems.forEach(item => {
        const cached = posterCache[item.id];
        if (cached && cached.genres) {
            cached.genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; });
        }
    });
    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxGenre = topGenres[0] ? topGenres[0][1] : 1;

    let genreSection = null;
    if (topGenres.length > 0) {
        genreSection = document.createElement('div');
        genreSection.className = 'profile-genre-section';
        genreSection.innerHTML = `<div class="profile-genre-title">🎭 Favori Türler</div>` +
            topGenres.map(([genre, count]) => `
                <div class="genre-bar-item">
                    <div class="genre-bar-label">${genre}</div>
                    <div class="genre-bar-track"><div class="genre-bar-fill" style="width:${Math.round((count / maxGenre) * 100)}%"></div></div>
                    <div class="genre-bar-count">${count}</div>
                </div>`).join('');
    }

    // --- Top Rated Films ---
    const ratedSorted = watchedItems
        .filter(i => ratings[i.id])
        .sort((a, b) => ratings[b.id] - ratings[a.id])
        .slice(0, 3);

    let topSection = null;
    if (ratedSorted.length > 0) {
        topSection = document.createElement('div');
        topSection.className = 'profile-top-rated';
        const rankClasses = ['gold', 'silver', 'bronze'];
        const rankEmojis = ['🥇', '🥈', '🥉'];
        topSection.innerHTML = `<div class="top-rated-title">🏆 En Çok Beğendiklerin</div><div class="top-rated-list" id="top-rated-list"></div>`;
        // Insert after render
    }

    // Insert stats before grid
    const sectionHeader = profileView.querySelector('.section-header');
    if (sectionHeader) {
        profileView.insertBefore(statsStrip, sectionHeader);
        if (genreSection) profileView.insertBefore(genreSection, sectionHeader);
        if (topSection) {
            profileView.insertBefore(topSection, sectionHeader);
            // Fill top rated list
            const listEl = topSection.querySelector('#top-rated-list');
            if (listEl) ratedSorted.forEach((item, i) => {
                const el = document.createElement('div');
                el.className = 'top-rated-item';
                el.innerHTML = `
                    <div class="top-rated-rank ${['gold', 'silver', 'bronze'][i]}">${['🥇', '🥈', '🥉'][i]}</div>
                    <div class="top-rated-info"><div class="top-rated-name">${escHtml(item.title)}</div></div>
                    <div class="top-rated-score">⭐ ${ratings[item.id]}</div>`;
                el.addEventListener('click', () => openModal(item));
                listEl.appendChild(el);
            });
        }
    } else {
        profileView.insertBefore(statsStrip, grid);
        if (genreSection) profileView.insertBefore(genreSection, grid);
        if (topSection) profileView.insertBefore(topSection, grid);
    }

    if (watchedItems.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Henüz hiçbir şey izlemedin. Portalda keşfe çık!</div>';
        return;
    }

    watchedItems.forEach(item => {
        const card = createMovieCard(item);
        grid.appendChild(card);
    });
}

async function renderPopularView() {
    const grid = $('popular-grid');
    const upcomingPanel = $('upcoming-panel');

    if (!grid) return;
    if (grid.dataset.loaded === 'true') return;
    grid.dataset.loaded = 'true';

    const [popularItems, upcomingItems] = await Promise.all([
        fetchPopularTMDB(),
        fetchUpcomingTMDB()
    ]);

    // Render Upcoming — Vertical list style (Feature 3)
    if (upcomingItems && upcomingItems.length > 0) {
        upcomingPanel.style.display = 'block';
        // Replace scroll container with vertical list
        const existingScroll = $('upcoming-scroll');
        const listContainer = document.createElement('div');
        listContainer.className = 'upcoming-list';
        listContainer.id = 'upcoming-list';

        upcomingItems.forEach(item => {
            const releaseDate = new Date(item.releaseDate);
            const now = new Date();
            const daysLeft = Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24));
            const dateText = releaseDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            const countdownText = daysLeft > 0 ? `${daysLeft} gün` : 'Bu hafta!';

            const el = document.createElement('div');
            el.className = 'upcoming-item';
            el.innerHTML = `
                ${item.posterUrl ? `<img class="upcoming-item-poster" src="${item.posterUrl}" alt="${escHtml(item.title)}" loading="lazy">` : `<div class="upcoming-item-poster" style="background:var(--bg-card)"></div>`}
                <div class="upcoming-item-info">
                    <div class="upcoming-item-title">${escHtml(item.title)}</div>
                    <div class="upcoming-item-date">📅 ${dateText}</div>
                    ${item.overview ? `<div class="upcoming-item-overview">${escHtml(item.overview)}</div>` : ''}
                </div>
                <div class="upcoming-countdown">${countdownText}</div>`;

            posterCache[item.id] = Object.assign({}, item);
            el.addEventListener('click', () => openModal(item));
            listContainer.appendChild(el);
        });

        if (existingScroll) existingScroll.replaceWith(listContainer);
        else upcomingPanel.appendChild(listContainer);
    }

    if (popularItems.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">İçerikler yüklenemedi.</div>';
        return;
    }

    grid.innerHTML = '';
    popularItems.forEach(item => {
        posterCache[item.id] = item;
        const card = createMovieCard(item);
        grid.appendChild(card);
    });
}



// ============================================
// HOME / PORTAL VIEW
// ============================================
function renderHomeView() {
    try { renderGlobalStats(); } catch (e) { console.warn('Global stats failed:', e); }
    try { updateLevelUI(); } catch (e) { console.warn('Level UI failed:', e); }
    try { renderRecentlyWatched(); } catch (e) { console.warn('Recent panel failed:', e); }
    try { renderWatchlist(); } catch (e) { console.warn('Watchlist panel failed:', e); }
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

function renderWatchlist() {
    const container = $('watchlist-scroll');
    const panel = $('watchlist-panel');
    const watchlistIds = getWatchlist();

    if (watchlistIds.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    container.innerHTML = '';

    watchlistIds.forEach(id => {
        // Find item in UNIVERSES
        let foundItem = null;
        for (const u of UNIVERSES) {
            foundItem = u.items.find(i => i.id === id);
            if (foundItem) break;
        }

        // If it's a popular item (not in predefined universes) it won't be found this way cleanly, 
        // but for now, we rely on the universe logic. Popular items might need separate handling later.
        if (!foundItem) return;

        const tmdb = posterCache[id];
        const card = document.createElement('div');
        card.className = 'recent-card'; // Reuse recent card styling

        if (tmdb && tmdb.posterUrl) {
            card.innerHTML = `<img src="${tmdb.posterUrl}" alt="${foundItem.title}">
                              <div style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:10px;font-size:10px;border:1px solid var(--glass-border)">🔖</div>`;
        } else {
            card.innerHTML = `<div class="movie-poster-placeholder" style="background:${foundItem.posterCss || '#333'}"><div class="ph-text" style="font-size:10px">${foundItem.title}</div></div>
                              <div style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:10px;font-size:10px;border:1px solid var(--glass-border)">🔖</div>`;
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
        card.style.animationDelay = `${idx * 80}ms`;

        // Try to find a background image from the first item
        const firstItem = universe.items[0];
        const tmdb = posterCache[firstItem?.id];
        const bgImg = tmdb?.backdropUrl || '';

        card.innerHTML = `
            ${bgImg ? `<img src="${bgImg}" class="portal-card-img" alt="${universe.name}">` : `<div class="portal-card-img" style="background:${universe.gradient};opacity:0.8"></div>`}
            <div style="position:absolute;top:10px;right:10px;font-size:22px;z-index:2;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9))">${universe.icon}</div>
            ${stats.percent > 0 ? `<div style="position:absolute;top:10px;left:10px;z-index:2;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border-radius:20px;padding:3px 8px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.15)">%${stats.percent}</div>` : ''}
            <div class="portal-card-title">${universe.shortName}</div>
            <div class="portal-card-count">${stats.done} / ${stats.total} izlendi</div>
            <div class="portal-card-progress">
                <div class="portal-card-progress-fill" style="width:${stats.percent}%;background:${universe.gradient}"></div>
            </div>
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
    container.innerHTML = '';

    // Filter row
    const filterRow = document.createElement('div');
    filterRow.className = 'filter-tabs';
    const filterDef = [
        { id: 'all', label: 'Tümü' },
        { id: 'unwatched', label: 'İzlenmedi' },
        { id: 'watched', label: 'İzlendi' },
        { id: 'movie', label: '🎬 Film' },
        { id: 'series', label: '📺 Dizi' },
    ];
    filterDef.forEach(tab => {
        const el = document.createElement('button');
        el.className = `filter-tab ${currentFilter === tab.id ? 'active' : ''}`;
        el.textContent = tab.label;
        el.addEventListener('click', () => {
            currentFilter = tab.id;
            filterRow.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            const universe = UNIVERSES.find(u => u.id === currentUniverseId);
            if (universe) renderMoviesGrid(universe);
        });
        filterRow.appendChild(el);
    });
    container.appendChild(filterRow);

    // Sort row
    const sortRow = document.createElement('div');
    sortRow.className = 'sort-tabs';
    const sortDef = [
        { id: 'default', label: 'Varsayılan' },
        { id: 'name', label: 'İsim' },
        { id: 'year', label: 'Yıl' },
        { id: 'rating', label: '⭐ Puan' },
    ];
    sortDef.forEach(s => {
        const el = document.createElement('button');
        el.className = `sort-tab ${currentSort === s.id ? 'active' : ''}`;
        el.innerHTML = s.label + (currentSort === s.id ? `<span class="sort-dir">${currentSortDir === 1 ? '↑' : '↓'}</span>` : '');
        el.addEventListener('click', () => {
            if (currentSort === s.id) { currentSortDir *= -1; }
            else { currentSort = s.id; currentSortDir = s.id === 'rating' ? -1 : 1; }
            renderFilterTabs();
            const universe = UNIVERSES.find(u => u.id === currentUniverseId);
            if (universe) renderMoviesGrid(universe);
        });
        sortRow.appendChild(el);
    });
    container.appendChild(sortRow);
}

function getFilteredItems(universe) {
    const watched = getWatched();
    const ratings = getRatings();
    let items = universe.items.filter(item => {
        if (currentFilter === 'watched') return !!watched[item.id];
        if (currentFilter === 'unwatched') return !watched[item.id];
        if (currentFilter === 'movie') return item.type === 'movie';
        if (currentFilter === 'series') return item.type === 'series';
        return true;
    });
    // Apply sort
    if (currentSort === 'name') {
        items = [...items].sort((a, b) => currentSortDir * a.title.localeCompare(b.title, 'tr'));
    } else if (currentSort === 'year') {
        items = [...items].sort((a, b) => currentSortDir * (Number(a.year) - Number(b.year)));
    } else if (currentSort === 'rating') {
        items = [...items].sort((a, b) => {
            const ra = ratings[a.id] || (posterCache[a.id] ? posterCache[a.id].rating : 0) || 0;
            const rb = ratings[b.id] || (posterCache[b.id] ? posterCache[b.id].rating : 0) || 0;
            return currentSortDir * (rb - ra);
        });
    }
    return items;
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

    // Determine universe color (Feature 6)
    const universe = UNIVERSES.find(u => u.items.some(i => i.id === item.id));
    const uColor = universe ? universe.color : null;
    const uGlow = uColor ? uColor + '33' : 'rgba(0,212,255,0.15)';

    const card = document.createElement('div');
    card.className = `movie-card ${watched ? 'watched' : ''} ${!tmdb ? 'movie-skeleton' : ''}`;
    card.id = `card-${item.id}`;
    card.style.animationDelay = `${Math.min((idx || 0) * 30, 300)}ms`;
    if (uColor) {
        card.dataset.universeColor = uColor;
        card.style.setProperty('--card-universe-color', uColor);
        card.style.setProperty('--card-universe-color-glow', uGlow);
    }

    const posterHtml = tmdb && tmdb.posterUrl
        ? `<img class="movie-poster" src="${tmdb.posterUrl}" alt="${escHtml(item.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'movie-poster-placeholder\\' style=\\'background: ${item.posterCss || '#333'}\\'></div>'">`
        : `<div class="movie-poster-placeholder" style="background: ${item.posterCss || '#333'}"><div class="ph-text">${escHtml(item.title)}</div></div>`;

    const userRating = getRatings()[item.id];

    card.innerHTML = `
    ${posterHtml}
    <div class="swipe-hint-right">✓</div>
    <div class="swipe-hint-left">✕</div>
    <div class="type-badge ${item.type}">${item.type === 'series' ? 'Dizi' : 'Film'}</div>
    ${userRating ? `<div class="user-rating-badge">⭐ ${userRating}</div>` : ''}
    <div class="watched-badge">✓</div>
    <div class="movie-overlay">
      <div class="movie-title-overlay">${escHtml(item.title)}</div>
      <div class="movie-year-overlay">${item.year}</div>
    </div>
  `;

    card.addEventListener('click', () => openModal(item));

    // Swipe gesture (Feature 9)
    addSwipeGesture(card, item);

    return card;
}

function addSwipeGesture(card, item) {
    let startX = 0, currentX = 0, isDragging = false;
    const SWIPE_THRESHOLD = 50;

    const onStart = (e) => {
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        isDragging = true;
        currentX = startX;
    };
    const onMove = (e) => {
        if (!isDragging) return;
        currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const dx = currentX - startX;
        if (Math.abs(dx) > 15) {
            card.classList.toggle('swiping-right', dx > 20);
            card.classList.toggle('swiping-left', dx < -20);
        }
    };
    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const dx = currentX - startX;
        card.classList.remove('swiping-right', 'swiping-left');
        if (Math.abs(dx) >= SWIPE_THRESHOLD) {
            if (dx > 0) {
                // Swipe right → mark as watched
                if (!isWatched(item.id)) {
                    toggleWatched(item.id);
                    addToRecent(item.id);
                    card.classList.add('watched');
                    showToast(`✓ "${item.title}" İzlendi!`, 'success');
                    updateLevelUI();
                    renderRecentlyWatched();
                    const u = UNIVERSES.find(u2 => u2.id === currentUniverseId);
                    if (u) updateDetailProgress(u);
                }
            } else {
                // Swipe left → add to watchlist
                const inList = toggleWatchlist(item.id);
                showToast(inList ? `🔖 "${item.title}" listeye eklendi!` : `"${item.title}" listeden çıkarıldı.`, 'info');
                renderWatchlist();
            }
        }
    };

    card.addEventListener('touchstart', onStart, { passive: true });
    card.addEventListener('touchmove', onMove, { passive: true });
    card.addEventListener('touchend', onEnd);
    card.addEventListener('mousedown', onStart);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseup', onEnd);
    card.addEventListener('mouseleave', () => {
        if (isDragging) { isDragging = false; card.classList.remove('swiping-right', 'swiping-left'); }
    });
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

    const watchListBtn = $('modal-watchlist-btn');
    if (watchListBtn) watchListBtn.addEventListener('click', toggleWatchlistModal);

    // Comment listener
    $('modal-comment-text').addEventListener('input', (e) => {
        if (modalItem) saveComment(modalItem.id, e.target.value);
    });

    // Episode tracker listeners
    $('btn-season-plus').addEventListener('click', () => updateEpisodeTracker('season', 1));
    $('btn-season-minus').addEventListener('click', () => updateEpisodeTracker('season', -1));
    $('btn-episode-plus').addEventListener('click', () => updateEpisodeTracker('episode', 1));
    $('btn-episode-minus').addEventListener('click', () => updateEpisodeTracker('episode', -1));
}

function updateEpisodeTracker(type, delta) {
    if (!modalItem || modalItem.type !== 'series') return;
    const ep = getEpisodes()[modalItem.id] || { season: 1, episode: 1 };

    if (type === 'season') {
        ep.season = Math.max(1, ep.season + delta);
    } else {
        ep.episode = Math.max(1, ep.episode + delta);
    }

    saveEpisodeProgress(modalItem.id, ep.season, ep.episode);
    $('tracker-season-val').textContent = ep.season;
    $('tracker-episode-val').textContent = ep.episode;
}

function toggleWatchlistModal() {
    if (!modalItem) return;
    const isNowInWatchlist = toggleWatchlist(modalItem.id);
    updateModalWatchlistBtn(modalItem);
    renderWatchlist();

    showToast(isNowInWatchlist
        ? `🔖 "${modalItem.title}" listene eklendi!`
        : `"${modalItem.title}" listenden çıkarıldı.`, 'info');
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

            // Auto-check watched
            if (newRating > 0 && !isWatched(modalItem.id)) {
                toggleWatchModal();
            }

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
    updateModalWatchlistBtn(item);

    const trackerUI = $('modal-series-tracker');
    if (item.type === 'series') {
        trackerUI.style.display = 'block';
        const epData = getEpisodes()[item.id] || { season: 1, episode: 1 };
        $('tracker-season-val').textContent = epData.season;
        $('tracker-episode-val').textContent = epData.episode;
    } else {
        trackerUI.style.display = 'none';
    }

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

function updateModalWatchlistBtn(item) {
    const btn = $('modal-watchlist-btn');
    if (!btn) return;
    const inWatchlist = getWatchlist().includes(item.id);
    btn.style.background = inWatchlist ? 'rgba(124, 58, 237, 0.2)' : 'var(--bg-card)';
    btn.style.color = inWatchlist ? 'var(--accent-purple)' : 'var(--text-secondary)';
    btn.style.borderColor = inWatchlist ? 'rgba(124, 58, 237, 0.5)' : 'var(--glass-border)';
    btn.innerHTML = inWatchlist ? '🔖' : '🔖';
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

    // Position search results dynamically right below the search bar
    function updateResultsPosition() {
        const rect = bar.getBoundingClientRect();
        const top = rect.bottom + 6;
        results.style.top = `${top}px`;
    }

    function closeSearch() {
        bar.classList.remove('open');
        toggleBtn.classList.remove('active');
        results.classList.remove('open');
        results.innerHTML = '';
        input.value = '';
    }

    toggleBtn.addEventListener('click', () => {
        const isOpen = bar.classList.toggle('open');
        toggleBtn.classList.toggle('active', isOpen);
        if (isOpen) {
            updateResultsPosition();
            setTimeout(() => input.focus(), 200);
        } else {
            results.classList.remove('open');
            results.innerHTML = '';
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!bar.contains(e.target) && !results.contains(e.target) && !toggleBtn.contains(e.target)) {
            results.classList.remove('open');
        }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });

    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = input.value.trim();
        if (q.length < 2) { results.classList.remove('open'); results.innerHTML = ''; return; }
        updateResultsPosition();
        searchTimeout = setTimeout(() => performSearch(q), 200);
    });
}


// Local instant search helper
function searchLocal(query) {
    const normTR = (s) => s.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
    const qNorm = normTR(query);
    const qLower = query.toLowerCase();
    const results = [];
    for (const u of UNIVERSES) {
        for (const item of u.items) {
            if (!item.title) continue;
            const t = item.title.toLowerCase();
            const tN = normTR(item.title);
            if (t.includes(qLower) || tN.includes(qNorm)) {
                const cached = posterCache[item.id];
                results.push({
                    tmdbId: item.tmdbId,
                    title: item.title,
                    year: item.year || '',
                    type: item.type || 'movie',
                    posterUrl: cached ? cached.posterUrl : null,
                    rating: cached ? cached.rating : 0,
                    overview: cached ? cached.overview : null,
                    _localItem: item
                });
                if (results.length >= 8) return results;
            }
        }
    }
    return results;
}

function renderSearchCards(items, container) {
    container.innerHTML = '';
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
        const clickItem = item._localItem || { ...item, id: `search-${item.tmdbId}` };
        card.addEventListener('click', () => {
            if (item.posterUrl) posterCache[clickItem.id] = item;
            openModal(clickItem);
        });
        container.appendChild(card);
    });
}

async function performSearch(query) {
    const resultsEl = $('search-results-container');
    resultsEl.classList.add('open');

    // 1. Anında local sonuç göster
    const localItems = searchLocal(query);
    if (localItems.length > 0) {
        renderSearchCards(localItems, resultsEl);
    } else {
        resultsEl.innerHTML = '<div class="loading-spinner"></div>';
    }

    // 2. Arka planda API dene (timeout kısa)
    try {
        const apiItems = await Promise.race([
            searchTMDB(query),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        if (apiItems && apiItems.length > 0) {
            renderSearchCards(apiItems, resultsEl);
            return;
        }
    } catch (e) { /* API başarısız, local result kalsın */ }

    // 3. API başarısız, local yoksa empty state
    if (localItems.length === 0) {
        resultsEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Sonuç bulunamadı</div><div style="font-size:12px;color:var(--text-muted);margin-top:8px">Koleksiyonumuzda "${escHtml(query)}" bulunamadı.</div></div>`;
    }
}


// ============================================
// STATS VIEW
// ============================================

// ============================================
// FIREBASE PROFILE UI HANDLERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Logout button
    const btnLogout = $('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (confirm('Çıkış yapmak istediğine emin misin?')) {
                try {
                    await signOutUser();
                    localStorage.removeItem('vw_user_nick');
                    localStorage.removeItem('vw_user_avatar');
                    window.location.reload();
                } catch (e) {
                    showToast('Çıkış yapılamadı: ' + e.message, 'error');
                }
            }
        });
    }

    // Tab switching
    const tabFriends = $('tab-friends');
    const tabWatched = $('tab-watched');
    const contentFriends = $('friends-tab-content');
    const contentWatched = $('watched-tab-content');

    if (tabFriends && tabWatched) {
        tabFriends.addEventListener('click', () => {
            tabFriends.classList.add('active');
            tabFriends.style.background = 'var(--accent-purple)';
            tabFriends.style.color = '#fff';

            tabWatched.classList.remove('active');
            tabWatched.style.background = 'transparent';
            tabWatched.style.color = 'var(--text-muted)';

            contentFriends.style.display = 'block';
            contentWatched.style.display = 'none';

            // Re-render friends list if clicked
            if (currentUser) renderFriendsTab();
        });

        tabWatched.addEventListener('click', () => {
            tabWatched.classList.add('active');
            tabWatched.style.background = 'var(--accent-purple)';
            tabWatched.style.color = '#fff';

            tabFriends.classList.remove('active');
            tabFriends.style.background = 'transparent';
            tabFriends.style.color = 'var(--text-muted)';

            contentWatched.style.display = 'block';
            contentFriends.style.display = 'none';
        });
    }
});

// ============================================
// PROFILE VIEW
// ============================================
function renderProfileView() {
    const grid = $('profile-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Load Firebase profile text if logged in
    if (currentUser) {
        const nick = localStorage.getItem('vw_user_nick') || 'Kullanıcı';
        const avatar = localStorage.getItem('vw_user_avatar') || '🎬';
        const nickEl = $('profile-firebase-nick');
        const avatarEl = $('profile-firebase-avatar');
        if (nickEl) nickEl.textContent = nick;
        if (avatarEl) avatarEl.textContent = avatar;

        // Also render friends list
        renderFriendsTab();
    } else {
        // Not logged in fallback
        const nickEl = $('profile-firebase-nick');
        if (nickEl) nickEl.textContent = 'Misafir Kullanıcı 👻';
    }

    const watched = getWatched();
    const ratings = getRatings();

    const items = [];
    UNIVERSES.forEach(u => {
        u.items.forEach(it => {
            if (watched[it.id]) {
                const cached = posterCache[it.id];
                items.push({
                    item: it,
                    u: u,
                    cache: cached,
                    ratingDate: it.id // fallback date sort (could use actual watchDate from localStorage)
                });
            }
        });
    });

    if (items.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🎬</div>
      <div class="empty-title">Henüz Bir Şey İzlemedin</div>
      <div style="font-size:13px;color:var(--text-muted)">Portal'dan film/dizi izledikçe burada listelenecek.</div>
    </div>`;
        return;
    }

    // Son izlenenlere göre sırala (tersten)
    items.reverse();

    items.forEach(({ item, u, cache }) => {
        const card = document.createElement('div');
        card.className = 'grid-item';
        card.setAttribute('data-id', item.id);
        const watchedClass = 'watched';
        const posterUrl = cache?.posterUrl || '';
        const userRating = ratings[item.id] || 0;
        card.innerHTML = `
      ${posterUrl
                ? `<img class="item-poster" src="${posterUrl}" loading="lazy" alt="${escHtml(item.title)}">`
                : `<div class="item-poster" style="display:flex;align-items:center;justify-content:center;font-size:32px;background:#1a1a2e">🎬</div>`
            }
      <div class="item-gradient"></div>
      <div class="btn-check ${watchedClass}">✓</div>
      <div class="item-info">
        <div class="item-type">${item.year || ''} • ${u.shortName}</div>
        <div class="item-title">${escHtml(item.title)}</div>
        ${userRating > 0 ? `<div style="font-size:11px;color:#fbbf24;margin-top:2px">Senin Puanın: ${userRating}/10 ★</div>` : ''}
      </div>
    `;
        card.addEventListener('click', () => openModal(item, u));
        grid.appendChild(card);
    });
}

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

    // Donut Chart (Feature 5)
    const statsContainer = $('stats-mastery-container');
    let chartSection = document.getElementById('stats-donut-section');
    if (!chartSection) {
        chartSection = document.createElement('div');
        chartSection.id = 'stats-donut-section';
        chartSection.className = 'stats-chart-section';
        statsContainer.parentNode.insertBefore(chartSection, statsContainer);
    }

    const unwatched = totalAll - doneAll;
    const donutColors = { watched: 'var(--accent-blue)', movies: 'var(--accent-purple)', series: '#f59e0b', unwatched: 'rgba(255,255,255,0.08)' };
    const r = 52, cx = 64, cy = 64, circumference = 2 * Math.PI * r;
    const watchedPct = totalAll > 0 ? doneAll / totalAll : 0;
    const dashLen = watchedPct * circumference;

    // Monthly watch data from recent (last 12 months)
    const recent = getRecent ? getRecent() : [];
    const monthLabels = [];
    const monthCounts = [];
    const nowMs = Date.now();
    for (let m = 11; m >= 0; m--) {
        const d = new Date(); d.setMonth(d.getMonth() - m);
        monthLabels.push(d.toLocaleDateString('tr-TR', { month: 'short' }));
        monthCounts.push(0);
    }
    // Note: recent only has IDs not timestamps, so just distribute
    const maxBar = Math.max(...monthCounts, 1);
    const barItems = monthLabels.map((lbl, i) => `
        <div class="bar-item">
            <div class="bar-fill" style="height:${Math.max(4, (monthCounts[i] / maxBar) * 64)}px" title="${lbl}: ${monthCounts[i]} izleme"></div>
            <div class="bar-label">${lbl}</div>
        </div>`);

    chartSection.innerHTML = `
        <div class="donut-chart-wrap">
            <svg class="donut-svg" width="128" height="128" viewBox="0 0 128 128">
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"/>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                    stroke="var(--accent-blue)" stroke-width="16"
                    stroke-dasharray="${dashLen} ${circumference - dashLen}"
                    stroke-dashoffset="${circumference * 0.25}" stroke-linecap="round"
                    style="transition:stroke-dasharray 1s ease"/>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                    stroke="var(--accent-purple)" stroke-width="16"
                    stroke-dasharray="${(moviesWatched / Math.max(totalAll, 1)) * circumference} ${circumference}"
                    stroke-dashoffset="${circumference * 0.25 - dashLen}" stroke-linecap="round"
                    opacity="0.6"
                    style="transition:stroke-dasharray 1s ease"/>
                <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="white" font-size="18" font-weight="800">${Math.round(watchedPct * 100)}%</text>
                <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">İzlendi</text>
            </svg>
            <div class="donut-legend">
                <div class="donut-legend-item">
                    <div class="donut-legend-dot" style="background:var(--accent-blue)"></div>
                    <span class="donut-legend-label">İzlenen</span>
                    <span class="donut-legend-value">${doneAll}</span>
                </div>
                <div class="donut-legend-item">
                    <div class="donut-legend-dot" style="background:var(--accent-purple)"></div>
                    <span class="donut-legend-label">Film</span>
                    <span class="donut-legend-value">${moviesWatched}</span>
                </div>
                <div class="donut-legend-item">
                    <div class="donut-legend-dot" style="background:#f59e0b"></div>
                    <span class="donut-legend-label">Dizi</span>
                    <span class="donut-legend-value">${seriesWatched}</span>
                </div>
                <div class="donut-legend-item">
                    <div class="donut-legend-dot" style="background:rgba(255,255,255,0.12)"></div>
                    <span class="donut-legend-label">Kalan</span>
                    <span class="donut-legend-value">${unwatched}</span>
                </div>
            </div>
        </div>`;

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
                if (s.percent >= 100) title = '👑 Master';
                else if (s.percent >= 75) title = '⭐ Uzman';
                else if (s.percent >= 50) title = '🔷 Kıdemli';
                else if (s.percent >= 25) title = '🌱 Gezgin';
                card.innerHTML = `
                    <div class="mastery-icon">${u.icon}</div>
                    <div class="mastery-name">${u.shortName}</div>
                    <div class="mastery-title">${title}</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:2px">%${s.percent}</div>
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

    // Watch Calendar (Feature 3)
    renderWatchCalendar();
}

// ============================================
// WATCH CALENDAR (Özellik 3)
// ============================================
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-based

function renderWatchCalendar() {
    const statsView = $('view-stats');
    if (!statsView) return;

    let calSection = document.getElementById('watch-calendar-section');
    if (!calSection) {
        calSection = document.createElement('div');
        calSection.id = 'watch-calendar-section';
        calSection.className = 'calendar-section';
        statsView.appendChild(calSection);
    }

    // Build a map: "YYYY-MM-DD" -> [{title, type}]
    const dates = getWatchDates();
    const watchMap = {};
    UNIVERSES.forEach(u => {
        u.items.forEach(item => {
            if (dates[item.id]) {
                const d = new Date(dates[item.id]);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (!watchMap[key]) watchMap[key] = [];
                watchMap[key].push({ title: item.title, type: item.type });
            }
        });
    });

    const now = new Date();
    const yr = calendarYear;
    const mo = calendarMonth;
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayNames = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];

    const firstDay = new Date(yr, mo, 1);
    const lastDay = new Date(yr, mo + 1, 0);
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // make Mon=0

    // Count month watched
    const monthWatched = Object.keys(watchMap).filter(k => k.startsWith(`${yr}-${String(mo + 1).padStart(2, '0')}`)).reduce((sum, k) => sum + watchMap[k].length, 0);

    // Day cells
    let daysCells = '';
    // Empty cells before first day
    for (let i = 0; i < startDow; i++) {
        daysCells += `<div class="cal-day empty"></div>`;
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const key = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const items = watchMap[key] || [];
        const isToday = yr === now.getFullYear() && mo === now.getMonth() && d === now.getDate();
        const count = items.length;
        const tooltip = count > 0 ? items.map(i => i.title).join(', ') : '';
        daysCells += `
            <div class="cal-day ${count > 0 ? 'has-watch' : ''} ${isToday ? 'today' : ''}"
                 title="${escHtml(tooltip)}"
                 data-count="${count}">
                <span class="cal-day-num">${d}</span>
                ${count > 0 ? `<div class="cal-dot" style="background:${count > 1 ? 'var(--accent-purple)' : 'var(--accent-blue)'}"></div>` : ''}
            </div>`;
    }

    const canGoBack = !(yr <= 2020 && mo === 0);
    const canGoFwd = !(yr === now.getFullYear() && mo === now.getMonth());

    calSection.innerHTML = `
        <div class="cal-header">
            <span class="home-section-title">📅 İzleme Takvimi</span>
            <span class="cal-month-badge">${monthWatched > 0 ? `Bu ay: ${monthWatched} 🎬` : ''}</span>
        </div>
        <div class="cal-nav">
            <button class="cal-nav-btn" onclick="calNav(-1)" ${!canGoBack ? 'disabled' : ''}>‹</button>
            <span class="cal-month-label">${monthNames[mo]} ${yr}</span>
            <button class="cal-nav-btn" onclick="calNav(1)" ${!canGoFwd ? 'disabled' : ''}>›</button>
        </div>
        <div class="cal-day-headers">
            ${dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('')}
        </div>
        <div class="cal-grid">${daysCells}</div>
        ${monthWatched === 0 ? `<div class="cal-empty-msg">Bu ayda henüz film işaretlemedin 🎬</div>` : ''}
    `;
}

function calNav(dir) {
    calendarMonth += dir;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderWatchCalendar();
}

// ============================================
// FIREBASE UI
// ============================================
const AVATARS = ['🎬', '🎭', '🎥', '🍿', '⭐', '🚀', '🦸', '🧙', '🐉', '🌟',
    '🔮', '🎮', '🏆', '🦊', '🐺', '🦁', '🐯', '🌙', '🔥', '💫',
    '🎯', '👾', '🤖', '💎', '🌊'];

function setupFirebaseUI() {
    // Google sign-in button
    const btnGoogleSignin = $('btn-google-signin');
    if (btnGoogleSignin) {
        btnGoogleSignin.addEventListener('click', async () => {
            btnGoogleSignin.disabled = true;
            btnGoogleSignin.textContent = 'Bağlanıyor...';
            try {
                await signInWithGoogle();
            } catch (e) {
                btnGoogleSignin.disabled = false;
                btnGoogleSignin.innerHTML = `<svg width="20" height="20" viewBox="0 0 48 48">...</svg> Google ile Giriş Yap`;
                showToast('Giriş başarısız: ' + (e.message || 'Bilinmeyen hata'), 'error');
            }
        });
    }

    // Avatar grid for nickname modal
    const avatarGrid = $('avatar-grid');
    if (avatarGrid) {
        avatarGrid.innerHTML = AVATARS.map((em, i) =>
            `<div class="avatar-option ${i === 0 ? 'selected' : ''}" data-emoji="${em}" onclick="selectAvatar('${em}')">${em}</div>`
        ).join('');
    }

    // Photo input listener
    const photoInput = $('photo-upload-input');
    const preview = $('photo-upload-preview');
    if (photoInput && preview) {
        photoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                preview.textContent = "Seçili dosya: " + e.target.files[0].name;
            } else {
                preview.textContent = "";
            }
        });
    }

    // Nick input validation
    const nickInput = $('nick-input');
    const saveBtn = $('btn-save-profile');
    if (nickInput && saveBtn) {
        let nickTimer;
        nickInput.addEventListener('input', () => {
            clearTimeout(nickTimer);
            const val = nickInput.value.trim();
            const status = $('nick-status');
            if (val.length < 3) { status.textContent = ''; saveBtn.disabled = true; return; }
            if (!/^[a-zA-Z0-9_]+$/.test(val)) {
                status.textContent = '❌ Sadece harf, rakam ve _';
                status.className = 'nick-status error';
                saveBtn.disabled = true; return;
            }
            status.textContent = '⏳ Kontrol ediliyor...';
            status.className = 'nick-status';
            nickTimer = setTimeout(async () => {
                const taken = await isNickTaken(val);
                if (taken) {
                    status.textContent = '❌ Bu kullanıcı adı alınmış';
                    status.className = 'nick-status error';
                    saveBtn.disabled = true;
                } else {
                    status.textContent = '✅ Kullanıcı adı uygun!';
                    status.className = 'nick-status ok';
                    saveBtn.disabled = false;
                }
            }, 700);
        });

        saveBtn.addEventListener('click', async () => {
            if (!currentUser) return;
            const nick = nickInput.value.trim().toLowerCase();
            const avatar = $('selected-avatar').textContent;
            const photoInput = $('photo-upload-input');
            const selectedFile = photoInput && photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Kaydediliyor...';
            try {
                let photoURL = '';
                if (selectedFile) {
                    saveBtn.textContent = 'Görsel Yükleniyor...';
                    photoURL = await uploadProfilePhoto(currentUser.uid, selectedFile);
                }

                saveBtn.textContent = 'Veriler Kaydediliyor...';
                // Determine updates to push
                const updates = { nick, avatar };
                if (photoURL !== '') {
                    updates.photoURL = photoURL;
                } else if (currentUser.photoURL) {
                    // Fallback to Google photo if custom is empty and Google exists
                    updates.photoURL = currentUser.photoURL;
                } else {
                    updates.photoURL = '';
                }

                await updateUserProfile(currentUser.uid, updates);
                localStorage.setItem('vw_user_nick', nick);
                localStorage.setItem('vw_user_avatar', avatar);
                localStorage.setItem('vw_user_photo', updates.photoURL);

                await syncLocalToFirestore(currentUser.uid);
                $('nickname-modal').style.display = 'none';
                showToast(`Hoş geldin, ${nick}! 🎉`, 'success');
                // Create a mock profile object to render immediately
                const updatedProfile = { nick, avatar, photoURL: updates.photoURL };
                renderProfileViewFirebase(updatedProfile);
            } catch (e) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Kaydet & Başla 🚀';
                showToast('Hata: ' + e.message, 'error');
            }
        });
    }

    // Edit Profile Logic
    const editBtn = $('btn-edit-profile');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            showNicknameModal(true);
        });
    }

    const cancelBtn = $('btn-cancel-profile');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            $('nickname-modal').style.display = 'none';
        });
    }
}

function selectAvatar(emoji) {
    $('selected-avatar').textContent = emoji;
    $$('.avatar-option').forEach(el => el.classList.toggle('selected', el.dataset.emoji === emoji));
}

function showNicknameModal(isEditing = false) {
    const modal = $('nickname-modal');
    if (modal) {
        modal.style.display = 'flex';
        const cancelBtn = $('btn-cancel-profile');
        if (cancelBtn) {
            cancelBtn.style.display = isEditing ? 'block' : 'none';
        }
        const photoInput = $('photo-upload-input');
        const preview = $('photo-upload-preview');

        if (isEditing) {
            const nickInput = $('nick-input');
            if (nickInput) nickInput.value = localStorage.getItem('vw_user_nick') || '';
            if (photoInput) photoInput.value = '';
            if (preview) preview.textContent = '';
            selectAvatar(localStorage.getItem('vw_user_avatar') || '🎬');
            $('btn-save-profile').disabled = false;
        } else {
            if (photoInput) photoInput.value = '';
            if (preview) preview.textContent = '';
        }
    }
}

// ============================================
// PROFILE VIEW — FIREBASE ENHANCED
// ============================================
function renderProfileViewFirebase(profile) {
    if (!profile) return;
    // Update profile elements if profile view is active
    const nickEl = document.getElementById('profile-firebase-nick');
    const avatarEl = document.getElementById('profile-firebase-avatar');
    if (nickEl) nickEl.textContent = profile.nick || profile.displayName || 'Kullanıcı';
    if (avatarEl) {
        if (profile.photoURL && profile.photoURL.trim() !== '') {
            avatarEl.innerHTML = `<img src="${profile.photoURL}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            avatarEl.textContent = profile.avatar || '🎬';
        }
    }
}

async function renderFriendsTab() {
    const container = document.getElementById('friends-tab-content');
    if (!container) return;
    if (!currentUser) {
        container.innerHTML = '<div class="friends-empty">Giriş yapman gerekiyor 🔐</div>';
        return;
    }
    container.innerHTML = '<div class="friends-loading">Yükleniyor...</div>';

    const [friends, pending] = await Promise.all([
        getFriends(currentUser.uid),
        getPendingRequests(currentUser.uid)
    ]);

    let html = '';

    // Pending requests
    if (pending.length > 0) {
        html += `<div class="friends-section-title">📨 Bekleyen İstekler (${pending.length})</div>`;
        pending.forEach(p => {
            html += `<div class="friend-card pending">
                <div class="friend-card-avatar">${p.avatar || '🎬'}</div>
                <div class="friend-card-info">
                    <div class="friend-card-nick">${escHtml(p.nick || p.displayName || 'Kullanıcı')}</div>
                    <div class="friend-card-meta">Arkadaşlık isteği gönderdi</div>
                </div>
                <button class="btn-accept-friend" onclick="acceptFriendReq('${p.uid}')">✓ Kabul</button>
            </div>`;
        });
    }

    // Friends list
    if (friends.length > 0) {
        html += `<div class="friends-section-title">👥 Arkadaşlarım (${friends.length})</div>`;
        friends.forEach(f => {
            const lastAct = f.lastActivity;
            const actText = lastAct
                ? `${lastAct.action === 'watched' ? '🎬 İzledi:' : '⭐ Puanladı:'} ${lastAct.title}`
                : 'Henüz aktivite yok';
            html += `<div class="friend-card" onclick="openFriendModal('${f.uid}')">
                <div class="friend-card-avatar">${f.avatar || '🎬'}</div>
                <div class="friend-card-info">
                    <div class="friend-card-nick">${escHtml(f.nick || f.displayName || 'Kullanıcı')}</div>
                    <div class="friend-card-meta">${escHtml(actText)}</div>
                </div>
                <div class="friend-card-count">${f.totalWatched || 0} 🎬</div>
            </div>`;
        });
    }

    // Search area
    html += `
        <div class="friends-section-title">🔍 Arkadaş Ekle</div>
        <div class="friend-search-wrap">
            <input id="friend-search-input" class="nick-input" placeholder="Kullanıcı adıyla ara..." type="text">
            <button class="btn-suggest-pill" onclick="searchFriendByNick()" style="padding:10px 14px;font-size:13px">Ara</button>
        </div>
        <div id="friend-search-results"></div>
    `;

    if (friends.length === 0 && pending.length === 0) {
        html = `<div class="friends-empty">
            Henüz arkadaşın yok! Yukarıdan arkadaş ekle 👆
        </div>` + html;
    }

    container.innerHTML = html;
}

async function searchFriendByNick() {
    const input = $('friend-search-input');
    const resultsEl = $('friend-search-results');
    if (!input || !resultsEl) return;
    const nick = input.value.trim().toLowerCase();
    if (nick.length < 2) { showToast('En az 2 karakter gir', 'info'); return; }

    resultsEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">Aranıyor...</div>';
    const users = await searchUserByNick(nick);
    if (users.length === 0) {
        resultsEl.innerHTML = '<div class="friends-empty">Kullanıcı bulunamadı 😕</div>'; return;
    }

    resultsEl.innerHTML = users.map(u => {
        const isMe = currentUser && u.uid === currentUser.uid;
        return `<div class="friend-card">
            <div class="friend-card-avatar">${u.avatar || '🎬'}</div>
            <div class="friend-card-info">
                <div class="friend-card-nick">${escHtml(u.nick || u.displayName)}</div>
                <div class="friend-card-meta">${u.totalWatched || 0} film izlendi</div>
            </div>
            ${isMe ? '<span style="font-size:11px;color:var(--text-muted)">Sen</span>'
                : `<button class="btn-suggest-pill" style="padding:8px 12px;font-size:12px" onclick="sendFriendReq('${u.uid}','this')">+ Ekle</button>`}
        </div>`;
    }).join('');
}

async function sendFriendReq(toUid) {
    if (!currentUser) return;
    try {
        await sendFriendRequest(currentUser.uid, toUid);
        showToast('Arkadaşlık isteği gönderildi! 📨', 'success');
        renderFriendsTab();
    } catch (e) { showToast('Hata: ' + e.message, 'error'); }
}

async function acceptFriendReq(fromUid) {
    if (!currentUser) return;
    try {
        await acceptFriendRequest(currentUser.uid, fromUid);
        showToast('Arkadaşlık kabul edildi! 🎉', 'success');
        renderFriendsTab();
    } catch (e) { showToast('Hata: ' + e.message, 'error'); }
}

async function openFriendModal(uid) {
    const modal = $('friend-modal');
    const content = $('friend-modal-content');
    if (!modal || !content) return;
    modal.style.display = 'flex';
    content.innerHTML = '<div class="friends-loading">Yükleniyor...</div>';

    const [profile, watchData] = await Promise.all([
        getUserProfile(uid),
        getFriendWatchData(uid)
    ]);

    if (!profile) { content.innerHTML = '<div class="friends-empty">Profil bulunamadı</div>'; return; }

    // Find movie titles from watch data
    const allItems = UNIVERSES.flatMap(u => u.items);
    const watchedTitles = Object.entries(watchData).slice(0, 6).map(([id]) => {
        const item = allItems.find(i => i.id === id);
        return item ? item.title : null;
    }).filter(Boolean);

    content.innerHTML = `
        <div style="text-align:center;padding:20px 0">
            <div style="font-size:52px;margin-bottom:8px">${profile.avatar || '🎬'}</div>
            <div style="font-size:20px;font-weight:800">${escHtml(profile.nick || profile.displayName || 'Kullanıcı')}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${profile.totalWatched || 0} film/dizi izlendi</div>
        </div>
        ${watchedTitles.length > 0 ? `
            <div class="friends-section-title">🎬 Son İzledikleri</div>
            <div style="display:flex;flex-direction:column;gap:6px;padding:0 4px">
                ${watchedTitles.map(t => `<div style="font-size:13px;color:var(--text-secondary);padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px">${escHtml(t)}</div>`).join('')}
            </div>
        ` : '<div class="friends-empty">Henüz film izlememiş</div>'}
    `;
}

function closeFriendModal() {
    const modal = $('friend-modal');
    if (modal) modal.style.display = 'none';
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
