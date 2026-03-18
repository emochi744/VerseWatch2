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
let lastFocusedEl = null; // For restoring focus after modal close
let currentView = 'home'; // home | stats | settings | profile | popular
let posterCache = {}; // { itemId: tmdbData }
let currentUniverseRef = null; // universe reference for color
let currentUser = null; // Firebase user
let currentUserProfile = null; // Firestore profile data

const I18N = {
    tr: {
        nav_home: 'Portal', nav_popular: 'Popüler', nav_stats: 'İstatistik', nav_settings: 'Ayarlar', nav_profile: 'Profil',
        stats_title: 'İstatistikler', stats_mastery: 'Evren Ustalığı',
        settings_title: 'Ayarlar', settings_lang: 'Dil', settings_lang_sub: 'Uygulama dilini değiştirin',
        settings_theme: 'Tema Rengi', settings_theme_sub: 'Uygulama ana rengini özelleştirin',
        settings_cache: 'Önbelleği Temizle', settings_cache_sub: 'Sorun oluşursa yerel verileri sıfırlayın',
        settings_clear: 'Sıfırla', settings_made_with: 'Film Severler İçin Premium Deneyim',
        stats_total: 'Toplam', stats_watched: 'İzlendi', stats_movie: 'Film', stats_series: 'Dizi', stats_unwatched: 'Kalan',
        recent_title: '🕒 Son İzlediklerin',
        watchlist_title: '🔖 İzleme Listem',
        universes_title: '🌌 Evrenler',
        upcoming_title: '⏳ Yakında Vizyonda',
        popular_title: '🔥 Popüler & Trendler',
        profile_tab_feed: '✨ Akış',
        profile_tab_friends: '👥 Arkadaşlar',
        profile_tab_watched: '🎬 Arşiv',
        section_content: 'İçerik',
        section_watched: 'İzlendi',
        section_completed: 'Tamamlandı',
        level_progress: 'İlerleme',
        rank_prefix: 'Seviye',
        filter_all: 'Tümü',
        filter_unwatched: 'İzlenmedi',
        filter_watched: 'İzlendi',
        filter_movie: '🎬 Film',
        filter_series: '📺 Dizi',
        sort_default: 'Varsayılan',
        sort_name: 'İsim',
        sort_year: 'Yıl',
        sort_rating: '⭐ Puan',
        btn_watch: 'İzledim',
        btn_unwatch: 'İzlenmedi',
        btn_watchlist_add: 'Listeme Ekle',
        btn_watchlist_remove: 'Listemde',
        btn_favorite_add: 'Favorilere Ekle',
        btn_close: 'Kapat',
        modal_your_rating: 'Senin Puanın',
        modal_your_notes: 'Notlarım',
        empty_no_content: 'İçerik bulunamadı',
        empty_no_filter: 'Seçili filtreyle eşleşen içerik yok.',
        profile_edit: '✏️ Profili Düzenle',
        profile_logout: '🚪 Çıkış',
        profile_empty: 'Henüz hiçbir şey izlemedin.',
        toast_offline: 'Çevrimdışı mod: Sosyal özellikler için http://localhost üzerinden aç 🌐',
        toast_all_watched: 'İzlenecek hiçbir şey kalmadı, efsanesin!',
        toast_fav_add: 'Favorilere eklendi ⭐',
        toast_fav_remove: 'Favorilerden kaldırıldı 💔',
        genre_modal_title: '🎲 Ne İzlesem?',
        genre_modal_sub: 'Bir mood seç, senin için önerelim!',
        btn_find_movie: '🎬 Film Bul',
        btn_random_pick: 'Rastgele İzlet',
        universe_progress_watched: 'izlendi'
    },
    en: {
        nav_home: 'Portal', nav_popular: 'Trending', nav_stats: 'Stats', nav_settings: 'Settings', nav_profile: 'Profile',
        stats_title: 'Statistics', stats_mastery: 'Universe Mastery',
        settings_title: 'Settings', settings_lang: 'Language', settings_lang_sub: 'Change application language',
        settings_theme: 'Theme Color', settings_theme_sub: 'Customize the primary accent color',
        settings_cache: 'Clear Cache', settings_cache_sub: 'Reset local data if issues occur',
        settings_clear: 'Reset', settings_made_with: 'Premium Experience for Movie Fans',
        stats_total: 'Total', stats_watched: 'Watched', stats_movie: 'Movies', stats_series: 'Series', stats_unwatched: 'Remaining',
        recent_title: '🕒 Recently Watched',
        watchlist_title: '🔖 My Watchlist',
        universes_title: '🌌 Universes',
        upcoming_title: '⏳ Coming Soon',
        popular_title: '🔥 Popular & Trending',
        profile_tab_feed: '✨ Feed',
        profile_tab_friends: '👥 Friends',
        profile_tab_watched: '🎬 Archive',
        section_content: 'Content',
        section_watched: 'Watched',
        section_completed: 'Completed',
        level_progress: 'Progress',
        rank_prefix: 'Level',
        filter_all: 'All',
        filter_unwatched: 'Unwatched',
        filter_watched: 'Watched',
        filter_movie: '🎬 Movie',
        filter_series: '📺 Series',
        sort_default: 'Default',
        sort_name: 'Name',
        sort_year: 'Year',
        sort_rating: '⭐ Rating',
        btn_watch: 'Mark Watched',
        btn_unwatch: 'Unwatched',
        btn_watchlist_add: 'Add to List',
        btn_watchlist_remove: 'In List',
        btn_favorite_add: 'Add to Favorites',
        btn_close: 'Close',
        modal_your_rating: 'Your Rating',
        modal_your_notes: 'My Notes',
        empty_no_content: 'No content found',
        empty_no_filter: 'No content matches the selected filter.',
        profile_edit: '✏️ Edit Profile',
        profile_logout: '🚪 Logout',
        profile_empty: 'You haven\'t watched anything yet.',
        toast_offline: 'Offline mode: Open via http://localhost for social features 🌐',
        toast_all_watched: 'Nothing left to watch, you\'re a legend!',
        toast_fav_add: 'Added to favorites ⭐',
        toast_fav_remove: 'Removed from favorites 💔',
        genre_modal_title: '🎲 What to Watch?',
        genre_modal_sub: 'Select a mood and we\'ll suggest something!',
        btn_find_movie: '🎬 Find Movie',
        btn_random_pick: 'Random Pick',
        universe_progress_watched: 'watched'
    }
};

let currentLang = localStorage.getItem('vw_lang') || 'tr';

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

// ============================================
// NEW FUNCTIONAL FEATURES
// ============================================

// FAVORITES SYSTEM
const getFavorites = () => { try { return JSON.parse(localStorage.getItem('versewatch_favorites')) || []; } catch (e) { return []; } };
const isFavorite = (itemId) => getFavorites().includes(itemId);
const toggleFavorite = (itemId) => {
    let favs = getFavorites();
    const idx = favs.indexOf(itemId);
    if (idx > -1) {
        favs.splice(idx, 1);
        showToast('Favorilerden kaldırıldı 💔', 'info');
        return false;
    } else {
        favs.push(itemId);
        showToast('Favorilere eklendi ⭐', 'success');
        return true;
    }
};
const saveFavorites = (favs) => localStorage.setItem('versewatch_favorites', JSON.stringify(favs));

