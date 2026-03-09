// VerseWatch - TMDB API Integration
// Using TMDB API v3 - Get free key at: https://www.themoviedb.org/settings/api

const TMDB_APIKEY_STORAGE = 'versewatch_tmdb_key';

// We will use multiple fallback proxies to ensure at least one works
const PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://corsproxy.io/?'
];

// Fallback OMDB API Key (Open Movie Database)
const OMDB_KEY = 'apikey=trilogy';

const TMDB_CACHE_KEY = 'versewatch_tmdb_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const TMDB_IMG_BASE = 'https://wsrv.nl/?url=image.tmdb.org/t/p/';

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
    // Safe timeout wrapper using Promise.race
    const fetchWithTimeout = (url, ms) => {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
    };

    // Try without proxy first (in case it works)
    try {
        const res = await fetchWithTimeout(urlStr, 3000);
        if (res.ok) return await res.json();
    } catch (e) { /* ignore */ }

    // Try codetabs proxy FIRST (it works better without hanging)
    try {
        const proxyUrl = PROXIES[1] + encodeURIComponent(urlStr);
        const res = await fetchWithTimeout(proxyUrl, 6000);
        if (res.ok) return await res.json();
    } catch (e) { console.warn('Codetabs proxy failed', e); }

    // Try corsproxy.io
    try {
        const proxyUrl = PROXIES[2] + encodeURIComponent(urlStr);
        const res = await fetchWithTimeout(proxyUrl, 6000);
        if (res.ok) return await res.json();
    } catch (e) { console.warn('Corsproxy failed', e); }

    // Try allorigins proxy as last resort because it timeout hangs
    try {
        const proxyUrl = PROXIES[0] + encodeURIComponent(urlStr);
        const res = await fetchWithTimeout(proxyUrl, 8000);
        if (res.ok) {
            const data = await res.json();
            if (data.contents) return JSON.parse(data.contents);
        }
    } catch (e) {
        console.warn('Allorigins failed', e);
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
        const item = u.items.find(i => i.tmdbId == tmdbId || i.id == tmdbId);
        if (item) {
            titleToSearch = item.title;
            yearToSearch = item.year;
            imdbId = item.imdbId; // newly injected data
            break;
        }
    }

    let parsed = null;
    const tmdbKey = getTMDBKey();

    // 1. Try TMDB First
    if (tmdbKey && tmdbKey.length > 8 && tmdbId) {
        let tmdbType = type === 'series' ? 'tv' : 'movie';
        let tmdbUrl = `https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${tmdbKey}&language=tr-TR`;
        let tmdbData = await fetchWithFallback(tmdbUrl);

        if (tmdbData && tmdbData.id) {
            parsed = {
                id: tmdbData.id,
                title: titleToSearch || tmdbData.title || tmdbData.name || 'Bilinmeyen Yapım',
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
                title: titleToSearch || omdbData.Title || 'Bilinmeyen Yapım',
                originalTitle: omdbData.Title || titleToSearch,
                overview: omdbData.Plot !== 'N/A' ? omdbData.Plot : `${titleToSearch || omdbData.Title} (${yearToSearch || omdbData.Year}) filmi/dizisi.`,
                posterUrl: posterUrl,
                backdropUrl: null, // OMDB doesn't provide backdrops
                rating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : 0,
                releaseDate: omdbData.Released !== 'N/A' ? omdbData.Released : `${yearToSearch || '2000'}-01-01`,
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
            title: titleToSearch || 'Bilinmeyen Yapım',
            originalTitle: titleToSearch || 'Bilinmeyen Yapım',
            overview: titleToSearch ? `${titleToSearch} (${yearToSearch}) filmi. Bağlantı sorunu nedeniyle detaylar yüklenemedi.` : 'Bağlantı sorunu nedeniyle detaylar yüklenemedi.',
            posterUrl: null,
            backdropUrl: null,
            rating: 0,
            releaseDate: `${yearToSearch || '2000'}-01-01`,
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

    let results = [];

    // 1. Try TMDB via Proxy
    try {
        const data = await fetchTMDB('/search/multi', { query, include_adult: false });
        if (data && data.results) {
            results = data.results
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
        }
    } catch (e) {
        console.warn('TMDB Search failed:', e);
    }

    // 2. Try OMDB via HTTP (bypasses HTTPS SNI manipulation)
    if (results.length === 0) {
        try {
            const url = `http://www.omdbapi.com/?s=${encodeURIComponent(query)}&${OMDB_KEY}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.Search) {
                    results = data.Search.slice(0, 8).map(r => ({
                        tmdbId: r.imdbID,
                        title: r.Title,
                        year: r.Year,
                        type: r.Type === 'series' ? 'series' : 'movie',
                        posterUrl: r.Poster && r.Poster !== 'N/A' ? `https://wsrv.nl/?url=${r.Poster.replace('https://', '')}` : null,
                        rating: 0,
                        overview: `${r.Title} (${r.Year}) filmi/dizisi (Bölgesel bağlantı sorunu nedeniyle detaylar kısıtlı).`
                    }));
                }
            }
        } catch (e) {
            console.warn('OMDB Search failed:', e);
        }
    }

    // 3. Ultimate Fallback: Local UNIVERSES data
    if (results.length === 0 && typeof UNIVERSES !== 'undefined') {
        const q = query.toLowerCase();
        for (let u of UNIVERSES) {
            for (let item of u.items) {
                if (item.title && item.title.toLowerCase().includes(q)) {
                    results.push({
                        tmdbId: item.tmdbId || item.id,
                        title: item.title,
                        year: item.year || '2000',
                        type: item.type || 'movie',
                        posterUrl: null,
                        rating: 0,
                        overview: `(Çevrimdışı/Yerel Koleksiyon) ${item.title}`
                    });
                    if (results.length >= 8) break;
                }
            }
            if (results.length >= 8) break;
        }
    }

    return results;
}

