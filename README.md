# ☕ Point Of Sale (POS) Cafe & Restaurant

Sistem POS (Point of Sale) modern, responsif, dan premium yang dibangun menggunakan **React**, **TypeScript**, dan **Vite** dengan desain estetika *glassmorphism* dan palet warna hijau botol (*forest green*) yang elegan.

---

## 🚀 Fitur yang Sudah Ada (Existing Features)

Saat ini, aplikasi POS telah memiliki fitur-fitur inti berikut:

### 1. 🔐 Multi-Role Authentication
- **Login Multi-Role**: Mendukung peran **Admin** dan **Kasir**.
- **Protected Routes**: Memastikan kasir hanya dapat mengakses halaman kasir (`/pos`) dan admin hanya dapat mengakses dasbor admin (`/admin`).

### 2. 🛒 Sistem POS Kasir (Cashier Screen)
- **Product Grid & Search**: Pencarian cepat dan filter produk berdasarkan kategori (Coffee, Tea, Snack, Main Course).
- **Cart & Order Management**: Mengelola keranjang belanja, mengubah kuantitas, memilih ukuran (Small, Medium, Large), serta jenis pesanan (*Dine In* atau *Take Away*).
- **Held/Parked Orders**: Menahan pesanan pelanggan untuk sementara waktu dan melanjutkannya kembali nanti.
- **Modul Pembayaran Dinamis**: Simulasi pembayaran (Tunai, Kartu, QRIS) lengkap dengan kalkulator kembalian dan cetak struk/nota digital.

### 3. 📊 Dasbor Admin & Laporan (Admin Analytics)
- **Ringkasan Pendapatan**: Statistik total pendapatan harian, pesanan selesai, rata-rata nilai pesanan, dan transaksi yang dibatalkan (void).
- **Grafik Interaktif**: Grafik puncak penjualan per jam (*hourly sales*) dan performa per kategori produk menggunakan Recharts.
- **Rincian Metode Pembayaran**: Persentase penggunaan Tunai, Kartu, dan QRIS.
- **Top Performing Products**: Daftar menu paling laris berdasarkan kuantitas yang terjual.
- **Export to Excel**: Tombol ekspor laporan penjualan lengkap ke format file spreadsheet Excel.

### 4. 📂 Manajemen Data (Management Panel)
- **Menu Management**: Tambah, edit ketersediaan stock, ubah harga, hapus, dan atur ketersediaan menu.
- **User Management**: Mengelola akun staf (kasir dan admin tambahan), hak akses, dan detail profil.

---

## 📋 Fitur yang Disarankan untuk Ditambahkan (Recommended Feature Roadmap)

Berdasarkan analisis sistem POS saat ini, berikut adalah daftar fitur rekomendasi yang dapat ditambahkan untuk meningkatkan nilai operasional dan efisiensi bisnis:

### 1. 🏷️ Sistem Promo & Diskon (Promotions & Coupon Management)
* **Deskripsi**: Fitur untuk membuat dan mengelola berbagai skema promosi di Admin Panel (misalnya: *Buy 1 Get 1*, diskon persentase/nominal, atau gratis item dengan minimum pembelanjaan tertentu).
* **Integrasi POS**: Kasir dapat memilih promo aktif atau memasukkan kode kupon diskon secara langsung pada saat checkout.

### 2. 🪑 Manajemen Layout Meja Interaktif (Interactive Seating Layout)
* **Deskripsi**: Peta denah kursi/meja cafe yang interaktif dan visual pada menu kasir.
* **Integrasi POS**: Berguna untuk tipe pesanan *Dine-In*. Kasir dapat langsung menunjuk nomor meja, memantau meja mana yang kosong/terisi, memindahkan pesanan antarmeja, serta melakukan *merge-bill* atau *split-bill*.

### 3. 🍳 Kitchen Display System (KDS) / Layar Antrean Dapur
* **Deskripsi**: Antarmuka khusus untuk staf dapur (koki/barista) yang menampilkan antrean pesanan masuk secara real-time.
* **Integrasi POS**: Pesanan yang dibayar di kasir akan langsung muncul di layar dapur. Staf dapur dapat memantau detail modifikasi (misal: *less sugar*, *no ice*) dan menandai jika makanan/minuman sudah selesai disiapkan (*Ready for Pickup*).

### 4. 💎 Sistem Membership & Loyalitas Pelanggan (Loyalty Program)
* **Deskripsi**: Fitur pendaftaran pelanggan tetap (member) di POS. Setiap kali member bertransaksi, mereka akan mendapatkan poin loyalitas.
* **Integrasi POS**: Poin yang terkumpul dapat ditukarkan dengan potongan harga, merchandise, atau produk gratis langsung dari layar pembayaran kasir.

### 5. 💰 Manajemen Shift Kasir & Laci Kas (Cash Drawer / Shift Management)
* **Deskripsi**: Proses *Open Shift* (memasukkan saldo kas awal/modal laci) dan *Close Shift* (rekonsiliasi kas harian) untuk menjaga keamanan uang tunai di outlet.
* **Integrasi POS**: Sistem akan mencatat semua kas masuk, pengeluaran kas kecil (*petty cash* seperti membeli es batu/keperluan mendesak), serta menghitung selisih kas fisik di akhir hari untuk laporan audit kasir.

### 6. 📦 Manajemen Inventaris Bahan Baku (Raw Ingredients Inventory)
* **Deskripsi**: Manajemen stok bahan dasar pembuat menu (seperti biji kopi, susu, sirup, dll.) dengan sistem *Recipe-based Deduction*.
* **Integrasi POS**: Setiap kali menu terjual (misal: 1 Cangkir Cafe Latte), sistem secara otomatis mengurangi stok biji kopi sebesar 18g dan susu sebesar 150ml. Dilengkapi dengan peringatan dini (*Low Stock Alert*) untuk pemesanan ulang ke supplier.

---

## 💻 Cara Menjalankan Project Secara Lokal

1. **Instalasi Dependencies**:
   ```bash
   npm install
   ```

2. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```

3. **Build untuk Produksi**:
   ```bash
   npm run build
   ```