// ACHIEVEMENTS/BADGES SYSTEM
const ACHIEVEMENTS = [
    { id: 'first_watch', name: 'İlk İzleme', desc: 'İlk içeriği izledin', icon: '🎬', condition: (stats) => stats.totalWatched >= 1 },
    { id: 'ten_watched', name: 'Onlu Çıkış', desc: '10 içerik izledin', icon: '🔟', condition: (stats) => stats.totalWatched >= 10 },
    { id: 'fifty_watched', name: 'Yarım Yüz', desc: '50 içerik izledin', icon: '🏆', condition: (stats) => stats.totalWatched >= 50 },
    { id: 'hundred_watched', name: 'Yüzük Taşıyıcı', desc: '100 içerik izledin', icon: '💍', condition: (stats) => stats.totalWatched >= 100 },
    { id: 'marathon', name: 'Maratoncu', desc: 'Bir günde 5 içerik izle', icon: '🔥', condition: (stats) => checkMarathon() },
    { id: 'night_owl', name: 'Gece Kuşu', desc: 'Gece yarısından sonra izle', icon: '🦉', condition: () => checkNightOwl() },
    { id: 'completionist', name: 'Tamamlayıcı', desc: 'Bir evreni %100 tamamla', icon: '✨', condition: (stats) => stats.completedUniverses > 0 },
    { id: 'movie_buff', name: 'Film Buffı', desc: 'Sadece film izle (20+)', icon: '🎞️', condition: (stats) => stats.moviesOnly >= 20 },
    { id: 'binge_watcher', name: 'Binge Watcher', desc: 'Sadece dizi izle (10+)', icon: '📺', condition: (stats) => stats.seriesOnly >= 10 },
    { id: 'rater', name: 'Eleştirmen', desc: '10 içeriğe puan ver', icon: '⭐', condition: (stats) => stats.ratedCount >= 10 },
    { id: 'social', name: 'Sosyal Kelebek', desc: 'Bir arkadaş ekle', icon: '🦋', condition: () => hasFriends() },
    { id: 'collector', name: 'Koleksiyoncu', desc: '50 favori ekle', icon: '❤️', condition: (stats) => stats.favorites >= 50 }
];

function checkMarathon() {
    const dates = getWatchDates();
    const today = new Date().toDateString();
    const todayCount = Object.values(dates).filter(d => new Date(d).toDateString() === today).length;
    return todayCount >= 5;
}

function checkNightOwl() {
    const dates = getWatchDates();
    return Object.values(dates).some(d => {
        const hour = new Date(d).getHours();
        return hour < 6;
    });
}

function hasFriends() {
    const friends = localStorage.getItem('vw_friends');
    return friends && JSON.parse(friends).length > 0;
}

function getAchievementStats() {
    const watched = getWatched();
    const ratings = getRatings();
    const favorites = getFavorites();
    const dates = getWatchDates();
    
    let moviesOnly = 0, seriesOnly = 0, completedUniverses = 0;
    
    UNIVERSES.forEach(u => {
        const stats = getUniverseStats(u);
        if (stats.percent === 100) completedUniverses++;
        u.items.forEach(item => {
            if (watched[item.id]) {
                if (item.type === 'movie') moviesOnly++;
                else seriesOnly++;
            }
        });
    });
    
    return {
        totalWatched: Object.keys(watched).length,
        ratedCount: Object.keys(ratings).length,
        favorites: favorites.length,
        moviesOnly,
        seriesOnly,
        completedUniverses,
        dates
    };
}

function checkAchievements() {
    const stats = getAchievementStats();
    const unlocked = JSON.parse(localStorage.getItem('versewatch_achievements') || '[]');
    let newUnlock = false;
    
    ACHIEVEMENTS.forEach(ach => {
        if (!unlocked.includes(ach.id) && ach.condition(stats)) {
            unlocked.push(ach.id);
            newUnlock = true;
            showToast(`Rozet kazandın: ${ach.name} ${ach.icon}`, 'success');
            triggerConfetti();
        }
    });
    
    if (newUnlock) {
        localStorage.setItem('versewatch_achievements', JSON.stringify(unlocked));
    }
    return unlocked;
}

function getUnlockedAchievements() {
    return JSON.parse(localStorage.getItem('versewatch_achievements') || '[]');
}

// QUICK NOTES SYSTEM
const getQuickNotes = () => { try { return JSON.parse(localStorage.getItem('versewatch_quicknotes')) || {}; } catch (e) { return {}; } };
const saveQuickNote = (itemId, note) => {
    const notes = getQuickNotes();
    if (!note.trim()) delete notes[itemId];
    else notes[itemId] = { text: note, date: Date.now() };
    localStorage.setItem('versewatch_quicknotes', JSON.stringify(notes));
};
const getQuickNote = (itemId) => getQuickNotes()[itemId];

