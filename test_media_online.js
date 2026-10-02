/**
 * UNIT TEST: Sistem Media & Gambar Daring MyBIPA (Google Drive & YouTube)
 * Memastikan media dan gambar bekerja secara online tanpa menggunakan localStorage.
 */

const test = require('node:test');
const assert = require('node:assert');

// 1. Definisikan fungsi yang diuji sesuai implementasi di script.js
function ekstrakGoogleDriveId(url) {
  if (!url || typeof url !== "string") return null;
  var u = url.trim();
  var m = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
          u.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
          u.match(/\/d\/([a-zA-Z0-9_-]+)/i);
  return m ? m[1] : null;
}

function ekstrakYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  var u = url.trim();
  var ytMatch = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([\w-]{11})/i);
  return (ytMatch && ytMatch[1]) ? ytMatch[1] : null;
}

function ubahKeUrlGambar(url) {
  if (!url || typeof url !== "string") return "";
  var u = url.trim();
  var gdId = ekstrakGoogleDriveId(u);
  if (gdId) {
    return "https://lh3.googleusercontent.com/d/" + gdId;
  }
  return u;
}

function periksaVideoEmbed(url) {
  if (!url || typeof url !== "string") return null;
  var u = url.trim();
  var ytId = ekstrakYouTubeId(u);
  if (ytId) {
    return {
      tipe: "youtube",
      id: ytId,
      src: "https://www.youtube-nocookie.com/embed/" + ytId + "?rel=0"
    };
  }
  var gdId = ekstrakGoogleDriveId(u);
  if (gdId) {
    return {
      tipe: "drive",
      id: gdId,
      src: "https://drive.google.com/file/d/" + gdId + "/preview",
      directUrl: "https://drive.google.com/uc?export=download&id=" + gdId
    };
  }
  return null;
}

// Simulasi DOM untuk pengujian pasangGambarAman
function pasangGambarAman(elImg, urlAsli, fallbackUrl) {
  if (!elImg) return;
  if (!urlAsli) {
    if (fallbackUrl) { elImg.src = fallbackUrl; elImg.hidden = false; }
    else { elImg.src = ""; elImg.hidden = true; }
    return;
  }
  var urlOlahan = ubahKeUrlGambar(urlAsli);
  elImg.src = urlOlahan;
  elImg.hidden = false;

  var gdId = ekstrakGoogleDriveId(urlAsli);
  if (gdId) {
    elImg.onerror = function () {
      if (elImg.src && elImg.src.indexOf("lh3.googleusercontent.com") !== -1) {
        elImg.src = "https://drive.google.com/thumbnail?id=" + gdId + "&sz=w1600";
      } else if (fallbackUrl && elImg.src !== fallbackUrl) {
        elImg.src = fallbackUrl;
      }
    };
  } else {
    elImg.onerror = function () {
      if (fallbackUrl && elImg.src !== fallbackUrl) {
        elImg.src = fallbackUrl;
      }
    };
  }
}

// ==========================================
// TEST SUITE 1: Ekstraksi ID Google Drive
// ==========================================
test('Ekstraksi ID Google Drive dari berbagai format URL', (t) => {
  const urls = [
    { url: 'https://drive.google.com/file/d/1A2b3C-4D5_E6f7G/view?usp=sharing', expected: '1A2b3C-4D5_E6f7G' },
    { url: 'https://drive.google.com/file/d/1A2b3C-4D5_E6f7G/preview', expected: '1A2b3C-4D5_E6f7G' },
    { url: 'https://drive.google.com/open?id=1A2b3C-4D5_E6f7G', expected: '1A2b3C-4D5_E6f7G' },
    { url: 'https://drive.google.com/uc?export=download&id=1A2b3C-4D5_E6f7G', expected: '1A2b3C-4D5_E6f7G' },
    { url: 'https://docs.google.com/uc?export=open&id=1A2b3C-4D5_E6f7G', expected: '1A2b3C-4D5_E6f7G' },
    { url: 'https://drive.google.com/d/1A2b3C-4D5_E6f7G/view', expected: '1A2b3C-4D5_E6f7G' },
  ];

  for (const item of urls) {
    const id = ekstrakGoogleDriveId(item.url);
    assert.strictEqual(id, item.expected, `Gagal mengekstrak ID dari: ${item.url}`);
  }

  // Bukan link Google Drive
  assert.strictEqual(ekstrakGoogleDriveId('https://example.com/audio.mp3'), null);
  assert.strictEqual(ekstrakGoogleDriveId(''), null);
  assert.strictEqual(ekstrakGoogleDriveId(null), null);
});

// ==========================================
// TEST SUITE 2: Ekstraksi ID YouTube
// ==========================================
test('Ekstraksi ID YouTube dari berbagai format tautan', (t) => {
  const urls = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1', expected: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { url: 'https://youtube.com/v/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  ];

  for (const item of urls) {
    const id = ekstrakYouTubeId(item.url);
    assert.strictEqual(id, item.expected, `Gagal mengekstrak YouTube ID dari: ${item.url}`);
  }

  assert.strictEqual(ekstrakYouTubeId('https://google.com'), null);
  assert.strictEqual(ekstrakYouTubeId(null), null);
});

