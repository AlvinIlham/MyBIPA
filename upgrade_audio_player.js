const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'script.js');
let content = fs.readFileSync(filePath, 'utf8');

function norm(str) {
  return str.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
}

// 1. Add bangunPemutarAudioKustom right above buatMedia
const helperCode = norm(`  /* ---------- Pembangun Pemutar Audio Mewah Berbalut Emas Minangkabau ---------- */
  function bangunPemutarAudioKustom(wadahPemutar) {
    var bungkus = E("div", "pemutar-kustom");
    var audio = document.createElement("audio");
    audio.className = "audio-inti";
    audio.preload = "metadata";
    bungkus.appendChild(audio);

    var baris = E("div", "pemutar-baris-utama");

    // 1. Tombol Putar / Jeda
    var btnPlay = E("button", "tbl-putar");
    btnPlay.type = "button";
    btnPlay.setAttribute("aria-label", "Putar audio");
    btnPlay.innerHTML = '<svg class="ikon-play" viewBox="0 0 24 24"><polygon points="7,5 19,12 7,19"/></svg>' +
      '<svg class="ikon-pause" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';

    // 2. Tombol Lompat -5s & +5s
    var btnMundur = E("button", "tbl-lompat mundur");
    btnMundur.type = "button";
    btnMundur.title = "Mundur 5 detik";
    btnMundur.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.2 3.16-1.98 5.12-1.98 3.89 0 7.14 2.78 7.82 6.43l2.43-.5C21.84 12.16 17.65 8 12.5 8z" fill="currentColor"/><text x="12" y="16" font-size="7" font-weight="bold" text-anchor="middle" fill="currentColor">5</text></svg>';

    var btnMaju = E("button", "tbl-lompat maju");
    btnMaju.type = "button";
    btnMaju.title = "Maju 5 detik";
    btnMaju.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11.5 8c2.65 0 5.05 1 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.2-3.16-1.98-5.12-1.98-3.89 0-7.14 2.78-7.82 6.43l-2.43-.5C2.16 12.16 6.35 8 11.5 8z" fill="currentColor"/><text x="12" y="16" font-size="7" font-weight="bold" text-anchor="middle" fill="currentColor">5</text></svg>';

    // 3. Linimasa Waktu & Rel Kemajuan
    var linimasa = E("div", "pemutar-linimasa");
    var relWaktu = E("div", "pemutar-rel-waktu");
    var teksKini = E("span", "waktu-kini", "00:00");
    var rel = E("div", "rel-kemajuan");
    var relIsi = E("div", "rel-isi");
    var relPegangan = E("div", "rel-pegangan");
    relIsi.appendChild(relPegangan);
    rel.appendChild(relIsi);
    var teksTotal = E("span", "waktu-total", "00:00");

    relWaktu.appendChild(teksKini);
    relWaktu.appendChild(rel);
    relWaktu.appendChild(teksTotal);
    linimasa.appendChild(relWaktu);

    // 4. Tombol Kecepatan
    var daftarKec = [1, 1.25, 1.5, 0.75];
    var idxKec = 0;
    var btnKec = E("button", "tbl-kecepatan", "1x");
    btnKec.type = "button";
    btnKec.title = "Atur kecepatan putar (bagus untuk latihan menyimak)";

    // 5. Volume
    var wadahVol = E("div", "wadah-volume");
    var btnVol = E("button", "tbl-volume");
    btnVol.type = "button";
    btnVol.title = "Bisukan / Bunyikan";
    btnVol.innerHTML = '<svg class="ikon-vol" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/></svg>';
    var sliderVol = document.createElement("input");
    sliderVol.type = "range";
    sliderVol.className = "slider-volume";
    sliderVol.min = "0"; sliderVol.max = "1"; sliderVol.step = "0.05"; sliderVol.value = "1";
    wadahVol.appendChild(btnVol);
    wadahVol.appendChild(sliderVol);

    baris.appendChild(btnPlay);
    baris.appendChild(btnMundur);
    baris.appendChild(btnMaju);
    baris.appendChild(linimasa);
    baris.appendChild(btnKec);
    baris.appendChild(wadahVol);
    bungkus.appendChild(baris);

    // 6. Animasi Gelombang Suara
    var gelombang = E("div", "efek-gelombang");
    for (var g = 0; g < 8; g++) gelombang.appendChild(document.createElement("span"));
    bungkus.appendChild(gelombang);

    function formatWaktu(dtk) {
      if (isNaN(dtk) || dtk < 0) return "00:00";
      var m = Math.floor(dtk / 60);
      var s = Math.floor(dtk % 60);
      return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }

    btnPlay.addEventListener("click", function () {
      if (audio.paused) {
        document.querySelectorAll("audio").forEach(function (a) {
          if (a !== audio) try { a.pause(); } catch (e) { }
        });
        audio.play().catch(function () { });
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", function () { bungkus.classList.add("memutar"); });
    audio.addEventListener("pause", function () { bungkus.classList.remove("memutar"); });
    audio.addEventListener("ended", function () {
      bungkus.classList.remove("memutar");
      relIsi.style.width = "0%";
      teksKini.textContent = "00:00";
    });

    audio.addEventListener("timeupdate", function () {
      if (!audio.duration) return;
      var persen = (audio.currentTime / audio.duration) * 100;
      relIsi.style.width = persen + "%";
      teksKini.textContent = formatWaktu(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", function () {
      teksTotal.textContent = formatWaktu(audio.duration);
    });

    function lompatWaktu(ev) {
      var rect = rel.getBoundingClientRect();
      var x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
      var targetPersen = x / rect.width;
      if (audio.duration) {
        audio.currentTime = targetPersen * audio.duration;
      }
    }
    rel.addEventListener("click", lompatWaktu);

    btnMundur.addEventListener("click", function () {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    });
    btnMaju.addEventListener("click", function () {
      if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    });

    btnKec.addEventListener("click", function () {
      idxKec = (idxKec + 1) % daftarKec.length;
      var kec = daftarKec[idxKec];
      audio.playbackRate = kec;
      btnKec.textContent = kec + "x";
    });

    sliderVol.addEventListener("input", function () {
      audio.volume = parseFloat(sliderVol.value);
      audio.muted = (audio.volume === 0);
    });
    btnVol.addEventListener("click", function () {
      audio.muted = !audio.muted;
      sliderVol.value = audio.muted ? 0 : audio.volume;
    });

    wadahPemutar.appendChild(bungkus);

    return {
      audio: audio,
      bungkus: bungkus,
      setSumber: function (url, fallbackEmbedUrl) {
        audio.src = url;
        audio.load();
        if (fallbackEmbedUrl) {
          audio.onerror = function () {
            // Jika direct stream dibatasi, beralih ke preview iframe
            bungkus.style.display = "none";
            var ifrFallback = wadahPemutar.querySelector("iframe.media-embed");
            if (!ifrFallback) {
              ifrFallback = document.createElement("iframe");
              ifrFallback.className = "audio-embed media-embed";
              ifrFallback.setAttribute("allowfullscreen", "");
              ifrFallback.setAttribute("allow", "autoplay");
              wadahPemutar.appendChild(ifrFallback);
            }
            ifrFallback.src = fallbackEmbedUrl;
            ifrFallback.style.display = "block";
          };
        }
      }
    };
  }

  /* ---------- kotak media ---------- */`);

