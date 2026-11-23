# catat.id — catat uangmu tanpa mencatat

Aplikasi web Google Apps Script yang membaca email notifikasi bank & e-wallet di Gmail,
lalu mencatatnya otomatis ke Google Sheets milik pengguna.

Panduan untuk dijual ke orang lain (template, link salin, Lynk.id/Scalev) ada di dokumen
"Panduan Penjual catat.id". Panduan pembeli ada di "Panduan catat.id: Pasang & Pakai".
Bagian di bawah ini untuk memasang ke spreadsheet kamu sendiri yang sudah berisi data lama.

## Isi folder

| Folder | Isi |
|---|---|
| `dist/` | **Yang ditempel ke Apps Script**: `Code.gs`, `Index.html`, `appsscript.json`. Dibuat dari `apps-script/`. |
| `apps-script/` | Kode sumber, dipecah per bagian supaya mudah diubah. Jangan ditempel langsung. |
| `tools/build.js` | Menggabungkan `apps-script/` menjadi `dist/`. Jalankan `node tools/build.js` setiap kode berubah. |
| `test/` | Simulator Apps Script untuk menguji kode di komputer (Node + Playwright). |
| `mockup/` | Mockup HTML lama (versi hijau), hanya untuk arsip. |

## Cara memasang ke spreadsheet yang sudah ada

**0. Cadangkan dulu.** Di Google Sheets: File → Buat salinan. Kalau ada yang salah, data lama aman.

**1. Buka editor skrip.** Di spreadsheet: Ekstensi → Apps Script.

**2. Hapus file lama.** Hapus semua file di daftar File (klik titik tiga di samping nama file → Hapus),
sisakan satu file `.gs` saja dan ganti namanya menjadi `Code`. Kode lama tidak dipakai lagi.

Sheet (tab) di spreadsheet **jangan** dihapus. Data lama tetap dipakai.

**3. Tempel 2 file.** Hanya dua file dari folder `dist/`:

- `Code.gs`: hapus seluruh isi file Code/Kode yang ada, tempel isi `dist/Code.gs`.
- `Index`: tombol + → HTML, beri nama `Index`, tempel isi `dist/Index.html`.

Di GitHub, buka filenya lalu klik tombol **Copy raw file** (ikon salin di kanan atas isi file).

**4. Ganti manifest.** Setelan proyek (ikon gerigi) → centang "Tampilkan file manifes appsscript.json".
Buka `appsscript.json`, ganti isinya dengan file `dist/appsscript.json`.

**5. Jalankan Setup.** Simpan, lalu muat ulang spreadsheet. Akan muncul menu **catat.id**.
Klik catat.id → ▶ Mulai / buka aplikasi. Izinkan akses (Sheets, Gmail, kirim email review), lalu klik sekali lagi.
Setup membuat sheet yang belum ada, menambah kolom baru di kanan, dan memasang pemicu sinkron tiap 15 menit.

**6. Terbitkan aplikasi web** (lewati kalau dialog ▶ Mulai sudah menampilkan link). Di editor: Terapkan → Penerapan baru → Jenis: Aplikasi web.
Jalankan sebagai: Saya. Yang punya akses: Hanya saya. Klik Terapkan, salin URL-nya.
Buka URL itu di HP, lalu "Tambahkan ke Layar Utama" supaya terasa seperti aplikasi.

**7. Onboarding.** Di aplikasi isi nama panggilan, **nama persis seperti di rekening** (penting untuk
mengenali transfer ke rekening sendiri), pilih bank/e-wallet, pemasukan bulanan, dan PIN.

**8. Bersihkan data lama.** Kembali ke spreadsheet: catat.id → Bersihkan data lama — pratinjau.
Kalau angkanya masuk akal, jalankan catat.id → Bersihkan data lama — jalankan. Ini:
menghapus rekap bulanan GoPay yang tercatat dobel, menghapus baris bertanggal rusak, mengubah
uang masuk yang salah tercatat sebagai pengeluaran, mengubah transfer ke rekening sendiri menjadi
Transfer, dan menyeragamkan kategori Admin Fee.

### Kalau kode diperbarui

Tempel ulang file yang berubah, lalu Terapkan → Kelola penerapan → ikon pensil → Versi: Versi baru → Terapkan.
URL aplikasi tetap sama.

## Cara kerja singkat

- **Otomatis penuh** (Mandiri, Jago, BSI, Superbank, GoPay, OVO): parser khusus, langsung tercatat.
- **Mode pintar** (BCA, BRI, BNI, SeaBank, blu, CIMB, Permata, DANA, ShopeePay): parser umum,
  hasilnya masuk antrean **Cek sekilas**. Kategori yang dipilih diingat untuk merchant itu.
- Transfer ke nama sendiri dicatat sebagai **Transfer**, tidak dihitung pengeluaran.
- Transfer ke rekening yang terhubung ke goal otomatis menjadi setoran goal.
- Alokasi bulanan 50/20/30 (bisa diubah) dari pemasukan nyata atau perkiraan pemasukan.

Lupa PIN: spreadsheet → catat.id → Reset PIN aplikasi.

## Menjalankan tes

```bash
cd finance-tracker/test
TZ=Asia/Jakarta node test.js
```

`test.js` menguji parser, sinkron, dan semua aksi API dengan Gmail & Sheets tiruan.
`server.js` + `ui.js` menjalankan aplikasi di Chromium dan mengambil screenshot setiap layar ke `test/shots/`.