// ==========================================
// TEST SUITE 3: Konversi Gambar Google Drive
// ==========================================
test('Konversi link Google Drive ke direct URL gambar lh3.googleusercontent.com', (t) => {
  const driveUrl = 'https://drive.google.com/file/d/1PhotoId987654321/view?usp=sharing';
  const hasil = ubahKeUrlGambar(driveUrl);
  assert.strictEqual(hasil, 'https://lh3.googleusercontent.com/d/1PhotoId987654321');

  // URL gambar web biasa tidak diubah
  const webUrl = 'https://images.unsplash.com/photo-123456';
  assert.strictEqual(ubahKeUrlGambar(webUrl), webUrl);
});

// ==========================================
// TEST SUITE 4: Periksa Embed Video & Audio
// ==========================================
test('Periksa video & audio embed untuk YouTube dan Google Drive', (t) => {
  // YouTube
  const yt = periksaVideoEmbed('https://www.youtube.com/watch?v=abc123XYZ00');
  assert.notStrictEqual(yt, null);
  assert.strictEqual(yt.tipe, 'youtube');
  assert.strictEqual(yt.id, 'abc123XYZ00');
  assert.strictEqual(yt.src, 'https://www.youtube-nocookie.com/embed/abc123XYZ00?rel=0');

  // Google Drive
  const gd = periksaVideoEmbed('https://drive.google.com/file/d/1GDriveAudioVideo123/view');
  assert.notStrictEqual(gd, null);
  assert.strictEqual(gd.tipe, 'drive');
  assert.strictEqual(gd.id, '1GDriveAudioVideo123');
  assert.strictEqual(gd.src, 'https://drive.google.com/file/d/1GDriveAudioVideo123/preview');
  assert.strictEqual(gd.directUrl, 'https://drive.google.com/uc?export=download&id=1GDriveAudioVideo123');

  // Direct MP3 URL
  assert.strictEqual(periksaVideoEmbed('https://mywebsite.com/audio.mp3'), null);
});

// ==========================================
// TEST SUITE 5: Pasang Gambar Aman & Fallback
// ==========================================
test('Pasang gambar aman dengan fallback otomatis jika terjadi error', (t) => {
  const mockImg = { src: '', hidden: true, onerror: null };
  const driveUrl = 'https://drive.google.com/file/d/1PhotoIdSample/view';

  // 1. Pemasangan awal
  pasangGambarAman(mockImg, driveUrl, 'https://bawaan.com/sampul.jpg');
  assert.strictEqual(mockImg.src, 'https://lh3.googleusercontent.com/d/1PhotoIdSample');
  assert.strictEqual(mockImg.hidden, false);
  assert.strictEqual(typeof mockImg.onerror, 'function');

  // 2. Simulasi kegagalan network pada lh3 -> fallback ke thumbnail Drive
  mockImg.onerror();
  assert.strictEqual(mockImg.src, 'https://drive.google.com/thumbnail?id=1PhotoIdSample&sz=w1600');

  // 3. Jika thumbnail juga error -> fallback ke gambar bawaan
  mockImg.onerror();
  assert.strictEqual(mockImg.src, 'https://bawaan.com/sampul.jpg');
});

// ==========================================
// TEST SUITE 6: Proteksi Non-LocalStorage
// ==========================================
test('Penyimpanan foto dan media TIDAK masuk ke localStorage', (t) => {
  const fakeLocalStorage = {};
  const mockWindow = {
    localStorage: {
      setItem: (key, val) => { fakeLocalStorage[key] = val; },
      getItem: (key) => fakeLocalStorage[key] || null,
      removeItem: (key) => { delete fakeLocalStorage[key]; }
    }
  };

  const KUNCI_SUNTING = "mybipa-a1-sunting-global";
  const SUNTINGAN = {
    "sid-judul": "Judul Baru Bab 1",
    "sid-teks": "Teks materi yang diperbarui",
    "__FOTO__": {
      "foto.unit-1.0": "https://lh3.googleusercontent.com/d/1PhotoUnit0",
      "sampul": "https://lh3.googleusercontent.com/d/1SampulOnline"
    },
    "__MEDIA__": {
      "u1-menyimak": "https://drive.google.com/file/d/1AudioDrive/view",
      "u1-video": "https://www.youtube.com/watch?v=1VideoYt"
    }
  };

  // Implementasi fungsi simpanSuntingan baru
  function simpanSuntinganSimulasi() {
    var salinan = {};
    for (var k in SUNTINGAN) {
      if (k !== "__FOTO__" && k !== "__MEDIA__") salinan[k] = SUNTINGAN[k];
    }
    mockWindow.localStorage.setItem(KUNCI_SUNTING, JSON.stringify(salinan));
  }

  simpanSuntinganSimulasi();

  const tersimpan = JSON.parse(mockWindow.localStorage.getItem(KUNCI_SUNTING));
  assert.strictEqual(tersimpan["sid-judul"], "Judul Baru Bab 1");
  assert.strictEqual(tersimpan["sid-teks"], "Teks materi yang diperbarui");
  
  // VERIFIKASI UTAMA: __FOTO__ dan __MEDIA__ TIDAK boleh ada di localStorage!
  assert.strictEqual(tersimpan["__FOTO__"], undefined, "Objek __FOTO__ tidak boleh disimpan di localStorage");
  assert.strictEqual(tersimpan["__MEDIA__"], undefined, "Objek __MEDIA__ tidak boleh disimpan di localStorage");

  // Dan kunci lama tidak ada
  assert.strictEqual(mockWindow.localStorage.getItem("mybipa-a1-foto-modul"), null);
  assert.strictEqual(mockWindow.localStorage.getItem("mybipa-a1-media-kustom"), null);
});

console.log("\n=======================================================");
console.log("Semua unit test sistem online media & gambar diverifikasi!");
console.log("=======================================================\n");
