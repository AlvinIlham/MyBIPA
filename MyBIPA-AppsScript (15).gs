/**
 * MyBIPA — Penghubung modul digital dengan MYBIPA_DATABASE
 * =====================================================================
 * Skrip ini menuliskan kegiatan pemelajar, pengajar, dan admin ke berkas
 * MYBIPA_DATABASE, mengikuti susunan lembar yang sudah ada:
 *
 *   Lembar Pemelajar : No | Nama Pemelajar | Asal/Negara | Tingkatan |
 *                      Unit 1 … Unit 11 | Nilai Akhir
 *                      ditambah kolom baru di sebelah kanannya:
 *                      Surel | WhatsApp | Pengajar | Predikat |
 *                      Unit Tuntas | Diperbarui | Data Lengkap
 *   Lembar Pengajar  : ID Guru | Kode Tingkat | Tingkat BIPA |
 *                      Nama Pengajar | Email Login | Password* |
 *                      Role | Status Akun
 *   Lembar Aktivitas : dibuat sendiri oleh skrip, mencatat pendaftaran,
 *                      masuk akun, dan penuntasan unit.
 *
 * ---------------------------------------------------------------------
 * CARA MEMASANG
 *   1. Unggah MYBIPA_DATABASE.xlsx ke Google Drive, buka berkasnya, lalu
 *      pilih File > Simpan sebagai Google Spreadsheet. Apps Script hanya
 *      dapat menulis ke Google Spreadsheet, bukan ke berkas .xlsx.
 *   2. Salin ID berkas hasil penyimpanan dari alamatnya:
 *      docs.google.com/spreadsheets/d/<ID-INI>/edit
 *      lalu tempelkan pada ID_SPREADSHEET di bawah.
 *   3. Buka script.google.com, buat proyek baru, tempelkan seluruh berkas ini.
 *   4. Jalankan fungsi ujiSambungan sekali untuk memastikan lembar terbaca.
 *   5. Deploy > New deployment > Web app.
 *        Execute as     : Me
 *        Who has access : Anyone
 *   6. Salin alamat yang berakhiran /exec, tempelkan pada baris
 *      var URL_SINKRON = "";  di dalam berkas modul HTML.
 * =====================================================================
 */

/* ============================ PENGATURAN ============================ */

/* Berkas MYBIPA_DATABASE milik Anda:
   https://docs.google.com/spreadsheets/d/1wURIPGZ7jZwNJhAD8Jq_VmRMunvwIjl_TJWacII9bm8/edit */
var ID_SPREADSHEET = '1wURIPGZ7jZwNJhAD8Jq_VmRMunvwIjl_TJWacII9bm8';

var TINGKAT_MODUL = 'A1';     // tingkat bawaan bila modul tidak menyertakan tingkatan
var KODE_TINGKAT  = 'P001';   // P001=A1, P002=A2, P003=B1, P004=B2, P005=C1, P006=C2
var JUMLAH_UNIT   = 11;       // jumlah unit per modul

function kodeTingkat(t) {
  var s = String(t || '').trim().toUpperCase();
  var peta = { 'A1': 'P001', 'A2': 'P002', 'B1': 'P003', 'B2': 'P004', 'C1': 'P005', 'C2': 'P006' };
  return peta[s] || 'P001';
}

var SUREL_MYBIPA = 'mybipa3@gmail.com';
var SUREL_ADMIN  = 'sukmaradi333@gmail.com';
var SUREL_ADMIN_PER_TINGKAT = {
  'A1': 'sukmaradi333@gmail.com',   // Admin A1 & A2 (Pak Radi Sukma)
  'A2': 'sukmaradi333@gmail.com',
  'B1': 'rahmazilla447@gmail.com',  // Admin B1 & B2 (Bu Azilla Rahma)
  'B2': 'rahmazilla447@gmail.com',
  'C1': 'putriapikasari29@gmail.com', // Admin C1 & C2 (Bu Putri Apika Sari)
  'C2': 'putriapikasari29@gmail.com'
};

