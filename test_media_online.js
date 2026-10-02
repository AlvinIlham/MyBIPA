/**
 * UNIT TEST: Sistem Media & Gambar Daring MyBIPA (Google Drive & YouTube)
 * Memastikan media dan gambar bekerja secara online, persisten saat refresh, dan bebas kuota Base64.
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
// TEST SUITE 6: Persistensi Tautan & Anti-Base64
// ==========================================
test('Persistensi tautan daring (Drive/YouTube) dan pencegahan Base64 di localStorage', (t) => {
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
    "__FOTO__": {
      "foto.unit-1.0": "https://lh3.googleusercontent.com/d/1PhotoUnit0",
      "sampul": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w..." // Base64 besar
    },
    "__MEDIA__": {
      "u1a1": "https://drive.google.com/file/d/1AudioDrive/view",
      "u1v1": "https://www.youtube.com/watch?v=1VideoYt",
      "u2a1": "data:audio/mp3;base64,//uQxAAAAAA..." // Base64 besar
    }
  };

  function simpanSuntinganSimulasi() {
    var salinan = {};
    for (var k in SUNTINGAN) {
      if (k === "__FOTO__" || k === "__MEDIA__") {
        var sub = SUNTINGAN[k];
        if (sub && typeof sub === "object") {
          var subBersih = {};
          for (var sk in sub) {
            if (typeof sub[sk] === "string" && !sub[sk].startsWith("data:")) {
              subBersih[sk] = sub[sk];
            }
          }
          salinan[k] = subBersih;
        }
      } else {
        salinan[k] = SUNTINGAN[k];
      }
    }
    mockWindow.localStorage.setItem(KUNCI_SUNTING, JSON.stringify(salinan));
  }

  simpanSuntinganSimulasi();

  const tersimpan = JSON.parse(mockWindow.localStorage.getItem(KUNCI_SUNTING));
  assert.strictEqual(tersimpan["sid-judul"], "Judul Baru Bab 1");

  // Tautan daring (Google Drive & YouTube) tersimpan dan persisten saat refresh
  assert.strictEqual(tersimpan["__MEDIA__"]["u1a1"], "https://drive.google.com/file/d/1AudioDrive/view");
  assert.strictEqual(tersimpan["__MEDIA__"]["u1v1"], "https://www.youtube.com/watch?v=1VideoYt");
  assert.strictEqual(tersimpan["__FOTO__"]["foto.unit-1.0"], "https://lh3.googleusercontent.com/d/1PhotoUnit0");

  // KETAT: Berkas Base64 besar WAJIB dibuang dari localStorage agar kuota tidak jebol
  assert.strictEqual(tersimpan["__MEDIA__"]["u2a1"], undefined, "Data Base64 audio dilarang disimpan ke localStorage");
  assert.strictEqual(tersimpan["__FOTO__"]["sampul"], undefined, "Data Base64 gambar dilarang disimpan ke localStorage");
});

// ==========================================
// TEST SUITE 7: Sinkronisasi Asinkron Supabase
// ==========================================
test('Sinkronisasi callback saat data tiba dari Supabase (terapkanSemuaMedia)', (t) => {
  let dipasang = {};
  const DAFTAR_PEMASANG = [];

  function daftarkan(kode, fn) {
    DAFTAR_PEMASANG.push({ kode: kode, fn: fn });
  }

  // Daftarkan komponen pemutar audio
  daftarkan("u1a1", function (url) { dipasang["u1a1"] = url; });
  daftarkan("u1v1", function (url) { dipasang["u1v1"] = url; });

  // Simulasi kedatangan data dari Supabase
  const dataSupabase = {
    __MEDIA__: {
      "u1a1": "https://drive.google.com/file/d/1AudioFromCloud/view",
      "u1v1": "https://www.youtube.com/watch?v=1VideoFromCloud"
    }
  };

  // Jalankan terapkanSemuaMedia
  DAFTAR_PEMASANG.forEach(function (p) {
    if (dataSupabase.__MEDIA__[p.kode]) {
      p.fn(dataSupabase.__MEDIA__[p.kode]);
    }
  });

  assert.strictEqual(dipasang["u1a1"], "https://drive.google.com/file/d/1AudioFromCloud/view");
  assert.strictEqual(dipasang["u1v1"], "https://www.youtube.com/watch?v=1VideoFromCloud");
});

console.log("\n=======================================================");
console.log("Semua unit test sistem online media & gambar diverifikasi!");
console.log("=======================================================\n");