const targetHead = norm(`  /* ---------- kotak media ---------- */`);
if (content.includes(targetHead)) {
  content = content.replace(targetHead, helperCode);
  console.log('1. Helper bangunPemutarAudioKustom added.');
} else {
  console.error('Target head not found!');
  process.exit(1);
}

// 2. Now replace buatMedia body to use the new custom audio player
const startMarker = norm(`  function buatMedia(b, hal) {
    var jenisVideo = (b.j === "video");
    var kotak = E("div", "media");
    var alamat = (MEDIA_KUSTOM && MEDIA_KUSTOM[b.kode]) || MEDIA[b.kode] || ("media/" + b.kode + (jenisVideo ? ".mp4" : ".mp3"));
    kotak.innerHTML =
      '<div class="kop"><span class="kode">' + (jenisVideo ? "VIDEO" : "AUDIO") + " · " + b.kode.toUpperCase() +
      '</span><span class="durasi">' + (b.durasi || "") + "</span></div>" +
      "<h4>" + b.judul + "</h4>" +
      (b.ket ? "<p>" + b.ket + "</p>" : "");

    var wadahPemutar = E("div", "wadah-pemutar");
    var pemutar = document.createElement(jenisVideo ? "video" : "audio");
    pemutar.controls = true; pemutar.preload = "none";
    if (jenisVideo) pemutar.setAttribute("playsinline", "");
    wadahPemutar.appendChild(pemutar);
    kotak.appendChild(wadahPemutar);

    var kaki = E("div", "kaki");
    var nama = E("span", "badge-status");`);

