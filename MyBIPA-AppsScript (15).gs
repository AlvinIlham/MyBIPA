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

var TINGKAT_MODUL = 'A1';     // tingkat yang ditangani modul ini
var KODE_TINGKAT  = 'P001';   // P001=A1, P002=A2, P003=B1, P004=B2, P005=C1, P006=C2
var JUMLAH_UNIT   = 11;       // modul A1 bermuatan lokal Minangkabau memuat 11 unit

var SUREL_MYBIPA = 'mybipa3@gmail.com';
var SUREL_ADMIN  = 'sukmaradi333@gmail.com';
var KIRIM_SUREL  = true;      // ubah ke false bila pemberitahuan surel tidak diperlukan

var LEMBAR_PEMELAJAR = 'Pemelajar';
var LEMBAR_PENGAJAR  = 'Pengajar';
var LEMBAR_AKTIVITAS = 'Aktivitas';

var KOLOM_TAMBAHAN = ['Surel', 'WhatsApp', 'Pengajar', 'Predikat',
                      'Unit Tuntas', 'Diperbarui', 'Data Lengkap'];

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
    if (aksi === 'ambil') {
      jawab = { ok: true, data: ambilPemelajar(data.surel) };
    } else if (aksi === 'kelas') {
      jawab = { ok: true, data: ambilKelas(data.dosen || '') };
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
  try {
    if (par.aksi === 'kelas') {
      jawab = { ok: true, data: ambilKelas(par.dosen || '') };
    } else if (par.aksi === 'simpan') {
      /* penyimpanan lewat doGet, dipakai bila pengiriman POST terhalang peramban */
      simpan(JSON.parse(par.data || '{}'));
      jawab = { ok: true };
    } else if (par.surel) {
      jawab = { ok: true, data: ambilPemelajar(par.surel) };
    } else {
      jawab = { ok: true, pesan: 'MyBIPA ' + TINGKAT_MODUL + ' siap menerima data.' };
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
  catat(data, peran);
}

function simpanPemelajar(data) {
  var p = petaPemelajar();
  var lembar = p.lembar, kolom = p.kolom;
  var surel = rapi(data.surel);
  var akhirIsi = lembar.getLastRow();
  var baris = 0;

  if (akhirIsi >= p.awalData && kolom['surel']) {
    var daftar = lembar.getRange(p.awalData, kolom['surel'],
                                 akhirIsi - p.awalData + 1, 1).getValues();
    for (var i = 0; i < daftar.length; i++) {
      if (rapi(daftar[i][0]) === surel) { baris = p.awalData + i; break; }
    }
  }

  var baru = false;
  if (!baris) {
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
  tulis('tingkatan', TINGKAT_MODUL);
  tulis('nilai akhir', Number(data.rata) || 0);
  tulis('surel', data.surel || '');
  tulis('whatsapp', data.wa || '');
  tulis('pengajar', data.dosen || '');
  tulis('predikat', tuntas >= JUMLAH_UNIT ? predikat(data.rata) : 'belum tuntas');
  tulis('unit tuntas', tuntas);
  tulis('diperbarui', new Date());
  tulis('data lengkap', JSON.stringify(data.penuh || {}).slice(0, 45000));

  if (baru && KIRIM_SUREL) kirimSurelBaru(data);
  if (KIRIM_SUREL && tuntas >= JUMLAH_UNIT && rapi(data.catatan) !== 'masuk') {
    kirimSurelSelesai(data, tuntas);
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

  var awal = judul + 1;
  var akhir = lembar.getLastRow();
  var lebar = Math.max(lembar.getLastColumn(), 8);
  var isi = akhir >= awal ? lembar.getRange(awal, 1, akhir - awal + 1, lebar).getValues() : [];

  var surel = rapi(data.surel);
  var baris = 0, kosong = 0, jumlahGuru = 0;
  for (var i = 0; i < isi.length; i++) {
    var b = isi[i];
    if (String(b[0]).trim() !== '') jumlahGuru++;
    if (rapi(b[4]) === surel && rapi(b[2]) === rapi(TINGKAT_MODUL)) { baris = awal + i; break; }
    if (!kosong && String(b[0]).trim() !== '' && String(b[3]).trim() === '' &&
        rapi(b[2]) === rapi(TINGKAT_MODUL)) kosong = awal + i;
  }
  if (!baris) baris = kosong || Math.max(akhir + 1, awal);

  var idGuru = String(lembar.getRange(baris, 1).getValue()).trim();
  if (!idGuru) idGuru = 'G' + ('00' + (jumlahGuru + 1)).slice(-3);

  lembar.getRange(baris, 1, 1, 8).setValues([[
    idGuru, KODE_TINGKAT, TINGKAT_MODUL, data.nama || '',
    data.surel || '', '(tersimpan pada peramban pengajar)', 'Pengajar', 'Aktif'
  ]]);
}

function catat(data, peran) {
  lembarAktivitas().appendRow([
    new Date(), data.nama || '', data.surel || '', peran || '',
    TINGKAT_MODUL, data.dosen || '', data.catatan || 'kemajuan',
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
  if (denganData) {
    try { hasil.penuh = JSON.parse(ambil('data lengkap') || '{}'); }
    catch (x) { hasil.penuh = {}; }
  }
  return hasil;
}

function ambilPemelajar(surel) {
  var p = petaPemelajar();
  var lembar = p.lembar, kolom = p.kolom;
  var akhir = lembar.getLastRow();
  if (akhir < p.awalData || !kolom['surel']) return null;
  var daftar = lembar.getRange(p.awalData, kolom['surel'], akhir - p.awalData + 1, 1).getValues();
  var cari = rapi(surel), baris = 0;
  for (var i = 0; i < daftar.length; i++) {
    if (rapi(daftar[i][0]) === cari) { baris = p.awalData + i; break; }
  }
  if (!baris) return null;
  return bacaBaris(lembar, kolom, baris, true);
}

/** Daftar pemelajar milik seorang pengajar. Kirim '*' untuk seluruh pemelajar. */
function ambilKelas(dosen) {
  var p = petaPemelajar();
  var lembar = p.lembar, kolom = p.kolom;
  var akhir = lembar.getLastRow();
  if (akhir < p.awalData) return [];
  var cari = rapi(dosen);
  var hasil = [];
  for (var baris = p.awalData; baris <= akhir; baris++) {
    var nama = kolom['nama pemelajar']
      ? lembar.getRange(baris, kolom['nama pemelajar']).getValue() : '';
    if (String(nama).trim() === '') continue;
    var milik = kolom['pengajar']
      ? rapi(lembar.getRange(baris, kolom['pengajar']).getValue()) : '';
    if (cari !== '*' && (!milik || milik.indexOf(cari) < 0)) continue;
    hasil.push(bacaBaris(lembar, kolom, baris, false));
  }
  return hasil;
}

/* ============================ SUREL ================================= */

function kirimSurelBaru(data) {
  var pesan =
    'Pemelajar baru mendaftar pada Modul Ajar Digital MyBIPA Tingkat ' + TINGKAT_MODUL + '.\n\n' +
    'Nama      : ' + (data.nama || '-') + '\n' +
    'Surel     : ' + (data.surel || '-') + '\n' +
    'WhatsApp  : ' + (data.wa || '-') + '\n' +
    'Instansi  : ' + (data.instansi || '-') + '\n' +
    'Pengajar  : ' + (data.dosen || 'tidak diisi') + '\n' +
    'Waktu     : ' + new Date().toLocaleString('id-ID') + '\n';
  MailApp.sendEmail(SUREL_MYBIPA + ',' + SUREL_ADMIN,
    'MyBIPA ' + TINGKAT_MODUL + ' — pendaftar baru: ' + (data.nama || ''), pesan);
}

function kirimSurelSelesai(data, tuntas) {
  var pesan =
    'Seorang pemelajar telah menuntaskan seluruh ' + JUMLAH_UNIT + ' unit.\n\n' +
    'Nama        : ' + (data.nama || '-') + '\n' +
    'Instansi    : ' + (data.instansi || '-') + '\n' +
    'Pengajar    : ' + (data.dosen || 'tidak diisi') + '\n' +
    'Unit tuntas : ' + tuntas + '\n' +
    'Nilai akhir : ' + (data.rata || 0) + ' (' + predikat(data.rata) + ')\n' +
    'Nilai unit  : ' + (data.unit || []).join(', ') + '\n';
  MailApp.sendEmail(SUREL_MYBIPA + ',' + SUREL_ADMIN,
    'MyBIPA ' + TINGKAT_MODUL + ' — ' + (data.nama || '') + ' menyelesaikan seluruh unit', pesan);
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