function ambilSurelAdmin(tingkat) {
  var t = String(tingkat || '').trim().toUpperCase();
  return SUREL_ADMIN_PER_TINGKAT[t] || SUREL_ADMIN;
}

var KIRIM_SUREL  = true;      // ubah ke false bila pemberitahuan surel tidak diperlukan

var LEMBAR_PEMELAJAR = 'Pemelajar';
var LEMBAR_PENGAJAR  = 'Pengajar';
var LEMBAR_AKTIVITAS = 'Aktivitas';
var LEMBAR_AKUN      = 'Akun';

var KOLOM_TAMBAHAN = ['Surel', 'WhatsApp', 'Pengajar', 'Predikat',
                      'Unit Tuntas', 'Diperbarui', 'Data Lengkap', 'Kata Sandi'];

/* ============================ PEMBANTU ============================== */

function berkas() {
  return SpreadsheetApp.openById(ID_SPREADSHEET);
}

function rapi(t) {
  return String(t === null || t === undefined ? '' : t).toLowerCase().replace(/\s+/g, ' ').trim();
}

function predikat(x) {
  x = Number(x) || 0;
  if (x >= 81) return 'Sangat Baik';
  if (x >= 71) return 'Baik';
  if (x >= 60) return 'Cukup';
  return 'Belum Memenuhi';
}

/** Mencari baris judul kolom pada sebuah lembar berdasarkan kata kunci. */
function barisJudul(lembar, kunci) {
  var batas = Math.min(lembar.getLastRow(), 12);
  if (batas < 1) return 0;
  var isi = lembar.getRange(1, 1, batas, Math.max(lembar.getLastColumn(), 1)).getValues();
  for (var i = 0; i < isi.length; i++) {
    for (var j = 0; j < isi[i].length; j++) {
      if (rapi(isi[i][j]) === kunci) return i + 1;
    }
  }
  return 0;
}

/** Lembar Pemelajar beserta letak setiap kolomnya. */
function siapkanLembarPemelajar() {
  var b = berkas();
  var lembar = b.getSheetByName(LEMBAR_PEMELAJAR);
  if (!lembar) lembar = b.insertSheet(LEMBAR_PEMELAJAR);
  if (!barisJudul(lembar, 'no')) {
    var kepala = ['No', 'Nama Pemelajar', 'Asal/Negara', 'Tingkatan'];
    for (var u = 1; u <= 11; u++) kepala.push('Unit ' + u);
    kepala.push('Nilai Akhir');
    lembar.getRange(1, 1, 1, kepala.length).setValues([kepala]).setFontWeight('bold');
    lembar.setFrozenRows(1);
    SpreadsheetApp.flush();
  }
  return lembar;
}

function petaPemelajar() {
  var lembar = siapkanLembarPemelajar();
  var judul = barisJudul(lembar, 'no');
  if (!judul) throw new Error('Baris judul pada lembar Pemelajar tidak ditemukan.');

  var lebar = Math.max(lembar.getLastColumn(), 16 + KOLOM_TAMBAHAN.length);
  var kepala = lembar.getRange(judul, 1, 1, lebar).getValues()[0];

  var kolom = {};
  var akhir = 16;
  for (var k = 0; k < kepala.length; k++) {
    var t = rapi(kepala[k]);
    if (t) kolom[t] = k + 1;
    if (t === 'nilai akhir') akhir = k + 1;
  }

  var berubah = false;
  for (var i = 0; i < KOLOM_TAMBAHAN.length; i++) {
    var nama = KOLOM_TAMBAHAN[i];
    var kunci = rapi(nama);
    if (!kolom[kunci]) {
      var pos = akhir + 1 + i;
      lembar.getRange(judul, pos).setValue(nama).setFontWeight('bold');
      kolom[kunci] = pos;
      berubah = true;
    }
  }
  if (berubah) SpreadsheetApp.flush();

  return { lembar: lembar, judul: judul, kolom: kolom, awalData: judul + 1 };
}