async function fetchPopularTMDB() {
    try {
        const data = await fetchTMDB('/trending/all/day', { language: 'tr-TR' });
        return (data.results || [])
            .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
            .slice(0, 12)
            .map(r => ({
                id: `popular-${r.id}`,
                tmdbId: r.id,
                title: r.title || r.name,
                year: (r.release_date || r.first_air_date || '').slice(0, 4),
                type: r.media_type === 'tv' ? 'series' : 'movie',
                posterUrl: r.poster_path ? `${TMDB_IMG_BASE}${POSTER_SIZE}${r.poster_path}` : null,
                backdropUrl: r.backdrop_path ? `${TMDB_IMG_BASE}${BACKDROP_SIZE}${r.backdrop_path}` : null,
                rating: Math.round((r.vote_average || 0) * 10) / 10,
                overview: r.overview,
                posterCss: 'linear-gradient(135deg, #2a2a3a, #1a1a2a)' // fallback
            }));
    } catch (e) {
        console.warn('Popular fetch failed:', e);
        return [];
    }
}

async function fetchUpcomingTMDB() {
    try {
        // Fetch movies releasing in the next 30 days
        const data = await fetchTMDB('/movie/upcoming', { language: 'tr-TR', region: 'TR' });
        return (data.results || [])
            .slice(0, 10)
            .map(r => ({
                id: `upcoming-${r.id}`,
                tmdbId: r.id,
                title: r.title,
                year: (r.release_date || '').slice(0, 4),
                type: 'movie',
                posterUrl: r.poster_path ? `${TMDB_IMG_BASE}${POSTER_SIZE}${r.poster_path}` : null,
                backdropUrl: r.backdrop_path ? `${TMDB_IMG_BASE}${BACKDROP_SIZE}${r.backdrop_path}` : null,
                rating: Math.round((r.vote_average || 0) * 10) / 10,
                overview: r.overview,
                releaseDate: r.release_date,
                posterCss: 'linear-gradient(135deg, #2a2a3a, #1a1a2a)'
            }));
    } catch (e) {
        console.warn('Upcoming fetch failed:', e);
        return [];
    }
}

function posterUrl(path, size = POSTER_SIZE) {
    // If TMDB works somehow, try to fetch it over HTTP proxy
    return path ? `https://wsrv.nl/?url=image.tmdb.org/t/p/${size}${path}&output=webp&n=1&q=70` : null;
}

async function fetchRandomTMDBMovie() {
    try {
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const data = await fetchTMDB('/discover/movie', {
            language: 'tr-TR',
            page: randomPage,
            include_adult: false,
            sort_by: 'popularity.desc'
        });

        if (data && data.results && data.results.length > 0) {
            const results = data.results.filter(r => r.poster_path && r.overview);
            if (results.length > 0) {
                const r = results[Math.floor(Math.random() * results.length)];
                return {
                    tmdbId: r.id,
                    title: r.title,
                    year: (r.release_date || '').slice(0, 4),
                    type: 'movie',
                    posterUrl: r.poster_path ? `${TMDB_IMG_BASE}${POSTER_SIZE}${r.poster_path}` : null,
                    backdropUrl: r.backdrop_path ? `${TMDB_IMG_BASE}${BACKDROP_SIZE}${r.backdrop_path}` : null,
                    rating: Math.round((r.vote_average || 0) * 10) / 10,
                    overview: r.overview
                };
            }
        }
    } catch (e) {
        console.warn('Random TMDB fetch failed:', e);
    }
    return null;
}
