// VerseWatch - TMDB API Integration
// Using TMDB API v3 - Get free key at: https://www.themoviedb.org/settings/api

const TMDB_APIKEY_STORAGE = 'versewatch_tmdb_key';

// We will use multiple fallback proxies to ensure at least one works
const PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors-anywhere.herokuapp.com/' // often rate limited, but still a fallback
];

// Fallback OMDB API Key (Open Movie Database)
const OMDB_KEY = 'apikey=trilogy';

const TMDB_CACHE_KEY = 'versewatch_tmdb_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const DEFAULT_TMDB_KEY = 'bc78ecfd551f6db67e54c479bc569947'; // User's private key

function getTMDBKey() {
    return DEFAULT_TMDB_KEY;
}
function setTMDBKey(key) {
    // No-op, manual key entry disabled
}
function hasTMDBKey() {
    return getTMDBKey().length > 8;
}

// Poster sizes: w92, w154, w185, w342, w500, w780, original
const POSTER_SIZE = 'w342';
const THUMB_SIZE = 'w154';
const BACKDROP_SIZE = 'w780';

function getCache() {
    try { return JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)) || {}; }
    catch { return {}; }
}

function setCache(cache) {
    try { localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify(cache)); }
    catch (e) { console.warn('Cache write failed:', e); }
}

async function fetchWithFallback(urlStr) {
    // Try without proxy first (in case it works)
    try {
        const res = await fetch(urlStr);
        if (res.ok) return res.json();
    } catch (e) { /* ignore */ }

    // Try allorigins proxy
    try {
        const proxyUrl = PROXIES[0] + encodeURIComponent(urlStr);
        const res = await fetch(proxyUrl);
        if (res.ok) return res.json();
    } catch (e) { /* ignore */ }

    // Try thingproxy
    try {
        const proxyUrl = PROXIES[1] + encodeURIComponent(urlStr);
        const res = await fetch(proxyUrl);
        if (res.ok) return res.json();
    } catch (e) {
        throw new Error('All proxies failed or TMDB blocked.');
    }
}

async function fetchTMDB(endpoint, params = {}) {
    const key = getTMDBKey();
    if (!key) throw new Error('NO_API_KEY');

    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.set('api_key', key);
    url.searchParams.set('language', 'tr-TR');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    return await fetchWithFallback(url.toString());
}

async function fetchOMDBByTitle(title, year) {
    try {
        // Force HTTP (not HTTPS) to bypass GoodbyeDPI SNI manipulation
        const url = `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&y=${year}&${OMDB_KEY}`;
        const res = await fetch(url);
        if (res.ok) return await res.json();
    } catch (e) { console.warn("OMDB HTTP Failed:", e) }
    return null;
}

async function fetchOMDBByImdbId(imdbId) {
    try {
        // Force HTTP (not HTTPS) to bypass GoodbyeDPI SNI manipulation
        const url = `http://www.omdbapi.com/?i=${imdbId}&${OMDB_KEY}`;
        const res = await fetch(url);
        if (res.ok) return await res.json();
    } catch (e) { console.warn("OMDB HTTP Failed:", e) }
    return null;
}

