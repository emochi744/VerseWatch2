// ============================================
// VerseWatch — Firebase Integration
// firebase-app.js
// ============================================
// ⚠️ ADIM 1: Aşağıdaki firebaseConfig'i Firebase Console'dan al ve doldur
// firebase.google.com → Proje Ayarları (⚙️) → Your apps → Config

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDsLv3IEH0cXaDYez18YNuFp_hbpAhcC8k",
    authDomain: "versewatch.firebaseapp.com",
    projectId: "versewatch",
    storageBucket: "versewatch.firebasestorage.app",
    messagingSenderId: "199389957534",
    appId: "1:199389957534:web:c653c521f74410c0e09a8f",
    measurementId: "G-7DJPP7NSHK"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics ? firebase.analytics() : null;

// ============================================
// INIT
// ============================================
let db = null;
let auth = null;
let storage = null;
let currentUser = null;
let isFirebaseReady = false;

const isAPK = () => {
    // APK / WebView / Standalone modunda çalışıp çalışmadığını algıla
    const isFileProtocol = window.location.protocol === 'file:';
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isWebView = /wv|WebView/i.test(navigator.userAgent);
    return isFileProtocol || isWebView || isStandalone;
};

function initFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();
        storage = firebase.storage();
        isFirebaseReady = true;
        console.log('[Firebase] Initialized ✓');

        // Giriş Yönlendirme Sonucunu İşle (APK/Standalone için önemli)
        auth.getRedirectResult()
            .then((result) => {
                if (result.user) {
                    console.log('[Firebase] Yönlendirme girişi başarılı:', result.user.displayName);
                }
            })
            .catch((error) => {
                console.error('[Firebase] Yönlendirme giriş hatası:', error.code, error.message);
                if (typeof showToast === 'function') {
                    showToast('Giriş Hatası: ' + error.message, 'error');
                }
            });

    } catch (e) {
        console.error('[Firebase] Init failed:', e);
        isFirebaseReady = false;
    }
}

async function uploadProfilePhoto(uid, file) {
    if (!storage) throw new Error("Storage not initialized");
    const extension = file.name.split('.').pop() || 'png';
    const ref = storage.ref(`users/${uid}/profile_${Date.now()}.${extension}`);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    return url;
}

// ============================================
// AUTH
// ============================================
function signInWithGoogle() {
    if (!auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (isAPK()) {
        console.log('[Firebase] APK algılandı, Redirect (Yönlendirme) akışı kullanılıyor');
        return auth.signInWithRedirect(provider);
    } else {
        console.log('[Firebase] Tarayıcı algılandı, Popup akışı kullanılıyor');
        return auth.signInWithPopup(provider).catch(err => {
            console.error('[Firebase] Popup engellendi veya hata oluştu, redirect deneniyor...', err);
            return auth.signInWithRedirect(provider);
        });
    }
}

function signOutUser() {
    if (!auth) return;
    return auth.signOut();
}

function onAuthReady(callback) {
    if (!auth) { callback(null); return; }
    auth.onAuthStateChanged(callback);
}

// ============================================
// USER PROFILE
// ============================================
async function createOrGetUserProfile(user) {
    if (!db || !user) return null;
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
        // First login — create profile
        const profile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            nick: '',          // Will be set by user
            avatar: '🎬',
            joinDate: firebase.firestore.FieldValue.serverTimestamp(),
            totalWatched: 0,
        };
        await ref.set(profile);
        return { ...profile, isNew: true };
    }
    return { ...snap.data(), isNew: false };
}

async function updateUserProfile(uid, updates) {
    if (!db) return;
    await db.collection('users').doc(uid).update(updates);
}

async function getUserProfile(uid) {
    if (!db) return null;
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
}

// Check if nickname is taken
async function isNickTaken(nick) {
    if (!db) return false;
    const snap = await db.collection('users')
        .where('nick', '==', nick.toLowerCase()).limit(1).get();
    return !snap.empty;
}