// DATA EXPORT/IMPORT
function exportData() {
    const data = {
        watched: getWatched(),
        ratings: getRatings(),
        comments: getComments(),
        watchlist: getWatchlist(),
        favorites: getFavorites(),
        achievements: getUnlockedAchievements(),
        quickNotes: getQuickNotes(),
        episodes: getEpisodes(),
        watchDates: getWatchDates(),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `versewatch-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Veriler dışa aktarıldı 📥', 'success');
}

function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.watched) localStorage.setItem('versewatch_watched', JSON.stringify(data.watched));
                if (data.ratings) localStorage.setItem('versewatch_ratings', JSON.stringify(data.ratings));
                if (data.comments) localStorage.setItem('versewatch_comments', JSON.stringify(data.comments));
                if (data.watchlist) localStorage.setItem('versewatch_watchlist', JSON.stringify(data.watchlist));
                if (data.favorites) localStorage.setItem('versewatch_favorites', JSON.stringify(data.favorites));
                if (data.achievements) localStorage.setItem('versewatch_achievements', JSON.stringify(data.achievements));
                if (data.quickNotes) localStorage.setItem('versewatch_quicknotes', JSON.stringify(data.quickNotes));
                if (data.episodes) localStorage.setItem('versewatch_episodes', JSON.stringify(data.episodes));
                if (data.watchDates) localStorage.setItem('versewatch_watch_dates', JSON.stringify(data.watchDates));
                
                showToast('Veriler içe aktarıldı 📤', 'success');
                resolve(true);
            } catch (err) {
                showToast('Dosya okunamadı: ' + err.message, 'error');
                reject(err);
            }
        };
        reader.readAsText(file);
    });
}

// WATCH HISTORY
function addToWatchHistory(item, action = 'watched') {
    const history = JSON.parse(localStorage.getItem('versewatch_history') || '[]');
    const entry = {
        id: item.id,
        title: item.title,
        type: item.type,
        posterUrl: posterCache[item.id]?.posterUrl || null,
        action,
        timestamp: Date.now()
    };
    history.unshift(entry);
    if (history.length > 50) history.pop(); // Keep last 50
    localStorage.setItem('versewatch_history', JSON.stringify(history));
}

function getWatchHistory() {
    return JSON.parse(localStorage.getItem('versewatch_history') || '[]');
}

function clearWatchHistory() {
    localStorage.removeItem('versewatch_history');
    showToast('İzleme geçmişi temizlendi 🗑️', 'info');
}

// STREAK TRACKER
function getStreak() {
    const streak = JSON.parse(localStorage.getItem('versewatch_streak') || '{"count":0,"lastDate":null}');
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (streak.lastDate === today) return streak.count;
    if (streak.lastDate === yesterday) {
        // Continue streak
        streak.count++;
        streak.lastDate = today;
        localStorage.setItem('versewatch_streak', JSON.stringify(streak));
        if (streak.count > 1) showToast(`${streak.count} günlük seri! 🔥`, 'success');
        return streak.count;
    }
    // Reset streak
    streak.count = 1;
    streak.lastDate = today;
    localStorage.setItem('versewatch_streak', JSON.stringify(streak));
    return 1;
}

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
    { min: 0, name: { tr: 'Film Meraklısı', en: 'Movie Enthusiast' }, level: 1 },
    { min: 10, name: { tr: 'Sıkı İzleyici', en: 'Regular Watcher' }, level: 2 },
    { min: 30, name: { tr: 'Sinefil Adayı', en: 'Cinephile Candidate' }, level: 3 },
    { min: 60, name: { tr: 'Gerçek Sinefil', en: 'True Cinephile' }, level: 4 },
    { min: 100, name: { tr: 'Koleksiyoncu', en: 'Collector' }, level: 5 },
    { min: 200, name: { tr: 'Film Gurusu', en: 'Movie Guru' }, level: 6 },
    { min: 350, name: { tr: 'Sinema Üstadı', en: 'Cinema Master' }, level: 7 },
    { min: 500, name: { tr: 'Efsanevi İzleyici', en: 'Legendary Viewer' }, level: 8 }
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

function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('vw_lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (I18N[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = I18N[lang][key];
            } else {
                el.textContent = I18N[lang][key];
            }
        }
    });
    // Global placeholder update
    const searchInput = $('search-input');
    if (searchInput) {
        searchInput.placeholder = lang === 'tr' ? 'Film veya dizi ara...' : 'Search movies or series...';
    }
    // Re-render active view to apply translations
    showView(currentView);
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

    const rankEl = $('user-rank');
    const levelEl = $('user-level-num');
    if (!rankEl || !levelEl) return;

    rankEl.textContent = I18N[currentLang][currentRank.name[currentLang]] || currentRank.name['tr'];
    levelEl.textContent = (currentLang === 'tr' ? 'Seviye ' : 'Level ') + currentRank.level;

    if (nextRank) {
        const xpInLevel = totalWatched - currentRank.min;
        const totalNeeded = nextRank.min - currentRank.min;
        const pct = Math.min(Math.round((xpInLevel / totalNeeded) * 100), 100);

        $('level-progress-fill').style.width = pct + '%';
        $('level-xp-text').textContent = `${totalWatched} / ${nextRank.min} ${currentLang === 'tr' ? 'İzleme' : 'Watched'}`;
        $('level-percent').textContent = `%${pct}`;
    } else {
        $('level-progress-fill').style.width = '100%';
        $('level-xp-text').textContent = `${totalWatched} ${currentLang === 'tr' ? 'İzleme' : 'Watched'} (MAX)`;
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

// ============================================
// Global helpers (used across the whole app)
// ============================================
// Some later refactors mistakenly scoped these helpers inside other functions.
// Keeping them global prevents runtime ReferenceError.
const TOAST_DURATION_MS = 2800;
let vwToastQueue = [];
let vwToastActive = false;
let vwToastTimer = null;
function showToast(msg, type = 'info') {
    // Queue messages to avoid overlapping UI states.
    vwToastQueue.push({ msg, type });
    if (vwToastQueue.length > 6) vwToastQueue.shift();

    const flush = () => {
        if (vwToastActive) return;
        const next = vwToastQueue.shift();
        if (!next) return;

        const toastEl = document.getElementById('toast');
        if (!toastEl) {
            console.log('[Toast]', next.type, next.msg);
            vwToastActive = false;
            flush();
            return;
        }

        vwToastActive = true;
        toastEl.textContent = next.msg;
        toastEl.className = `toast ${next.type}`;
        toastEl.classList.add('show');
        clearTimeout(vwToastTimer);

        vwToastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
            vwToastActive = false;
            flush();
        }, TOAST_DURATION_MS);
    };

    flush();
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Allow scoped components to delegate to the global toast manager.
if (typeof window !== 'undefined') {
    window.__vwShowToast = showToast;
}

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

function initAuth() {
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
                currentUserProfile = profile;
                if (profile && (profile.isNew || !profile.nick || profile.nick.trim() === '')) {
                    // Force user to set nickname if missing
                    showNicknameModal(false);
                } else if (profile) {
                    localStorage.setItem('vw_user_nick', profile.nick || '');
                    localStorage.setItem('vw_user_avatar', profile.avatar || '🎬');
                    localStorage.setItem('vw_user_photo', profile.photoURL || '');
                    // Sync local watched to Firestore
                    syncLocalToFirestore(user.uid).catch(e => console.warn('[Firebase] Sync error:', e));

                    // IF we are currently ON the profile view, re-render it
                    if (currentView === 'profile') {
                        renderProfileView();
                    } else {
                        renderProfileViewFirebase(profile);
                    }
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
}



// ============================================
// NAVIGATION - Updated with new views
// ============================================
function showView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    const target = $('view-' + viewName);
    if (target) target.classList.add('active');

    // Handle special render logic per view
    if (viewName === 'home') renderHomeView();
    else if (viewName === 'stats') renderStatsView();
    else if (viewName === 'profile') renderProfileView();
    else if (viewName === 'popular') renderPopularView();
    else if (viewName === 'feed') renderFeedView();
    else if (viewName === 'friends') renderFriendsView();
    else if (viewName === 'watched') renderWatchedView();
    else if (viewName === 'favorites') renderFavoritesView();
    else if (viewName === 'achievements') renderAchievementsView();
    else if (viewName === 'history') renderHistoryView();

    // Scroll top on view change
    window.scrollTo(0, 0);
    updateActiveNavItem(viewName);
}

// Helper functions for profile menu navigation
function toggleProfileSection(sectionName) {
    const section = $('profile-section-' + sectionName);
    if (!section) return;
    
    // Close all other sections first
    document.querySelectorAll('.profile-section').forEach(s => {
        if (s !== section) s.style.display = 'none';
    });
    
    // Toggle current section
    const isVisible = section.style.display === 'block';
    section.style.display = isVisible ? 'none' : 'block';
    
    // Render content if opening
    if (!isVisible) {
        if (sectionName === 'friends') renderProfileFriends();
        else if (sectionName === 'watched') renderProfileWatched();
        else if (sectionName === 'favorites') renderProfileFavorites();
        else if (sectionName === 'achievements') renderProfileAchievements();
        else if (sectionName === 'history') renderProfileHistory();
        
        // Scroll to section
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function renderProfileFriends() {
    const container = $('profile-friends-list');
    if (!container) return;
    const friends = JSON.parse(localStorage.getItem('vw_friends') || '[]');
    if (friends.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-tertiary);">Henüz arkadaşın yok</div>';
        return;
    }
    container.innerHTML = friends.map(f => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-card);border-radius:12px;margin-bottom:8px;">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-size:20px;">${f.avatar || '👤'}</div>
            <div style="flex:1;">
                <div style="font-weight:700;">${f.nick || 'Kullanıcı'}</div>
                <div style="font-size:12px;color:var(--text-tertiary);">${f.online ? '🟢 Çevrimiçi' : '⚪ Çevrimdışı'}</div>
            </div>
        </div>
    `).join('');
}

function renderProfileWatched() {
    const container = $('profile-watched-list');
    if (!container) return;
    const watchedMap = getWatched();
    const watchedItems = [];
    UNIVERSES.forEach(u => {
        u.items.forEach(item => {
            if (watchedMap[item.id]) watchedItems.push(item);
        });
    });
    if (watchedItems.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-tertiary);">Henüz hiçbir şey izlemedin</div>';
        return;
    }
    container.innerHTML = '';
    watchedItems.forEach(item => {
        const card = createMovieCard(item);
        container.appendChild(card);
    });
}

function renderProfileFavorites() {
    const container = $('profile-favorites-list');
    if (!container) return;
    const favIds = getFavorites();
    const favItems = [];
    UNIVERSES.forEach(u => {
        u.items.forEach(item => {
            if (favIds.includes(item.id)) favItems.push(item);
        });
    });
    if (favItems.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-tertiary);">Henüz favori yok</div>';
        return;
    }
    container.innerHTML = '';
    favItems.forEach(item => {
        const card = createMovieCard(item);
        container.appendChild(card);
    });
}

function renderProfileAchievements() {
    const container = $('profile-achievements-list');
    if (!container) return;
    const unlocked = getUnlockedAchievements ? getUnlockedAchievements() : [];
    if (typeof ACHIEVEMENTS === 'undefined') {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-tertiary);">Rozetler yüklenemedi</div>';
        return;
    }
    container.innerHTML = ACHIEVEMENTS.map(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        return `
            <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--bg-card);border-radius:12px;margin-bottom:8px;opacity:${isUnlocked ? 1 : 0.5};">
                <div style="width:44px;height:44px;border-radius:12px;background:${isUnlocked ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))' : 'var(--bg-secondary)'};display:flex;align-items:center;justify-content:center;font-size:22px;">${ach.icon}</div>
                <div style="flex:1;">
                    <div style="font-weight:700;">${ach.name}</div>
                    <div style="font-size:12px;color:var(--text-tertiary);">${ach.desc}</div>
                </div>
                ${isUnlocked ? '<span style="color:#10b981;font-size:12px;">✓ Kazanıldı</span>' : ''}
            </div>
        `;
    }).join('');
}