async function getMovieDetails(tmdbId, type = 'movie') {
    const cache = getCache();
    const cacheKey = `${type}_${tmdbId}`;
    const now = Date.now();

    if (cache[cacheKey] && (now - cache[cacheKey].ts) < CACHE_TTL) {
        return cache[cacheKey].data;
    }

    // Completely bypass Fetch/网络requests (Due to GoodbyeDPI blocking)
    // Find movie title and static details from local data
    let titleToSearch = '';
    let yearToSearch = '';
    let imdbId = '';
    for (let u of UNIVERSES) {
        const item = u.items.find(i => i.tmdbId == tmdbId);
        if (item) {
            titleToSearch = item.title;
            yearToSearch = item.year;
            imdbId = item.imdbId; // newly injected data
            break;
        }
    }

    if (!titleToSearch) return null;

    let parsed = null;
    const tmdbKey = getTMDBKey();

    // 1. Try TMDB First
    if (tmdbKey && tmdbKey.length > 8 && tmdbId) {
        let tmdbUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${tmdbKey}&language=tr-TR`;
        let tmdbData = await fetchWithFallback(tmdbUrl);

        if (tmdbData && tmdbData.id) {
            parsed = {
                id: tmdbData.id,
                title: tmdbData.title || tmdbData.name || titleToSearch,
                originalTitle: tmdbData.original_title || tmdbData.original_name,
                overview: tmdbData.overview || '',
                posterUrl: tmdbData.poster_path ? `https://wsrv.nl/?url=image.tmdb.org/t/p/${POSTER_SIZE}${tmdbData.poster_path}&output=webp&n=1&q=70` : null,
                thumbUrl: tmdbData.poster_path ? `https://wsrv.nl/?url=image.tmdb.org/t/p/${THUMB_SIZE}${tmdbData.poster_path}&output=webp&n=1&q=70` : null,
                backdropUrl: tmdbData.backdrop_path ? `https://wsrv.nl/?url=image.tmdb.org/t/p/${BACKDROP_SIZE}${tmdbData.backdrop_path}&output=webp&n=1&q=70` : null,
                rating: tmdbData.vote_average ? parseFloat(tmdbData.vote_average.toFixed(1)) : 0,
                releaseDate: tmdbData.release_date || tmdbData.first_air_date,
                runtime: tmdbData.runtime || (tmdbData.episode_run_time ? tmdbData.episode_run_time[0] : null) || 120,
                genres: tmdbData.genres ? tmdbData.genres.map(g => g.name) : [],
                type: type,
            };
        }
    }

    // 2. Fallback to OMDB if TMDB fails
    if (!parsed && imdbId) {
        const omdbData = await fetchOMDBByImdbId(imdbId);
        if (omdbData && omdbData.Response === 'True') {
            const posterUrl = omdbData.Poster && omdbData.Poster !== 'N/A'
                ? `https://wsrv.nl/?url=${omdbData.Poster.replace('https://', '')}`
                : null;

            parsed = {
                id: tmdbId,
                title: titleToSearch,
                originalTitle: omdbData.Title || titleToSearch,
                overview: omdbData.Plot !== 'N/A' ? omdbData.Plot : `${titleToSearch} (${yearToSearch}) filmi/dizisi.`,
                posterUrl: posterUrl,
                backdropUrl: null, // OMDB doesn't provide backdrops
                rating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : 0,
                releaseDate: omdbData.Released !== 'N/A' ? omdbData.Released : `${yearToSearch}-01-01`,
                runtime: omdbData.Runtime !== 'N/A' ? parseInt(omdbData.Runtime) : 120,
                genres: omdbData.Genre ? omdbData.Genre.split(', ') : ['Aksiyon', 'Bilim Kurgu'],
                type,
            };
        }
    }

    // Ultimate fallback if fetch completely fails
    if (!parsed) {
        parsed = {
            id: tmdbId,
            title: titleToSearch,
            originalTitle: titleToSearch,
            overview: `${titleToSearch} (${yearToSearch}) filmi. Bağlantı sorunu nedeniyle detaylar yüklenemedi.`,
            posterUrl: null,
            backdropUrl: null,
            rating: 0,
            releaseDate: `${yearToSearch}-01-01`,
            runtime: 120,
            genres: ['Aksiyon'],
            type,
        };
    }

    cache[cacheKey] = { ts: now, data: parsed };
    setCache(cache);
    return parsed;
}

async function loadPostersForUniverse(universe, onProgress) {
    const results = {};
    const total = universe.items.length;
    let done = 0;

    // Batch in groups of 5 to avoid rate limiting
    const BATCH = 5;
    for (let i = 0; i < universe.items.length; i += BATCH) {
        const batch = universe.items.slice(i, i + BATCH);
        await Promise.all(batch.map(async (item) => {
            const data = await getMovieDetails(item.tmdbId, item.type);
            results[item.id] = data;
            done++;
            if (onProgress) onProgress(done, total);
        }));
    }
    return results;
}

async function searchTMDB(query) {
    if (!query || query.length < 2) return [];
    try {
        const data = await fetchTMDB('/search/multi', { query, include_adult: false });
        return (data.results || [])
            .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
            .slice(0, 8)
            .map(r => ({
                tmdbId: r.id,
                title: r.title || r.name,
                year: (r.release_date || r.first_air_date || '').slice(0, 4),
                type: r.media_type === 'tv' ? 'series' : 'movie',
                posterUrl: r.poster_path ? `${TMDB_IMG_BASE}${POSTER_SIZE}${r.poster_path}` : null,
                rating: Math.round((r.vote_average || 0) * 10) / 10,
                overview: r.overview,
            }));
    } catch (e) {
        console.warn('Search failed:', e);
        return [];
    }
}

function posterUrl(path, size = POSTER_SIZE) {
    // If TMDB works somehow, try to fetch it over HTTP proxy
    return path ? `https://wsrv.nl/?url=image.tmdb.org/t/p/${size}${path}&output=webp&n=1&q=70` : null;
}