const endMarker = norm(`    kotak.appendChild(E("div", "cetak-saja",
      (jenisVideo ? "VIDEO" : "AUDIO") + " — " + alamat + (b.durasi ? " (" + b.durasi + ")" : "") + ". Putar dari perangkat pengajar."));
    return kotak;
  }`);

const sIdx = content.indexOf(startMarker);
const eIdx = content.indexOf(endMarker);

console.log('sIdx:', sIdx, 'eIdx:', eIdx);
if (sIdx === -1 || eIdx === -1) {
  console.error('buatMedia body markers not found!');
  process.exit(1);
}

const newBuatMediaBody = norm(`  function buatMedia(b, hal) {
    var jenisVideo = (b.j === "video");
    var kotak = E("div", "media");
    var alamat = (MEDIA_KUSTOM && MEDIA_KUSTOM[b.kode]) || MEDIA[b.kode] || ("media/" + b.kode + (jenisVideo ? ".mp4" : ".mp3"));
    kotak.innerHTML =
      '<div class="kop"><span class="kode">' + (jenisVideo ? "VIDEO" : "AUDIO") + " · " + b.kode.toUpperCase() +
      '</span><span class="durasi">' + (b.durasi || "") + "</span></div>" +
      "<h4>" + b.judul + "</h4>" +
      (b.ket ? "<p>" + b.ket + "</p>" : "");

    var wadahPemutar = E("div", "wadah-pemutar");
    var pemutarVideo = null;
    var pemutarAudioKustom = null;

    if (jenisVideo) {
      pemutarVideo = document.createElement("video");
      pemutarVideo.controls = true;
      pemutarVideo.preload = "none";
      pemutarVideo.setAttribute("playsinline", "");
      wadahPemutar.appendChild(pemutarVideo);
    } else {
      pemutarAudioKustom = bangunPemutarAudioKustom(wadahPemutar);
    }
    kotak.appendChild(wadahPemutar);

    var kaki = E("div", "kaki");
    var nama = E("span", "badge-status");

    function pasangSumberMedia(url) {
      var embed = periksaVideoEmbed(url);

      if (jenisVideo) {
        /* PENGELOLAAN VIDEO */
        if (embed) {
          if (pemutarVideo) {
            pemutarVideo.style.display = "none";
            pemutarVideo.removeAttribute("src");
            try { pemutarVideo.pause(); } catch (e) { }
          }
          var ifrV = wadahPemutar.querySelector("iframe.video-embed");
          if (!ifrV) {
            ifrV = document.createElement("iframe");
            ifrV.className = "video-embed media-embed";
            ifrV.setAttribute("allowfullscreen", "");
            ifrV.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
            wadahPemutar.appendChild(ifrV);
          }
          ifrV.src = embed.src;
          ifrV.style.display = "block";
          nama.innerHTML = '<span class="titik"></span> ' + (embed.tipe === "youtube" ? "YouTube" : "Google Drive");
        } else {
          var ifrSisaV = wadahPemutar.querySelector("iframe.video-embed");
          if (ifrSisaV) { ifrSisaV.src = ""; ifrSisaV.style.display = "none"; }
          if (pemutarVideo) {
            pemutarVideo.style.display = "block";
            pemutarVideo.src = url;
            pemutarVideo.load();
          }
          nama.innerHTML = (MEDIA_KUSTOM && MEDIA_KUSTOM[b.kode]) ?
            '<span class="titik"></span> Video Kustom' :
            '<span class="titik" style="background:#d9a441;box-shadow:0 0 6px #d9a441"></span> Video Bawaan';
        }
      } else {
        /* PENGELOLAAN AUDIO (PEMUTAR MEWAH EMAS) */
        var ifrAudio = wadahPemutar.querySelector("iframe.media-embed");
        if (ifrAudio) { ifrAudio.src = ""; ifrAudio.style.display = "none"; }

        if (embed && embed.tipe === "youtube") {
          // YouTube Audio: tampilkan iframe player
          if (pemutarAudioKustom) pemutarAudioKustom.bungkus.style.display = "none";
          var ifrYt = wadahPemutar.querySelector("iframe.media-embed");
          if (!ifrYt) {
            ifrYt = document.createElement("iframe");
            ifrYt.className = "video-embed media-embed";
            ifrYt.setAttribute("allowfullscreen", "");
            ifrYt.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
            wadahPemutar.appendChild(ifrYt);
          }
          ifrYt.src = embed.src;
          ifrYt.style.display = "block";
          nama.innerHTML = '<span class="titik"></span> YouTube';

        } else if (embed && embed.tipe === "drive") {
          // Google Drive Audio: Putar langsung di Pemutar Kustom Mewah via stream resmi
          if (pemutarAudioKustom) {
            pemutarAudioKustom.bungkus.style.display = "block";
            var streamUrl = "https://drive.usercontent.google.com/download?id=" + embed.id + "&export=download";
            pemutarAudioKustom.setSumber(streamUrl, embed.src);
          }
          nama.innerHTML = '<span class="titik"></span> Google Drive';

        } else {
          // Berkas audio langsung (MP3 daring atau berkas bawaan)
          if (pemutarAudioKustom) {
            pemutarAudioKustom.bungkus.style.display = "block";
            pemutarAudioKustom.setSumber(url);
          }
          nama.innerHTML = (MEDIA_KUSTOM && MEDIA_KUSTOM[b.kode]) ?
            '<span class="titik"></span> Audio Kustom' :
            '<span class="titik" style="background:#d9a441;box-shadow:0 0 6px #d9a441"></span> Berkas Bawaan';
        }
      }

      if (btnReset) {
        btnReset.style.display = (MEDIA_KUSTOM && MEDIA_KUSTOM[b.kode]) ? "inline-flex" : "none";
      }
    }

    var btnLink = null;
    var btnReset = null;

    if (ADMIN) {
      var grupAdmin = E("div", "grup-tombol-admin");

      btnLink = E("button", "tbl-admin-link", jenisVideo ? "🔗 Ganti Video (Drive / YouTube)" : "🔗 Ganti Audio (Drive / YouTube)");
      btnLink.type = "button";
      btnLink.title = "Atur tautan Google Drive atau YouTube";
      btnLink.addEventListener("click", function () {
        var skrg = MEDIA_KUSTOM[b.kode] || alamat;
        var pesan = "ATUR TAUTAN " + (jenisVideo ? "VIDEO" : "AUDIO") + " (" + b.kode.toUpperCase() + "):\\n\\n" +
          "• Tautan YouTube (contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/...)\\n" +
          "• Tautan Google Drive (contoh: https://drive.google.com/file/d/.../view)\\n" +
          "• Atau tautan berkas daring langsung (.mp3 / .mp4)\\n\\n" +
          "Catatan: Disimpan secara online ke basis data Supabase (bebas kuota localStorage).\\n\\n" +
          "Tautan saat ini: " + skrg;
        var masukkan = window.prompt(pesan, (MEDIA_KUSTOM[b.kode] || ""));
        if (masukkan === null) return;
        var teks = masukkan.trim();
        if (teks) {
          MEDIA_KUSTOM[b.kode] = teks;
          pasangSumberMedia(teks);
          simpanMediaKustom(function (ok, err) {
            if (ok) {
              window.alert((jenisVideo ? "Tautan video" : "Tautan audio") + " berhasil disimpan ke Supabase!");
            } else {
              window.alert("Gagal menyimpan ke Supabase: " + (err || "error"));
            }
          });
        }
      });

      btnReset = E("button", "tbl-admin-reset", "↺ Bawaan");
      btnReset.type = "button";
      btnReset.title = "Hapus media kustom dan kembali ke berkas awal";
      btnReset.style.display = (MEDIA_KUSTOM && MEDIA_KUSTOM[b.kode]) ? "inline-flex" : "none";
      btnReset.addEventListener("click", function () {
        if (window.confirm("Hapus media kustom dan kembalikan ke berkas bawaan?")) {
          delete MEDIA_KUSTOM[b.kode];
          var asal = MEDIA[b.kode] || ("media/" + b.kode + (jenisVideo ? ".mp4" : ".mp3"));
          pasangSumberMedia(asal);
          simpanMediaKustom(function () {
            window.alert("Media dikembalikan ke berkas bawaan modul.");
          });
        }
      });

      grupAdmin.appendChild(btnLink);
      grupAdmin.appendChild(btnReset);
      kaki.appendChild(grupAdmin);
    }

    kaki.appendChild(nama);
    kotak.appendChild(kaki);

    /* Pasang sumber awal dan daftarkan pembaruan otomatis saat data Supabase tiba */
    pasangSumberMedia(alamat);
    daftarkanPemasangMedia(b.kode, function (urlBaru) {
      pasangSumberMedia(urlBaru);
    });

`);

content = content.slice(0, sIdx) + newBuatMediaBody + content.slice(eIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Custom luxury audio player successfully integrated into buatMedia!');