function renderProfileHistory() {
    const container = $('profile-history-list');
    if (!container) return;
    const history = getWatchHistory ? getWatchHistory() : [];
    if (history.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-tertiary);">Henüz izleme geçmişi yok</div>';
        return;
    }
    container.innerHTML = history.slice(0, 20).map(h => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-card);border-radius:12px;margin-bottom:8px;">
            <div style="width:40px;height:60px;background:var(--bg-secondary);border-radius:8px;"></div>
            <div style="flex:1;">
                <div style="font-weight:700;">${h.title || 'Bilinmiyor'}</div>
                <div style="font-size:12px;color:var(--text-tertiary);">${new Date(h.timestamp).toLocaleDateString('tr-TR')}</div>
            </div>
        </div>
    `).join('');
}

function showFriendsView() { showView('friends'); }
function showWatchedView() { showView('watched'); }
function showFavoritesView() { showView('favorites'); }
function showAchievementsView() { showView('achievements'); }
function showHistoryView() { showView('history'); }

function updateActiveNavItem(viewName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        }
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            showView(view);
        });
    });
}
window.hideUniverseDetail = hideUniverseDetail;
window.showView = showView;
window.hideUniverseDetail = hideUniverseDetail;

function renderProfileView() {
    // Get profile data
    const profile = currentUserProfile || {
        nick: localStorage.getItem('vw_user_nick') || 'Kullanıcı',
        avatar: localStorage.getItem('vw_user_avatar') || '🎬'
    };
    
    // Update profile UI
    const avatarEl = $('profile-firebase-avatar');
    const nickEl = $('profile-firebase-nick');
    const rankEl = $('profile-rank');
    
    if (avatarEl) avatarEl.textContent = profile.avatar;
    if (nickEl) nickEl.textContent = profile.nick;
    
    // Calculate stats
    let totalWatched = 0;
    const watchedMap = getWatched();
    UNIVERSES.forEach(u => {
        const stats = getUniverseStats(u);
        totalWatched += stats.done;
    });
    
    const favorites = getFavorites();
    const friends = JSON.parse(localStorage.getItem('vw_friends') || '[]');
    
    // Update stats display
    const watchedStat = $('profile-stat-watched');
    const favStat = $('profile-stat-favorites');
    const friendStat = $('profile-stat-friends');
    
    if (watchedStat) watchedStat.textContent = totalWatched;
    if (favStat) favStat.textContent = favorites.length;
    if (friendStat) friendStat.textContent = friends.length;
    
    // Get current rank
    let currentRank = RANKS[0];
    for (let i = 0; i < RANKS.length; i++) {
        if (totalWatched >= RANKS[i].min) {
            currentRank = RANKS[i];
        }
    }
    if (rankEl) rankEl.textContent = currentRank.name[currentLang] || currentRank.name['tr'];
    
    // Update quick settings display
    const langDisplay = $('quick-lang-display');
    const themeDisplay = $('quick-theme-display');
    
    if (langDisplay) langDisplay.textContent = currentLang === 'tr' ? 'Türkçe' : 'English';
    if (themeDisplay) {
        const themeMap = {
            'theme-purple': 'Mor',
            'theme-green': 'Yeşil', 
            'theme-blue': 'Mavi',
            'theme-red': 'Kırmızı',
            'theme-orange': 'Turuncu',
            'theme-pink': 'Pembe'
        };
        const currentTheme = getTheme();
        themeDisplay.textContent = themeMap[currentTheme] || 'Mor';
    }
    
    // Setup Settings button
    const settingsBtn = $('btn-open-settings');
    if (settingsBtn) {
        settingsBtn.onclick = () => showView('settings');
    }
}

// ============================================
// NEW VIEW RENDERERS
// ============================================
function renderFeedView() {
    const container = $('feed-content');
    if (!container) return;
    
    // Mock feed data - in real app this would come from Firebase
    const mockFeed = [
        {
            user: { name: 'Ahmet', avatar: '🎬' },
            action: 'Iron Man izledi',
            time: '5 dk önce',
            movie: { title: 'Iron Man', year: '2008', poster: null },
            rating: 5
        },
        {
            user: { name: 'Mehmet', avatar: '🍿' },
            action: 'The Dark Knight favorilerine ekledi',
            time: '1 saat önce',
            movie: { title: 'The Dark Knight', year: '2008', poster: null },
            rating: null
        }
    ];
    
    container.innerHTML = mockFeed.map(item => `
        <div class="feed-item">
            <div class="feed-item-header">
                <div class="feed-item-avatar">${item.user.avatar}</div>
                <div class="feed-item-info">
                    <div class="feed-item-name">${item.user.name}</div>
                    <div class="feed-item-time">${item.time}</div>
                </div>
            </div>
            <div class="feed-item-action">${item.action}</div>
            <div class="feed-item-content">
                <div class="movie-poster-placeholder" style="width:60px;height:90px;border-radius:8px;"></div>
                <div class="feed-item-details">
                    <div class="feed-item-title">${item.movie.title}</div>
                    <div class="feed-item-meta">${item.movie.year}</div>
                    ${item.rating ? `<div style="margin-top:4px;">⭐ ${item.rating}</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderFriendsView() {
    const container = $('friends-list-detailed');
    if (!container) return;
    
    const friends = JSON.parse(localStorage.getItem('vw_friends') || '[]');
    
    if (friends.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);">
                <div style="font-size:48px;margin-bottom:16px;">👥</div>
                <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Henüz arkadaşın yok</div>
                <div style="font-size:13px;">Arkadaşlarını davet et ve birlikte izleyin!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = friends.map(friend => `
        <div class="friend-item-detailed">
            <div class="friend-avatar-detailed">
                ${friend.avatar || '👤'}
                <div class="friend-status ${friend.online ? '' : 'offline'}"></div>
            </div>
            <div class="friend-info-detailed">
                <div class="friend-name-detailed">${friend.nick || 'Kullanıcı'}</div>
                <div class="friend-status-text">${friend.online ? 'Çevrimiçi' : 'Çevrimdışı'}</div>
            </div>
            <div class="friend-stats">
                <div class="friend-stat">
                    <span class="friend-stat-value">${friend.watched || 0}</span>
                    <span class="friend-stat-label">İzlendi</span>
                </div>
                <div class="friend-stat">
                    <span class="friend-stat-value">${friend.favorites || 0}</span>
                    <span class="friend-stat-label">Favori</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderWatchedView() {
    const grid = $('watched-grid');
    if (!grid) return;
    
    const watchedMap = getWatched();
    const watchedItems = [];
    
    UNIVERSES.forEach(u => {
        u.items.forEach(item => {
            if (watchedMap[item.id]) watchedItems.push(item);
        });
    });
    
    if (watchedItems.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎬</div><div class="empty-title">Henüz hiçbir şey izlemedin</div></div>';
        return;
    }
    
    grid.innerHTML = '';
    watchedItems.forEach(item => {
        const card = createMovieCard(item);
        grid.appendChild(card);
    });
}

function renderFavoritesView() {
    const grid = $('favorites-grid');
    if (!grid) return;
    
    const favIds = getFavorites();
    const favItems = [];
    
    // Find favorite items from universes
    UNIVERSES.forEach(u => {
        u.items.forEach(item => {
            if (favIds.includes(item.id)) favItems.push(item);
        });
    });
    
    if (favItems.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⭐</div><div class="empty-title">Henüz favori yok</div></div>';
        return;
    }
    
    grid.innerHTML = '';
    favItems.forEach(item => {
        const card = createMovieCard(item);
        grid.appendChild(card);
    });
}

function renderAchievementsView() {
    const container = $('achievements-list');
    if (!container) return;
    
    const unlocked = getUnlockedAchievements();
    
    container.innerHTML = ACHIEVEMENTS.map(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        return `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon-large">${ach.icon}</div>
                <div class="achievement-details">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                    ${isUnlocked ? '<div class="achievement-date">Kazanıldı!</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderHistoryView() {
    const container = $('history-list');
    if (!container) return;
    
    const history = getWatchHistory();
    
    if (history.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary);">Henüz izleme geçmişi yok</div>';
        return;
    }
    
    container.innerHTML = history.map(h => `
        <div class="history-item">
            <div class="history-item-poster" style="width:50px;height:75px;background:var(--bg-secondary);border-radius:8px;"></div>
            <div class="history-item-info">
                <div class="history-item-title">${h.title || 'Bilinmiyor'}</div>
                <div class="history-item-date">${new Date(h.timestamp).toLocaleDateString('tr-TR')}</div>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm('İzleme geçmişi silinecek. Emin misin?')) {
        localStorage.removeItem('versewatch_history');
        renderHistoryView();
        showToast('Geçmiş temizlendi', 'success');
    }
}

function renderWatchedLibraryInProfile() {
    const grid = $('profile-grid');
    if (!grid) return;

    const watchedMap = getWatched();
    grid.innerHTML = '';

    const watchedItems = [];
    UNIVERSES.forEach(u => {
        u.items.forEach(item => {
            if (watchedMap[item.id]) watchedItems.push(item);
        });
    });
    // External items
    Object.keys(watchedMap).forEach(id => {
        if (!watchedItems.find(i => i.id === id)) {
            const cached = posterCache[id];
            if (cached) watchedItems.push(cached);
        }
    });

    if (watchedItems.length === 0) {
        grid.innerHTML = '<div class="friends-empty" style="grid-column:1/-1">Henüz hiçbir şey izlemedin.</div>';
        return;
    }

    watchedItems.sort((a, b) => {
        const dates = getWatchDates();
        return (dates[b.id] || 0) - (dates[a.id] || 0);
    });

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
        card.className = 'universe-card';
        card.style.animationDelay = `${idx * 80}ms`;

        // Try to find a background image from the first item
        const firstItem = universe.items[0];
        const tmdb = posterCache[firstItem?.id];
        const bgImg = tmdb?.backdropUrl || '';

        card.innerHTML = `
            ${bgImg ? `<img src="${bgImg}" class="universe-card-img" alt="${universe.name}">` : `<div class="universe-card-img" style="background:${universe.gradient};opacity:0.8"></div>`}
            <div style="position:absolute;top:10px;right:10px;font-size:20px;z-index:3;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9))">${universe.icon}</div>
            ${stats.percent > 0 ? `<div style="position:absolute;top:10px;left:10px;z-index:3;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border-radius:20px;padding:3px 8px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.15)">%${stats.percent}</div>` : ''}
            
            <div class="universe-card-content">
                <div class="universe-card-title">${universe.shortName}</div>
                <div class="universe-card-count">${stats.done} / ${stats.total} izlendi</div>
                <div style="height:3px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:6px; overflow:hidden">
                    <div style="width:${stats.percent}%;height:100%;background:${universe.gradient}"></div>
                </div>
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
    $('search-anchor').style.display = 'none'; // Hide main header


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
    $('search-anchor').style.display = 'block'; // Show main header
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
    const VERSION = '28';
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
        // Limit parallel work to reduce UI freezes / memory pressure.
        const BATCH = 6;
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

            // Gentle pacing between batches.
            if (i + BATCH < universe.items.length) {
                await new Promise(r => setTimeout(r, 60));
            }
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

    // Keyboard UX: Esc to close + simple focus trap.
    document.addEventListener('keydown', (e) => {
        if (!overlay || !overlay.classList.contains('open')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            closeModal();
            return;
        }

        if (e.key === 'Tab') {
            const modalRoot = overlay.querySelector('.modal-body') || overlay;
            const focusables = Array.from(
                modalRoot.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
            ).filter(el => !el.disabled && el.offsetParent !== null);

            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;

            if (e.shiftKey) {
                if (active === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    });
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

    lastFocusedEl = document.activeElement;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Move focus inside modal for accessibility.
    const closeBtn = $('modal-close-btn');
    if (closeBtn) closeBtn.focus({ preventScroll: true });

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
      <div class="modal-backdrop">
        <div class="modal-backdrop-placeholder" style="background: ${item.posterCss || 'var(--bg-secondary)'}"></div>
        <div class="modal-backdrop-overlay"></div>
      </div>`;
    }

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
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        lastFocusedEl.focus();
    }
    lastFocusedEl = null;
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
    btn.classList.toggle('active', inWatchlist);
    btn.innerHTML = '🔖';
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
    let activeResultIdx = -1;

    const clearActiveResult = () => {
        results.querySelectorAll('.search-result-card.active').forEach(el => el.classList.remove('active'));
        activeResultIdx = -1;
    };

    const setActiveResult = (idx) => {
        const cards = Array.from(results.querySelectorAll('.search-result-card'));
        if (cards.length === 0) {
            activeResultIdx = -1;
            return;
        }

        const clamped = Math.max(0, Math.min(idx, cards.length - 1));
        cards.forEach((c, i) => c.classList.toggle('active', i === clamped));
        activeResultIdx = clamped;

        // Keep the active card in view on mobile.
        cards[clamped]?.scrollIntoView?.({ block: 'nearest' });
    };

    // Position search results dynamically right below the search bar
    function updateResultsPosition() {
        const rect = bar.getBoundingClientRect();
        // Since the results container is inside search-anchor, relative top is 0 typically
        // But for fixed/absolute alignment we ensure it's below the input
        results.style.top = `100%`;
    }

    function closeSearch() {
        bar.classList.remove('open');
        toggleBtn.classList.remove('active');
        results.classList.remove('open');
        clearActiveResult();
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
            clearActiveResult();
            results.classList.remove('open');
            results.innerHTML = '';
        }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });

    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = input.value.trim();
        clearActiveResult();
        if (q.length < 2) { results.classList.remove('open'); results.innerHTML = ''; return; }
        updateResultsPosition();
        searchTimeout = setTimeout(() => performSearch(q), 200);
    });

    input.addEventListener('keydown', (e) => {
        if (!results.classList.contains('open')) return;

        const cards = Array.from(results.querySelectorAll('.search-result-card'));
        if (cards.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveResult(activeResultIdx === -1 ? 0 : activeResultIdx + 1 >= cards.length ? 0 : activeResultIdx + 1);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveResult(activeResultIdx === -1 ? cards.length - 1 : activeResultIdx - 1 < 0 ? cards.length - 1 : activeResultIdx - 1);
            return;
        }

        if (e.key === 'Enter') {
            if (activeResultIdx >= 0 && activeResultIdx < cards.length) {
                e.preventDefault();
                cards[activeResultIdx].click();
                closeSearch();
            }
        }
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

function renderSearchCards(items, container, query = '') {
    const q = (query || '').trim();
    const highlightText = (text) => {
        const raw = String(text ?? '');
        if (!q || q.length < 2) return escHtml(raw);

        const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escapedQuery, 'ig');

        // Build HTML safely: escape non-matching parts, wrap only matches.
        let out = '';
        let lastIndex = 0;
        let match;
        while ((match = re.exec(raw)) !== null) {
            const start = match.index;
            out += escHtml(raw.slice(lastIndex, start));
            out += `<span class="search-highlight">${escHtml(match[0])}</span>`;
            lastIndex = start + match[0].length;
        }
        out += escHtml(raw.slice(lastIndex));
        return out;
    };

    container.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'search-result-card';
        card.innerHTML = `
      ${item.posterUrl
                ? `<img class="search-result-poster" src="${item.posterUrl}" alt="${escHtml(item.title)}">`
                : `<div class="search-result-poster" style="display:flex;align-items:center;justify-content:center;font-size:24px">🎬</div>`}
      <div class="search-result-info">
        <div class="search-result-title">${highlightText(item.title)}</div>
        <div class="search-result-meta">${item.year} • ${item.type === 'series' ? 'Dizi' : 'Film'} ${item.rating ? `• ⭐ ${item.rating}` : ''}</div>
        ${item.overview ? `<div class="search-result-overview">${highlightText(item.overview)}</div>` : ''}
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
        renderSearchCards(localItems, resultsEl, query);
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
            renderSearchCards(apiItems, resultsEl, query);
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

// Legacy Firebase listeners removed. Integrated into modern init().

// ============================================
// PROFILE VIEW
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
    
    const percent = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

    const statsGrid = $('active-stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card-premium">
                <div class="big-num">${doneAll}</div>
                <div class="label">${currentLang === 'tr' ? 'İZLENDİ' : 'WATCHED'}</div>
            </div>
            <div class="stat-card-premium">
                <div class="big-num">${totalAll}</div>
                <div class="label">${currentLang === 'tr' ? 'TOPLAM' : 'TOTAL'}</div>
            </div>
        `;
    }

    const statsCharts = $('stats-charts-container');
    if (statsCharts) {
        statsCharts.innerHTML = `
            <div class="stats-chart-wrap">
                <div class="donut-chart-wrap">
                    <svg width="120" height="120" class="donut-svg">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
                         <circle cx="60" cy="60" r="54" fill="none" 
                            stroke="var(--accent-purple)" 
                            stroke-width="12" 
                            stroke-dasharray="339.292" 
                            stroke-dashoffset="${339.292 * (1 - (percent || 0) / 100)}" 
                            stroke-linecap="round"
                            style="transition: stroke-dashoffset 1s ease-out;"/>
                        <text x="60" y="65" text-anchor="middle" fill="#fff" font-size="22" font-weight="950" transform="rotate(90 60 60)">%${percent || 0}</text>
                    </svg>
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <div class="dot-label"><span class="dot" style="background:#7c3aed"></span> ${currentLang === 'tr' ? 'Film' : 'Movie'}</div>
                        <div class="legend-val">${moviesWatched}</div>
                    </div>
                    <div class="legend-item">
                        <div class="dot-label"><span class="dot" style="background:#06b6d4"></span> ${currentLang === 'tr' ? 'Dizi' : 'Series'}</div>
                        <div class="legend-val">${seriesWatched}</div>
                    </div>
                    <div class="legend-item">
                        <div class="dot-label"><span class="dot" style="background:rgba(255,255,255,0.1)"></span> ${currentLang === 'tr' ? 'Kalan' : 'Remains'}</div>
                        <div class="legend-val">${totalAll - doneAll}</div>
                    </div>
                </div>
            </div>
        `;
    }

    const masteryGrid = $('mastery-grid');
    if (masteryGrid) {
        masteryGrid.innerHTML = '';
        UNIVERSES.forEach(u => {
            const s = getUniverseStats(u);
            if (s.done > 0) {
                const card = document.createElement('div');
                card.className = 'mastery-card';
                let rank = currentLang === 'tr' ? 'ÇIRAK' : 'APPRENTICE';
                if (s.percent >= 100) rank = '👑 MASTER';
                else if (s.percent >= 75) rank = '⭐ ' + (currentLang === 'tr' ? 'UZMAN' : 'EXPERT');
                else if (s.percent >= 50) rank = '🔷 ' + (currentLang === 'tr' ? 'KIDEMLİ' : 'VETERAN');
                else if (s.percent >= 25) rank = '🌱 ' + (currentLang === 'tr' ? 'GEZGİN' : 'EXPLORER');

                card.innerHTML = `
                    <div class="mastery-icon">${u.icon || '🎬'}</div>
                    <div class="mastery-name">${u.shortName}</div>
                    <div class="mastery-title">${rank}</div>
                    <div class="mastery-pct">%${s.percent}</div>
                `;
                masteryGrid.appendChild(card);
            }
        });
    }

    // Universe breakdown
    const breakdown = $('stats-universe-breakdown');
    if (breakdown) {
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

window.calNav = function(dir) {
    calendarMonth += dir;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderWatchCalendar();
};

// ============================================
// FIREBASE UI
// ============================================
const AVATARS = [
    '🎬', '🎭', '🎥', '🍿', '⭐', '🚀', '🧙‍♂️', '🧛', '🧟', '🦸‍♂️',
    '🕵️‍♂️', '🛸', '🤖', '👾', '💎', '🔥', '🐉', '🏴‍☠️', '🌌', '🌟',
    '🕶️', '🎞️', '🎧', '🎸', '🎮', '🏆', '🦁', '🐺', '🦊', '🦅',
    '🦄', '🌙', '🪐', '💫', '⚡', '🏮', '✨', '🧿', '🍀', '👑'
];

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

    // Nick input validation
    const nickInput = $('nick-input');
    const saveBtn = $('btn-save-profile');

    // Hide photo upload preview since it's removed from UI but might be used by old logic
    const preview = $('photo-upload-preview');
    if (preview) preview.style.display = 'none';
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
            const nick = (nickInput.value || '').trim().toLowerCase();
            const avatarEl = $('selected-avatar');
            const avatar = avatarEl ? avatarEl.textContent : '🎬';

            if (!nick) {
                showToast('Lütfen bir kullanıcı adı girin ✍️', 'error');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent = 'Kaydediliyor...';
            
            // Offline fallback
            if (!currentUser) {
                console.log('[App] Offline saving profile...');
                localStorage.setItem('vw_user_nick', nick);
                localStorage.setItem('vw_user_avatar', avatar);
                
                $('nickname-modal').style.display = 'none';
                showToast(`Hoş geldin, ${nick}! 🎉 (Çevrimdışı)`, 'success');
                
                renderProfileView();
                saveBtn.disabled = false;
                saveBtn.textContent = 'Kaydet & Başla 🚀';
                return;
            }

            const saveTimeout = setTimeout(() => {
                if (saveBtn.disabled) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Kaydet & Başla 🚀';
                    showToast('İşlem zaman aşımına uğradı, tekrar dene 🌐', 'error');
                }
            }, 10000); // Reduced to 10s for better UX

            try {
                const updates = { 
                    nick: nick, 
                    avatar: avatar,
                    photoURL: (localStorage.getItem('vw_user_photo') || currentUser.photoURL || '')
                };

                console.log('[App] Saving profile to Firestore for:', currentUser.uid);
                await updateUserProfile(currentUser.uid, updates);
                
                localStorage.setItem('vw_user_nick', nick);
                localStorage.setItem('vw_user_avatar', avatar);

                await syncLocalToFirestore(currentUser.uid);
                clearTimeout(saveTimeout);
                
                $('nickname-modal').style.display = 'none';
                showToast(`Hoş geldin, ${nick}! 🎉`, 'success');
                
                renderProfileViewFirebase(updates);
                initSocialTabs();
            } catch (e) {
                clearTimeout(saveTimeout);
                saveBtn.disabled = false;
                saveBtn.textContent = 'Kaydet & Başla 🚀';
                console.error('[App] Profil kaydetme hatası:', e);
                showToast('Hata: ' + (e.message || 'Firestore bağlantı hatası'), 'error');
            }
        });
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
}

    // Moved out of scope for better reliability
    window.selectAvatar = function(emoji) {
        $('selected-avatar').textContent = emoji;
        document.querySelectorAll('.avatar-option').forEach(el => el.classList.toggle('selected', el.dataset.emoji === emoji));
    };

    window.showNicknameModal = function(isEditing = false) {
        const modal = $('nickname-modal');
        if (modal) {
            modal.style.display = 'flex';
            const cancelBtn = $('btn-cancel-profile');
            if (cancelBtn) {
                cancelBtn.style.display = isEditing ? 'block' : 'none';
            }

            // Ensure nickname input is cleared/filled
            const nickInput = $('nick-input');
            if (nickInput) {
                nickInput.value = isEditing ? (localStorage.getItem('vw_user_nick') || '') : '';
            }

            if (isEditing) {
                selectAvatar(localStorage.getItem('vw_user_avatar') || '🎬');
            }
            
            // Re-enable save button for editing mode or clear it
            const saveBtn = $('btn-save-profile');
            if (saveBtn) {
                saveBtn.disabled = !isEditing;
                saveBtn.textContent = 'Kaydet & Başla 🚀';
            }
            
            const status = $('nick-status');
            if (status) status.textContent = '';
        }
    };

    // ============================================
    // PROFILE VIEW — FIREBASE ENHANCED
    // ============================================
    function renderProfileViewFirebase(profile) {
        if (!profile) return;
        const nickEl = $('profile-firebase-nick');
        const avatarEl = $('profile-firebase-avatar');
        if (nickEl) nickEl.textContent = profile.nick || profile.displayName || 'Kullanıcı';
        if (avatarEl) {
            const photoURL = profile.photoURL || localStorage.getItem('vw_user_photo') || '';
            if (photoURL) {
                avatarEl.innerHTML = `<img src="${photoURL}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            } else {
                avatarEl.innerHTML = profile.avatar || '🎬';
            }
        }
    }

    // ============================================
    // PROFILE & SOCIAL TABS
    // ============================================
    function initSocialTabs() {
        const tabs = $$('.profile-tab-btn');
        const contents = {
            'tab-feed': $('feed-tab-content'),
            'tab-friends': $('friends-tab-content'),
            'tab-watched': $('watched-tab-content')
        };

        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                tabs.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-muted)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--accent-purple)';
                btn.style.color = '#fff';

                Object.values(contents).forEach(c => { if (c) c.style.display = 'none'; });
                const target = contents[btn.id];
                if (target) {
                    target.style.display = 'block';
                    if (btn.id === 'tab-feed') renderFeedTab();
                    else if (btn.id === 'tab-friends') renderFriendsTab();
                    else if (btn.id === 'tab-watched') renderWatchedLibraryInProfile();
                }
            });
        });

        // Default load
        renderFeedTab();
    }

    async function renderFeedTab() {
        const container = $('feed-tab-content');
        if (!container) return;
        if (!currentUser) {
            container.innerHTML = '<div class="friends-empty">Giriş yapman gerekiyor 🔐</div>';
            return;
        }

        container.innerHTML = '<div class="friends-loading">Akış yükleniyor... ✨</div>';

        try {
            const feed = await getFriendActivityFeed(currentUser.uid);
            if (feed.length === 0) {
                container.innerHTML = '<div class="friends-empty">Henüz bir aktivite yok. Arkadaş ekleyerek akışı canlandır! 🌟</div>';
                return;
            }

            let html = '';
            for (const act of feed) {
                const likes = await getCommentLikes(act.user.uid, act.itemId);
                const isLiked = likes.includes(currentUser.uid);
                const timeStr = act.timestamp ? new Date(act.timestamp.toMillis()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';

                html += `
                <div class="activity-item">
                    <div class="activity-content">
                        <div class="activity-user-row">
                            <div class="friend-card-avatar activity-avatar">${act.user.avatar || '🎬'}</div>
                            <div class="activity-nick">${act.user.nick}</div>
                            <div class="activity-time">${timeStr}</div>
                        </div>
                        <div style="font-size:14px; font-weight:600; color:#fff;">
                            ${act.action === 'watched' ? '🎬' : '⭐'} ${act.title}
                        </div>
                        ${act.comment ? `<div class="activity-comment">"${act.comment}"</div>` : ''}
                        
                        <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="handleLike('${act.user.uid}', '${act.itemId}', this)">
                            <span>${isLiked ? '❤️' : '🤍'}</span>
                            <span class="like-count">${likes.length || 0}</span>
                        </button>
                    </div>
                </div>
            `;
            }
            container.innerHTML = html;
        } catch (e) {
            console.error('[App] Feed error:', e);
            container.innerHTML = '<div class="friends-empty">Akış yüklenirken bir hata oluştu.</div>';
        }
    }

    window.handleLike = async function(ownerUid, itemId, btn) {
        if (!currentUser) {
            showToast('Beğenmek için giriş yapmalısın 🔐', 'info');
            return;
        }
        try {
            const liked = await toggleLikeComment(ownerUid, itemId, currentUser.uid);
            const countSpan = btn.querySelector('.like-count');
            const iconSpan = btn.querySelector('span:first-child');
            let count = parseInt(countSpan.textContent);

            if (liked) {
                btn.classList.add('liked');
                iconSpan.textContent = '❤️';
                countSpan.textContent = count + 1;
            } else {
                btn.classList.remove('liked');
                iconSpan.textContent = '🤍';
                countSpan.textContent = Math.max(0, count - 1);
            }
        } catch (e) {
            showToast('Beğeni işlemi başarısız.', 'error');
        }
    };

    window.renderFriendsTab = renderFriendsTab;
    window.searchFriendByNick = searchFriendByNick;
    window.sendFriendReq = sendFriendReq;
    window.acceptFriendReq = acceptFriendReq;
    window.openFriendModal = openFriendModal;
    window.closeFriendModal = closeFriendModal;

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
                    : `<button class="btn-suggest-pill" style="padding:8px 12px;font-size:12px" onclick="sendFriendReq('${u.uid}')">+ Ekle</button>`}
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
        // Delegate to global toast queue to avoid overlapping toasts.
        if (typeof window !== 'undefined' && typeof window.__vwShowToast === 'function') {
            window.__vwShowToast(msg, type);
            return;
        }

        const toast = $('toast');
        toast.textContent = msg;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // ============================================
    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ============================================
    // APP START
    // ============================================
    function init() {
        // Mobile-like UX: scroll down => hide bottom nav so content isn't blocked.
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            let lastY = window.scrollY || 0;
            let raf = null;

            const isBlockingModalOpen = () => {
                const overlay = $('modal-overlay');
                return overlay && overlay.classList.contains('open');
            };

            const isSearchOpen = () => {
                const resultsEl = document.querySelector('.search-results.open');
                return !!resultsEl;
            };

            window.addEventListener('scroll', () => {
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    raf = null;
                    if (isBlockingModalOpen() || isSearchOpen()) {
                        const yNow = window.scrollY || 0;
                        const dy = yNow - lastY;

                        if (isSearchOpen() && dy > 15) {
                            // Scroll ile search dropdown açık kalmasın.
                            const barEl = $('search-bar');
                            const toggleBtn = $('search-toggle-btn');
                            const resultsEl = $('search-results-container');
                            if (barEl) barEl.classList.remove('open');
                            if (toggleBtn) toggleBtn.classList.remove('active');
                            if (resultsEl) {
                                resultsEl.classList.remove('open');
                                resultsEl.innerHTML = '';
                            }
                        }

                        bottomNav.classList.remove('hidden');
                        lastY = yNow;
                        return;
                    }

                    const y = window.scrollY || 0;
                    const dy = y - lastY;

                    // Small top area: always show.
                    if (y < 50) {
                        bottomNav.classList.remove('hidden');
                    } else if (dy > 15) {
                        // Scrolling down
                        bottomNav.classList.add('hidden');
                    } else if (dy < -15) {
                        // Scrolling up
                        bottomNav.classList.remove('hidden');
                    }

                    lastY = y;
                });
            }, { passive: true });
        }

        // Prevent browser zoom via Ctrl +/- (mobile-app feel).
        document.addEventListener('keydown', (e) => {
            if (!e.ctrlKey) return;
            if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === 'Add' || e.key === 'Subtract') {
                e.preventDefault();
            }
        }, { capture: true });

    // ============================================
    // NEW UI EFFECTS - ADVANCED INTERACTIONS
    // ============================================
    
    // 3D Tilt Effect for Cards
    function init3DTiltEffect() {
        const cards = document.querySelectorAll('.universe-card, .movie-card, .recent-card, .stat-card-premium');
        
        cards.forEach(card => {
            card.classList.add('tilt-card');
            const inner = card.querySelector(':scope > *') || card;
            inner.classList.add('tilt-card-inner');
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            });
        });
    }
    
    // Glow Cursor Effect
    function initGlowCursor() {
        if (window.matchMedia('(pointer: coarse)').matches) return; // Skip on touch devices
        
        const cursor = document.createElement('div');
        cursor.className = 'glow-cursor';
        document.body.appendChild(cursor);
        
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let isActive = false;
        let rafId = null;
        
        function updateCursor() {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            
            if (isActive) {
                rafId = requestAnimationFrame(updateCursor);
            }
        }
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (!isActive) {
                isActive = true;
                cursor.classList.add('active');
                updateCursor();
            }
            
            clearTimeout(cursor.timeout);
            cursor.timeout = setTimeout(() => {
                isActive = false;
                cursor.classList.remove('active');
                if (rafId) cancelAnimationFrame(rafId);
            }, 100);
        }, { passive: true });
    }
    
    // Scroll Progress Bar
    function initScrollProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);
        
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollTop / docHeight;
            progressBar.style.transform = `scaleX(${progress})`;
        };
        
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }
    
    // Staggered Entry Animation
    function initStaggeredAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        const staggerElements = document.querySelectorAll('.universe-card, .movie-card, .stat-card-premium, .recent-card');
        staggerElements.forEach((el, i) => {
            el.classList.add('stagger-item');
            el.style.animationDelay = `${i * 80}ms`;
            observer.observe(el);
        });
    }
    
    // Ripple Effect
    function initRippleEffect() {
        document.querySelectorAll('.btn-icon, .btn-back, .filter-tab, .nav-item, .modal-watchlist-btn').forEach(btn => {
            btn.classList.add('ripple');
            
            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                btn.style.setProperty('--ripple-x', x + '%');
                btn.style.setProperty('--ripple-y', y + '%');
            });
        });
    }
    
    // Reveal on Scroll
    function initRevealOnScroll() {
        const reveals = document.querySelectorAll('.home-section, .stats-grid-modern, .portal-greeting-bar');
        reveals.forEach(el => el.classList.add('reveal'));
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });
        
        reveals.forEach(el => observer.observe(el));
    }
    
    // Spotlight Effect for Cards
    function initSpotlightEffect() {
        document.querySelectorAll('.universe-card, .user-level-card').forEach(card => {
            card.classList.add('spotlight');
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mouse-x', x + '%');
                card.style.setProperty('--mouse-y', y + '%');
            });
        });
    }
    
    // Parallax Background
    function initParallax() {
        const parallaxElements = document.querySelectorAll('.bg-orb');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            parallaxElements.forEach((el, i) => {
                const speed = 0.5 + (i * 0.1);
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        }, { passive: true });
    }
    
    // Magnetic Button Effect
    function initMagneticButtons() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        
        document.querySelectorAll('.btn-icon, .btn-suggest-pill').forEach(btn => {
            btn.classList.add('magnetic-btn');
            
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }
    
    // Confetti Effect
    function triggerConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        
        const colors = ['#00d4ff', '#9d50bb', '#ff2d92', '#ffffff'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
            container.appendChild(confetti);
        }
        
        setTimeout(() => container.remove(), 5000);
    }
    
    // Glass Reflection Effect
    function initGlassReflection() {
        document.querySelectorAll('.universe-card, .user-level-card, .stat-card-premium').forEach(card => {
            card.classList.add('glass-reflection');
        });
    }
    
    // Neon Border Effect for Active Nav
    function initNeonBorder() {
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) activeNav.classList.add('neon-border', 'pulse-glow');
    }
    
    // Initialize all effects
    function initEffects() {
        init3DTiltEffect();
        initGlowCursor();
        initScrollProgress();
        initStaggeredAnimations();
        initRippleEffect();
        initRevealOnScroll();
        initSpotlightEffect();
        initParallax();
        initMagneticButtons();
        initGlassReflection();
        initNeonBorder();
        
        // Re-apply effects after view changes
        const observer = new MutationObserver(() => {
            setTimeout(() => {
                init3DTiltEffect();
                initStaggeredAnimations();
                initSpotlightEffect();
                initGlassReflection();
            }, 100);
        });
        
        observer.observe(document.getElementById('app'), { childList: true, subtree: true });
    }
    
    // Expose confetti function globally
    window.triggerConfetti = triggerConfetti;

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function $(id) { return document.getElementById(id); }
    
    function getTheme() {
        return localStorage.getItem('vw_theme') || 'theme-purple';
    }
    
    function saveTheme(theme) {
        // Store the full theme class name
        const themeClass = theme.startsWith('theme-') ? theme : `theme-${theme}`;
        localStorage.setItem('vw_theme', themeClass);
        
        // Remove all theme classes
        document.body.classList.forEach(cls => {
            if (cls.startsWith('theme-')) {
                document.body.classList.remove(cls);
            }
        });
        
        // Add new theme class
        document.body.classList.add(themeClass);
    }
    
    // Apply theme on load
    const savedTheme = getTheme();
    if (savedTheme) {
        saveTheme(savedTheme);
    }

    migrateData();
    initAuth();
    updateLanguage(currentLang);
    updateLevelUI();
    saveTheme(getTheme());
    setupNavigation();
    setupSearch();
    setupModal();
    renderPortalGrid();
    renderRecentlyWatched();
    renderWatchlist();
    preloadAllUniverses();
    
    // Initialize new effects after render
    setTimeout(initEffects, 500);

    // Initial view
    showView('home');

        // Home Section Listeners
        const btnRandom = $('btn-random-suggest');
        if (btnRandom) btnRandom.addEventListener('click', suggestRandomItem);

        const logoHome = $('logo-home');
        if (logoHome) logoHome.addEventListener('click', () => showView('home'));

        // Theme Picker in Settings - Fixed
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                
                // Remove active from all
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');
                
                // Save theme
                saveTheme(theme);
                
                // Visual feedback
                showToast(currentLang === 'tr' ? `Tema: ${theme.replace('theme-', '').toUpperCase()}` : `Theme: ${theme.replace('theme-', '').toUpperCase()}`, 'success');
            });
        });

        // Set initial active theme
        const currentTheme = getTheme();
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.getAttribute('data-theme') === currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Language switch in settings - Fixed
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newLang = btn.getAttribute('data-lang');
                
                // Update active state
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update language
                updateLanguage(newLang);
                showToast(newLang === 'tr' ? 'Dil: Türkçe' : 'Language: English', 'success');
            });
        });

        // Set initial active language
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Export Data
        const btnExport = $('btn-export-data');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                exportData();
            });
        }

        // Import Data
        const fileImport = $('file-import');
        if (fileImport) {
            fileImport.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    importData(file).then(() => {
                        window.location.reload();
                    });
                }
            });
        }

        // Notifications Toggle
        const toggleNotifications = $('toggle-notifications');
        if (toggleNotifications) {
            toggleNotifications.addEventListener('click', () => {
                toggleNotifications.classList.toggle('active');
                const isActive = toggleNotifications.classList.contains('active');
                localStorage.setItem('versewatch_notifications', isActive ? 'on' : 'off');
                showToast(isActive ? 'Bildirimler açık' : 'Bildirimler kapalı', 'info');
            });
            
            // Set initial state
            const notifState = localStorage.getItem('versewatch_notifications') || 'on';
            if (notifState === 'off') {
                toggleNotifications.classList.remove('active');
            }
        }

        // Clear Cache - Fixed
        const btnClear = $('btn-clear-cache');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm(currentLang === 'tr' ? 'Tüm veriler sıfırlanacak! Emin misin?' : 'All data will be reset! Are you sure?')) {
                    localStorage.clear();
                    window.location.reload();
                }
            });
        }

        // Logout button
        const btnLogout = $('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                if (confirm(currentLang === 'tr' ? 'Çıkış yapmak istediğine emin misin?' : 'Are you sure you want to logout?')) {
                    try {
                        await signOutUser();
                        localStorage.removeItem('vw_user_nick');
                        localStorage.removeItem('vw_user_avatar');
                        window.location.reload();
                    } catch (e) {
                        showToast('Error: ' + e.message, 'error');
                    }
                }
            });
        }

        // Profile Tab switch logic
        initSocialTabs();
    }



    // Kick it off
    window.addEventListener('load', init);