function lembarAktivitas() {
  var b = berkas();
  var lembar = b.getSheetByName(LEMBAR_AKTIVITAS);
  if (!lembar) {
    lembar = b.insertSheet(LEMBAR_AKTIVITAS);
    lembar.appendRow(['Waktu', 'Nama', 'Surel', 'Peran', 'Tingkat', 'Pengajar',
                      'Kegiatan', 'Unit Tuntas', 'Nilai Akhir']);
    lembar.setFrozenRows(1);
    lembar.getRange(1, 1, 1, 9).setFontWeight('bold');
  }
  return lembar;
}

/* ============================ PENERIMA ============================== */

function doPost(e) {
  var jawab;
  try {
    var data = JSON.parse(e.postData.contents);
    var aksi = data.aksi || 'simpan';
    var tingkat = String(data.tingkat || (data.penuh && data.penuh.tingkat) || TINGKAT_MODUL).trim().toUpperCase();
    if (aksi === 'ambil') {
      jawab = { ok: true, data: ambilPemelajar(data.surel, tingkat) };
    } else if (aksi === 'kelas') {
      jawab = { ok: true, data: ambilKelas(data.dosen || '', tingkat) };
    } else if (aksi === 'masuk') {
      jawab = verifikasiMasuk(data.identitas || data.nama || data.surel || '', data.sandi || '', tingkat);
    } else {
      simpan(data);
      jawab = { ok: true };
    }
  } catch (galat) {
    jawab = { ok: false, pesan: String(galat) };
  }
  return ContentService.createTextOutput(JSON.stringify(jawab))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var par = (e && e.parameter) ? e.parameter : {};
  var jawab;
  var tingkat = String(par.tingkat || TINGKAT_MODUL).trim().toUpperCase();
  try {
    if (par.aksi === 'kelas') {
      jawab = { ok: true, data: ambilKelas(par.dosen || '', tingkat) };
    } else if (par.aksi === 'masuk') {
      jawab = verifikasiMasuk(par.identitas || par.nama || par.surel || '', par.sandi || '', tingkat);
    } else if (par.aksi === 'simpan') {
      /* penyimpanan lewat doGet, dipakai bila pengiriman POST terhalang peramban */
      var dataObj = JSON.parse(par.data || '{}');
      if (!dataObj.tingkat && par.tingkat) dataObj.tingkat = par.tingkat;
      simpan(dataObj);
      jawab = { ok: true };
    } else if (par.surel) {
      jawab = { ok: true, data: ambilPemelajar(par.surel, tingkat) };
    } else {
      jawab = { ok: true, pesan: 'MyBIPA ' + tingkat + ' siap menerima data.' };
    }
  } catch (galat) {
    jawab = { ok: false, pesan: String(galat) };
  }
  /* Bila modul meminta dengan cara JSONP, jawaban dibungkus nama fungsi.
     Cara ini tidak tunduk pada pembatasan lintas alamat pada peramban,
     sehingga jawaban selalu dapat dibaca modul. */
  if (par.callback) {
    return ContentService
      .createTextOutput(par.callback + '(' + JSON.stringify(jawab) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(jawab))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================ PENYIMPAN ============================= */

function simpan(data) {
  var peran = rapi(data.peran) || 'pemelajar';
  if (peran === 'pengajar') simpanPengajar(data);
  else if (peran !== 'admin') simpanPemelajar(data);
  simpanAkun(data);
  catat(data, peran);
}

function simpanAkun(data) {
  var b = berkas();
  var lembar = b.getSheetByName(LEMBAR_AKUN);
  if (!lembar) return;

  var surel = rapi(data.surel);
  if (!surel) return;

  var akhir = lembar.getLastRow();
  var baris = 0;
  if (akhir >= 2) {
    var daftarSurel = lembar.getRange(2, 1, akhir - 1, 1).getValues();
    for (var i = 0; i < daftarSurel.length; i++) {
      if (rapi(daftarSurel[i][0]) === surel) {
        baris = 2 + i;
        break;
      }
    }
  }
  if (!baris) baris = Math.max(akhir + 1, 2);

  var dibuatLama = (baris <= akhir && lembar.getRange(baris, 8).getValue()) || '';
  var sandiLama = (baris <= akhir && lembar.getRange(baris, 3).getValue()) || '';
  var sandiSimpan = data.sandi || sandiLama || '';

  lembar.getRange(baris, 1, 1, 9).setValues([[
    data.surel || '',
    data.nama || '',
    sandiSimpan,
    data.peran || 'pemelajar',
    data.wa || '-',
    data.instansi || '',
    data.dosen || '',
    dibuatLama || new Date(),
    new Date()
  ]]);
}

function simpanPemelajar(data) {
  var p = petaPemelajar();
  var lembar = p.lembar, kolom = p.kolom;
  var surel = rapi(data.surel);
  var tingkatData = String(data.tingkat || (data.penuh && data.penuh.tingkat) || TINGKAT_MODUL).trim().toUpperCase();
  var akhirIsi = lembar.getLastRow();
  var baris = 0;

  // Cari baris pemelajar yang cocok: SUREL SAMA dan TINGKATAN SAMA
  if (akhirIsi >= p.awalData && kolom['surel']) {
    var daftarSurel = lembar.getRange(p.awalData, kolom['surel'],
                                 akhirIsi - p.awalData + 1, 1).getValues();
    var colTingkat = kolom['tingkatan'];
    var daftarTingkat = colTingkat
      ? lembar.getRange(p.awalData, colTingkat, akhirIsi - p.awalData + 1, 1).getValues()
      : [];

    for (var i = 0; i < daftarSurel.length; i++) {
      var s = rapi(daftarSurel[i][0]);
      var t = daftarTingkat.length ? rapi(daftarTingkat[i][0]).toUpperCase() : '';
      if (s === surel && (!colTingkat || !t || t === tingkatData)) {
        baris = p.awalData + i;
        break;
      }
    }
  }

  var baru = false;
  if (!baris) {
    // Jika belum ada baris untuk tingkatan ini, buat baris baru di bawahnya
    var kNama = kolom['nama pemelajar'] || 2;
    var nilaiNama = akhirIsi >= p.awalData
      ? lembar.getRange(p.awalData, kNama, akhirIsi - p.awalData + 1, 1).getValues()
      : [];
    for (var j = 0; j < nilaiNama.length; j++) {
      if (String(nilaiNama[j][0]).trim() === '') { baris = p.awalData + j; break; }
    }
    if (!baris) baris = Math.max(akhirIsi + 1, p.awalData);
    baru = true;
  }

  var unit = data.unit || [];
  var tuntas = 0;
  for (var u = 0; u < JUMLAH_UNIT; u++) {
    var kunciUnit = 'unit ' + (u + 1);
    if (!kolom[kunciUnit]) continue;
    var nilai = unit[u];
    if (nilai === null || nilai === undefined || nilai === '') {
      lembar.getRange(baris, kolom[kunciUnit]).setValue('');
    } else {
      lembar.getRange(baris, kolom[kunciUnit]).setValue(Number(nilai));
      tuntas++;
    }
  }

  function tulis(namaKolom, isi) {
    var k = kolom[namaKolom];
    if (k) lembar.getRange(baris, k).setValue(isi);
  }
  tulis('no', baris - p.awalData + 1);
  tulis('nama pemelajar', data.nama || '');
  tulis('asal/negara', data.instansi || '');
  tulis('tingkatan', tingkatData);
  tulis('nilai akhir', Number(data.rata) || 0);
  tulis('surel', data.surel || '');
  tulis('whatsapp', data.wa || '');
  tulis('pengajar', data.dosen || '');
  var batasUnit = (tingkatData === 'B2') ? 10 : JUMLAH_UNIT;
  var selesai = (data.lengkap !== undefined) ? !!data.lengkap : (tuntas >= batasUnit);
  tulis('predikat', selesai ? predikat(data.rata) : 'belum tuntas');
  tulis('unit tuntas', tuntas);
  tulis('diperbarui', new Date());
  tulis('data lengkap', JSON.stringify(data.penuh || {}).slice(0, 45000));
  if (data.sandi) tulis('kata sandi', String(data.sandi));

  if (baru && KIRIM_SUREL) kirimSurelBaru(data, tingkatData);
  if (KIRIM_SUREL && selesai && rapi(data.catatan) !== 'masuk') {
    kirimSurelSelesai(data, tuntas, tingkatData);
  }
}

function simpanPengajar(data) {
  var b = berkas();
  var lembar = b.getSheetByName(LEMBAR_PENGAJAR);
  if (!lembar) lembar = b.insertSheet(LEMBAR_PENGAJAR);
  if (!barisJudul(lembar, 'id guru')) {
    lembar.getRange(1, 1, 1, 8).setValues([['ID Guru', 'Kode Tingkat', 'Tingkat BIPA',
      'Nama Pengajar', 'Email Login', 'Password*', 'Role', 'Status Akun']])
      .setFontWeight('bold');
    lembar.setFrozenRows(1);
    SpreadsheetApp.flush();
  }
  var judul = barisJudul(lembar, 'id guru');
  if (!judul) return;

  var tingkatData = String(data.tingkat || TINGKAT_MODUL).trim().toUpperCase();
  var kodeData = data.kodeTingkat || kodeTingkat(tingkatData);

  var awal = judul + 1;
  var akhir = lembar.getLastRow();
  var lebar = Math.max(lembar.getLastColumn(), 8);
  var isi = akhir >= awal ? lembar.getRange(awal, 1, akhir - awal + 1, lebar).getValues() : [];

  var surel = rapi(data.surel);
  var baris = 0, kosong = 0, jumlahGuru = 0;
  for (var i = 0; i < isi.length; i++) {
    var b = isi[i];
    if (String(b[0]).trim() !== '') jumlahGuru++;
    if (rapi(b[4]) === surel && rapi(b[2]) === rapi(tingkatData)) { baris = awal + i; break; }
    if (!kosong && String(b[0]).trim() !== '' && String(b[3]).trim() === '' &&
        rapi(b[2]) === rapi(tingkatData)) kosong = awal + i;
  }
  if (!baris) baris = kosong || Math.max(akhir + 1, awal);

  var idGuru = String(lembar.getRange(baris, 1).getValue()).trim();
  if (!idGuru) idGuru = 'G' + ('00' + (jumlahGuru + 1)).slice(-3);

  var sandiLama = baris <= akhir ? String(lembar.getRange(baris, 6).getValue()).trim() : '';
  var sandiPengajar = data.sandi || sandiLama || '(tersimpan pada peramban pengajar)';

  lembar.getRange(baris, 1, 1, 8).setValues([[
    idGuru, kodeData, tingkatData, data.nama || '',
    data.surel || '', sandiPengajar, 'Pengajar', 'Aktif'
  ]]);
}

function catat(data, peran) {
  var tkt = String(data.tingkat || (data.penuh && data.penuh.tingkat) || TINGKAT_MODUL).trim().toUpperCase();
  lembarAktivitas().appendRow([
    new Date(), data.nama || '', data.surel || '', peran || '',
    tkt, data.dosen || '', data.catatan || 'kemajuan',
    data.tuntas || 0, data.rata || 0
  ]);
}

/* ============================ PEMBACA =============================== */

function bacaBaris(lembar, kolom, baris, denganData) {
  function ambil(nama) {
    var k = kolom[nama];
    return k ? lembar.getRange(baris, k).getValue() : '';
  }
  var unit = [];
  for (var u = 1; u <= JUMLAH_UNIT; u++) {
    var nilai = ambil('unit ' + u);
    unit.push(nilai === '' || nilai === null ? null : Number(nilai));
  }
  var hasil = {
    nama: ambil('nama pemelajar'), surel: ambil('surel'), wa: ambil('whatsapp'),
    instansi: ambil('asal/negara'), dosen: ambil('pengajar'),
    tingkat: ambil('tingkatan'), unit: unit,
    tuntas: Number(ambil('unit tuntas')) || 0, rata: Number(ambil('nilai akhir')) || 0
  };
  if (kolom['kata sandi']) {
    hasil.sandi = String(ambil('kata sandi') || '').trim();
  }
  if (denganData) {
    try { hasil.penuh = JSON.parse(ambil('data lengkap') || '{}'); }
    catch (x) { hasil.penuh = {}; }
  }
  return hasil;
}

function ambilPemelajar(surel, tingkat) {
  var p = petaPemelajar();
  var lembar = p.lembar, kolom = p.kolom;
  var akhir = lembar.getLastRow();
  if (akhir < p.awalData || !kolom['surel']) return null;
  var daftarSurel = lembar.getRange(p.awalData, kolom['surel'], akhir - p.awalData + 1, 1).getValues();
  var colTingkat = kolom['tingkatan'];
  var daftarTingkat = colTingkat
    ? lembar.getRange(p.awalData, colTingkat, akhir - p.awalData + 1, 1).getValues()
    : [];

  var cari = rapi(surel), tkt = rapi(tingkat).toUpperCase(), baris = 0, barisAlternatif = 0;
  for (var i = 0; i < daftarSurel.length; i++) {
    var s = rapi(daftarSurel[i][0]);
    var t = daftarTingkat.length ? rapi(daftarTingkat[i][0]).toUpperCase() : '';
    if (s === cari) {
      if (!tkt || t === tkt) {
        baris = p.awalData + i;
        break;
      }
      if (!barisAlternatif) barisAlternatif = p.awalData + i;
    }
  }

  if (!baris && barisAlternatif) {
    var profil = bacaBaris(lembar, kolom, barisAlternatif, false);
    profil.tingkat = tingkat ? String(tingkat).toUpperCase() : TINGKAT_MODUL;
    profil.unit = [];
    profil.tuntas = 0;
    profil.rata = 0;
    profil.penuh = {};
    return profil;
  }
  if (!baris) return null;
  return bacaBaris(lembar, kolom, baris, true);
}

/** Daftar pemelajar milik seorang pengajar. Kirim '*' untuk seluruh pemelajar. */
function ambilKelas(dosen, tingkat) {
  var p = petaPemelajar();
  var lembar = p.lembar, kolom = p.kolom;
  var akhir = lembar.getLastRow();
  if (akhir < p.awalData) return [];
  var cari = rapi(dosen);
  var tkt = rapi(tingkat).toUpperCase();
  var colTingkat = kolom['tingkatan'];
  var hasil = [];
  for (var baris = p.awalData; baris <= akhir; baris++) {
    var nama = kolom['nama pemelajar']
      ? lembar.getRange(baris, kolom['nama pemelajar']).getValue() : '';
    if (String(nama).trim() === '') continue;
    var milik = kolom['pengajar']
      ? rapi(lembar.getRange(baris, kolom['pengajar']).getValue()) : '';
    if (cari !== '*' && (!milik || milik.indexOf(cari) < 0)) continue;

    if (tkt && colTingkat) {
      var rowTkt = rapi(lembar.getRange(baris, colTingkat).getValue()).toUpperCase();
      if (rowTkt && rowTkt !== tkt) continue;
    }

    hasil.push(bacaBaris(lembar, kolom, baris, false));
  }
  return hasil;
}

/** Verifikasi login pemelajar atau pengajar secara online dari perangkat mana pun. */
function verifikasiMasuk(identitas, sandiHash, tingkat) {
  var id = rapi(identitas);
  var tkt = rapi(tingkat).toUpperCase();
  if (!id) return { ok: false, pesan: 'Nama atau surel wajib diisi.' };
  if (!sandiHash) return { ok: false, pesan: 'Kata sandi wajib diisi.' };

  // 1. Periksa lembar Pemelajar (berdasarkan nama lengkap atau surel)
  var p = petaPemelajar();
  var lembar = p.lembar, kolom = p.kolom;
  var akhir = lembar.getLastRow();
  var baris = 0;
  var barisAlternatif = 0;

  if (akhir >= p.awalData) {
    var colNama = kolom['nama pemelajar'] || 2;
    var colSurel = kolom['surel'];
    var colTingkat = kolom['tingkatan'];
    var dataNama = lembar.getRange(p.awalData, colNama, akhir - p.awalData + 1, 1).getValues();
    var dataSurel = colSurel
      ? lembar.getRange(p.awalData, colSurel, akhir - p.awalData + 1, 1).getValues()
      : [];
    var dataTingkat = colTingkat
      ? lembar.getRange(p.awalData, colTingkat, akhir - p.awalData + 1, 1).getValues()
      : [];

    for (var i = 0; i < dataNama.length; i++) {
      var n = rapi(dataNama[i][0]);
      var s = dataSurel.length ? rapi(dataSurel[i][0]) : '';
      var t = dataTingkat.length ? rapi(dataTingkat[i][0]).toUpperCase() : '';
      if ((n && n === id) || (s && s === id)) {
        if (!tkt || t === tkt) {
          baris = p.awalData + i;
          break;
        }
        if (!barisAlternatif) barisAlternatif = p.awalData + i;
      }
    }
  }

  var barisVerifikasi = baris || barisAlternatif;

  if (barisVerifikasi) {
    var colSandi = kolom['kata sandi'];
    var sandiDiSheet = colSandi ? String(lembar.getRange(barisVerifikasi, colSandi).getValue()).trim() : '';

    if (!sandiDiSheet) {
      // Akun lama yang belum tercatat sandinya di spreadsheet:
      // Daftarkan sandi yang dimasukkan sekarang agar multi-device langsung aktif
      if (colSandi) {
        lembar.getRange(barisVerifikasi, colSandi).setValue(sandiHash);
        SpreadsheetApp.flush();
      }
    } else if (sandiDiSheet !== sandiHash) {
      return { ok: false, pesan: 'Kata sandi belum tepat.' };
    }

    var dataPemelajar;
    if (baris) {
      dataPemelajar = bacaBaris(lembar, kolom, baris, true);
    } else {
      // Akun valid tetapi belum punya nilai di tingkatan yang diminta
      dataPemelajar = bacaBaris(lembar, kolom, barisAlternatif, false);
      dataPemelajar.tingkat = tingkat ? String(tingkat).toUpperCase() : TINGKAT_MODUL;
      dataPemelajar.unit = [];
      dataPemelajar.tuntas = 0;
      dataPemelajar.rata = 0;
      dataPemelajar.penuh = {};
    }
    dataPemelajar.sandi = sandiHash;
    dataPemelajar.peran = 'pemelajar';
    catat({ nama: dataPemelajar.nama, surel: dataPemelajar.surel, dosen: dataPemelajar.dosen, tingkat: dataPemelajar.tingkat, catatan: 'masuk akun' }, 'pemelajar');
    return { ok: true, peran: 'pemelajar', data: dataPemelajar };
  }

  // 2. Periksa lembar Pengajar
  var b = berkas();
  var lembarG = b.getSheetByName(LEMBAR_PENGAJAR);
  if (lembarG) {
    var jG = barisJudul(lembarG, 'id guru');
    if (jG) {
      var awalG = jG + 1;
      var akhirG = lembarG.getLastRow();
      if (akhirG >= awalG) {
        var isiG = lembarG.getRange(awalG, 1, akhirG - awalG + 1, 8).getValues();
        for (var g = 0; g < isiG.length; g++) {
          var namaG = rapi(isiG[g][3]);
          var surelG = rapi(isiG[g][4]);
          if ((namaG && namaG === id) || (surelG && surelG === id)) {
            var sandiG = String(isiG[g][5]).trim();
            if (!sandiG || sandiG === '(tersimpan pada peramban pengajar)') {
              lembarG.getRange(awalG + g, 6).setValue(sandiHash);
              SpreadsheetApp.flush();
            } else if (sandiG !== sandiHash) {
              return { ok: false, pesan: 'Kata sandi belum tepat.' };
            }
            var dataPengajar = {
              nama: isiG[g][3],
              surel: isiG[g][4],
              wa: '-',
              instansi: 'Pengajar BIPA',
              dosen: '',
              sandi: sandiHash,
              peran: 'pengajar'
            };
            catat({ nama: dataPengajar.nama, surel: dataPengajar.surel, tingkat: isiG[g][2] || tkt || 'A1', catatan: 'masuk akun' }, 'pengajar');
            return {
              ok: true,
              peran: 'pengajar',
              data: dataPengajar
            };
          }
        }
      }
    }
  }

  return { ok: false, pesan: 'Nama atau surel belum terdaftar. Silakan pilih Daftar baru.' };
}

/* ============================ SUREL ================================= */

function kirimSurelBaru(data, tingkat) {
  var tkt = tingkat || data.tingkat || TINGKAT_MODUL;
  var pesan =
    'Pemelajar baru mendaftar pada Modul Ajar Digital MyBIPA Tingkat ' + tkt + '.\n\n' +
    'Nama      : ' + (data.nama || '-') + '\n' +
    'Surel     : ' + (data.surel || '-') + '\n' +
    'WhatsApp  : ' + (data.wa || '-') + '\n' +
    'Instansi  : ' + (data.instansi || '-') + '\n' +
    'Pengajar  : ' + (data.dosen || 'tidak diisi') + '\n' +
    'Waktu     : ' + new Date().toLocaleString('id-ID') + '\n';
  MailApp.sendEmail(SUREL_MYBIPA + ',' + ambilSurelAdmin(tkt),
    'MyBIPA ' + tkt + ' — pendaftar baru: ' + (data.nama || ''), pesan);
}

function kirimSurelSelesai(data, tuntas, tingkat) {
  var tkt = tingkat || data.tingkat || TINGKAT_MODUL;
  var pesan =
    'Seorang pemelajar telah menuntaskan seluruh ' + JUMLAH_UNIT + ' unit pada Tingkat ' + tkt + '.\n\n' +
    'Nama        : ' + (data.nama || '-') + '\n' +
    'Instansi    : ' + (data.instansi || '-') + '\n' +
    'Pengajar    : ' + (data.dosen || 'tidak diisi') + '\n' +
    'Unit tuntas : ' + tuntas + '\n' +
    'Nilai akhir : ' + (data.rata || 0) + ' (' + predikat(data.rata) + ')\n' +
    'Nilai unit  : ' + (data.unit || []).join(', ') + '\n';
  MailApp.sendEmail(SUREL_MYBIPA + ',' + ambilSurelAdmin(tkt),
    'MyBIPA ' + tkt + ' — ' + (data.nama || '') + ' menyelesaikan seluruh unit', pesan);
}

/* ============================ PENGUJIAN ============================= */

/** Jalankan sekali dari editor untuk memastikan sambungan berjalan. */
function ujiSambungan() {
  var p = petaPemelajar();
  Logger.log('Lembar Pemelajar terbaca. Baris judul: ' + p.judul);
  Logger.log('Kolom terbaca: ' + Object.keys(p.kolom).join(', '));
  simpan({
    aksi: 'simpan', catatan: 'uji sambungan', peran: 'pemelajar',
    nama: 'Uji Sambungan', surel: 'uji@mybipa.test', wa: '0800',
    instansi: 'Uji Coba', dosen: '',
    unit: [80, 75, null, null, null, null, null, null, null, null, null],
    tuntas: 2, rata: 78, lengkap: false, penuh: {}
  });
  Logger.log('Baris uji tertulis pada lembar Pemelajar. Hapus baris itu setelah diperiksa.');
}