// ============================================
// WATCH DATA SYNC
// ============================================
async function syncLocalToFirestore(uid) {
    if (!db) return;
    const watched = JSON.parse(localStorage.getItem('versewatch_watched') || '{}');
    const ratings = JSON.parse(localStorage.getItem('versewatch_ratings') || '{}');
    const comments = JSON.parse(localStorage.getItem('versewatch_comments') || '{}');
    const dates = JSON.parse(localStorage.getItem('versewatch_watch_dates') || '{}');

    const batch = db.batch();
    const watchRef = db.collection('users').doc(uid).collection('watchData');

    let watchCount = 0;
    for (const [itemId, isWatched] of Object.entries(watched)) {
        if (isWatched) {
            batch.set(watchRef.doc(itemId), {
                watched: true,
                rating: ratings[itemId] || null,
                comment: comments[itemId] || null,
                timestamp: dates[itemId] ? new Date(dates[itemId]) : firebase.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            watchCount++;
        }
    }

    // Update total count on user profile
    batch.update(db.collection('users').doc(uid), { totalWatched: watchCount });

    await batch.commit();
    console.log(`[Firebase] Synced ${watchCount} watched items ✓`);
}

async function saveWatchItem(uid, itemId, data) {
    if (!db || !uid) return;
    await db.collection('users').doc(uid).collection('watchData').doc(itemId).set(data, { merge: true });
    // Update total count
    const watched = JSON.parse(localStorage.getItem('versewatch_watched') || '{}');
    const total = Object.values(watched).filter(Boolean).length;
    await db.collection('users').doc(uid).update({ totalWatched: total });
}

async function removeWatchItem(uid, itemId) {
    if (!db || !uid) return;
    await db.collection('users').doc(uid).collection('watchData').doc(itemId).delete();
    const watched = JSON.parse(localStorage.getItem('versewatch_watched') || '{}');
    const total = Object.values(watched).filter(Boolean).length;
    await db.collection('users').doc(uid).update({ totalWatched: total });
}

// Save activity (last action) for friends to see
async function saveActivity(uid, title, action) {
    if (!db || !uid) return;
    await db.collection('users').doc(uid).update({
        lastActivity: {
            title,
            action, // 'watched' | 'rated' | 'added'
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }
    });
}

// ============================================
// FRIENDS SYSTEM
// ============================================
async function searchUserByNick(nick) {
    if (!db) return [];
    const snap = await db.collection('users')
        .where('nick', '==', nick.toLowerCase()).limit(5).get();
    return snap.docs.map(d => d.data());
}

async function sendFriendRequest(fromUid, toUid) {
    if (!db) return;
    const batch = db.batch();
    // Add to sender's friends as "pending"
    batch.set(
        db.collection('users').doc(fromUid).collection('friends').doc(toUid),
        { status: 'pending', direction: 'sent', since: firebase.firestore.FieldValue.serverTimestamp() }
    );
    // Add to receiver's friends as "incoming"
    batch.set(
        db.collection('users').doc(toUid).collection('friends').doc(fromUid),
        { status: 'pending', direction: 'received', since: firebase.firestore.FieldValue.serverTimestamp() }
    );
    await batch.commit();
}

async function acceptFriendRequest(myUid, fromUid) {
    if (!db) return;
    const batch = db.batch();
    batch.update(
        db.collection('users').doc(myUid).collection('friends').doc(fromUid),
        { status: 'accepted' }
    );
    batch.update(
        db.collection('users').doc(fromUid).collection('friends').doc(myUid),
        { status: 'accepted' }
    );
    await batch.commit();
}

async function getFriends(uid) {
    if (!db || !uid) return [];
    const snap = await db.collection('users').doc(uid).collection('friends')
        .where('status', '==', 'accepted').get();
    const friendUids = snap.docs.map(d => d.id);
    if (friendUids.length === 0) return [];

    const profiles = await Promise.all(friendUids.map(fuid => getUserProfile(fuid)));
    return profiles.filter(Boolean);
}

async function getPendingRequests(uid) {
    if (!db || !uid) return [];
    const snap = await db.collection('users').doc(uid).collection('friends')
        .where('status', '==', 'pending')
        .where('direction', '==', 'received').get();
    const uids = snap.docs.map(d => d.id);
    if (uids.length === 0) return [];
    const profiles = await Promise.all(uids.map(u => getUserProfile(u)));
    return profiles.filter(Boolean);
}

async function getFriendStatus(myUid, otherUid) {
    if (!db) return null;
    const snap = await db.collection('users').doc(myUid).collection('friends').doc(otherUid).get();
    return snap.exists ? snap.data() : null;
}

async function getFriendWatchData(uid) {
    if (!db || !uid) return {};
    const snap = await db.collection('users').doc(uid).collection('watchData')
        .orderBy('timestamp', 'desc').limit(20).get();
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    return result;
}

// ============================================
// LEADERBOARD
// ============================================
async function getLeaderboard(limit = 10) {
    if (!db) return [];
    const snap = await db.collection('users')
        .orderBy('totalWatched', 'desc').limit(limit).get();
    return snap.docs.map(d => d.data());
}
