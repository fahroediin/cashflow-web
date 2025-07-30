# DuitQ - Admin Dashboard

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Full_Backend-3ECF8E?style=for-the-badge&logo=supabase)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

**DuitQ Admin Dashboard** adalah antarmuka web administratif yang komprehensif untuk mengelola dan memvisualisasikan data dari [DuitQ WhatsApp Cashflow Bot](https://github.com/fahroediin/whatsapp-cashflow-bot). Dashboard ini menyediakan alat untuk memantau keuangan, mengelola data master, dan melihat log aktivitas secara terpusat, ditenagai oleh Supabase sebagai backend.

---

## ✨ Fitur Unggulan

- 🔒 **Sistem Autentikasi Aman**  
  Akses dashboard dilindungi oleh sistem autentikasi email dan password dari Supabase.
- 📊 **Dashboard Analitik Interaktif**  
  Lihat ringkasan keuangan (Pemasukan, Pengeluaran, Saldo) dalam bentuk Kartu KPI dan visualisasikan rincian pengeluaran per kategori dengan diagram lingkaran (pie chart).
- 🔄 **Manajemen Transaksi**  
  Lihat seluruh riwayat transaksi yang tercatat oleh pengguna bot.
- 🗂️ **Manajemen Kategori (CRUD)**  
  Tambah, lihat, edit, dan hapus kategori pemasukan (INCOME) dan pengeluaran (EXPENSE) langsung dari dashboard.
- 👥 **Manajemen Pengguna**  
  Lihat daftar pengguna bot, atur pengguna default untuk filter, dan hapus pengguna beserta data terkaitnya (khusus admin).
- 📜 **Log Aktivitas**  
  Pantau interaksi pengguna dengan bot secara real-time untuk keperluan debugging atau monitoring.
- 🔍 **Filter Data Lanjutan**  
  Filter data di berbagai halaman berdasarkan pengguna dan periode waktu. Halaman transaksi memiliki filter tambahan per-kategori yang dikelompokkan (INCOME/EXPENSE) untuk analisis mendalam.
- 📄 **Paginasi Cerdas**  
  Semua tabel (Transaksi, Log, Kategori, Pengguna) kini dilengkapi dengan sistem paginasi untuk menampilkan 10 data per halaman, memastikan aplikasi tetap cepat dan responsif meskipun data sudah ribuan.
- 📱 **Desain Responsif**  
  Tampilan yang dioptimalkan untuk kenyamanan penggunaan di desktop maupun perangkat mobile.
- 🚀 **Ringan dan Cepat**  
  Dibuat dengan HTML, CSS, dan JavaScript murni untuk performa maksimal tanpa framework yang berat.

---

## 🏗️ Struktur Proyek

Proyek ini memiliki struktur file yang modular untuk kemudahan pengelolaan:

```
/
├── index.html
├── style.css
├── js/
│   ├── app.js         # Logika utama, routing, dan otentikasi
│   ├── config.js      # Konfigurasi koneksi Supabase
│   ├── dashboard.js   # Logika untuk halaman dashboard (KPI & Chart)
│   ├── transaksi.js   # Logika untuk halaman manajemen transaksi
│   ├── kategori.js    # Logika CRUD untuk manajemen kategori
│   └── pengguna.js    # Logika untuk halaman manajemen pengguna
└── ... (file lainnya)
```

---

## 🚀 Panduan Instalasi & Deployment (AlmaLinux + Nginx)

### 🔧 Prasyarat

1.  **Bot DuitQ aktif** dan terhubung ke Supabase.
2.  **Proyek Supabase** dengan tabel-tabel berikut: `log_aktivitas`, `transaksi`, `kategori`, dan `users`.
3.  **Fungsi RPC di Supabase** untuk menghapus pengguna (lihat Langkah 1).
4.  **Akun admin Supabase** yang dibuat melalui Dashboard Supabase (Authentication > Add user).
5.  **VPS dengan AlmaLinux** dan akses root/sudo.
6.  (Opsional) **Domain** yang diarahkan ke IP VPS Anda.

---

### 🔹 Langkah 1: Setup Backend Supabase

Sebelum deploy, pastikan fungsi untuk menghapus pengguna telah dibuat di Supabase.

1.  Buka Supabase Dashboard Anda.
2.  Navigasi ke **SQL Editor** > **New query**.
3.  Jalankan script SQL berikut untuk membuat fungsi `delete_public_user`:

```sql
-- Fungsi untuk menghapus pengguna dari tabel 'users' beserta data terkaitnya
-- di tabel 'transaksi' dan 'log_aktivitas'.
CREATE OR REPLACE FUNCTION delete_public_user(user_id_to_delete UUID)
RETURNS TEXT AS $$
DECLARE
  deleted_user_name TEXT;
  deleted_transactions_count INT;
  deleted_logs_count INT;
BEGIN
  -- 1. Ambil nama pengguna sebelum dihapus untuk pesan respons
  SELECT nama INTO deleted_user_name FROM public.users WHERE id = user_id_to_delete;
  
  -- Jika pengguna tidak ditemukan, kembalikan pesan error
  IF deleted_user_name IS NULL THEN
    RETURN 'Error: Pengguna dengan ID ' || user_id_to_delete || ' tidak ditemukan.';
  END IF;

  -- 2. Hapus data terkait di tabel 'transaksi' dan hitung jumlahnya
  WITH deleted AS (
    DELETE FROM public.transaksi WHERE id_user = user_id_to_delete RETURNING *
  )
  SELECT count(*) INTO deleted_transactions_count FROM deleted;

  -- 3. Hapus data terkait di tabel 'log_aktivitas' dan hitung jumlahnya
  WITH deleted AS (
    DELETE FROM public.log_aktivitas WHERE id_user = user_id_to_delete RETURNING *
  )
  SELECT count(*) INTO deleted_logs_count FROM deleted;
  
  -- 4. Hapus pengguna dari tabel 'users'
  DELETE FROM public.users WHERE id = user_id_to_delete;

  -- 5. Kembalikan pesan sukses
  RETURN 'Pengguna "' || deleted_user_name || '" berhasil dihapus. ' ||
         'Data terkait yang dihapus: ' || deleted_transactions_count || ' transaksi, ' ||
         deleted_logs_count || ' log.';
EXCEPTION
  WHEN OTHERS THEN
    -- Tangani jika terjadi error selama proses
    RETURN 'Error saat menghapus pengguna: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 🔹 Langkah 2: Persiapan Server Nginx

```bash
# Update sistem & instal Nginx
sudo dnf update -y
sudo dnf install nginx -y

# Jalankan & aktifkan Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Buka akses HTTP & HTTPS di firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

### 🔹 Langkah 3: Deploy Proyek

```bash
# Masuk ke direktori web root Nginx
cd /usr/share/nginx/html

# Kloning repositori Anda ke dalam folder 'cashflow-web'
# Ganti URL dengan repositori Anda
sudo git clone https://github.com/your-username/your-web-repo.git cashflow-web

# Atau, jika tidak menggunakan git, upload folder proyek Anda via SCP/FTP
# dan pastikan nama foldernya adalah 'cashflow-web' di direktori ini
```

---

### 🔹 Langkah 4: Konfigurasi Aplikasi

Buat dan edit file konfigurasi untuk koneksi ke Supabase.

```bash
# Masuk ke direktori js di dalam proyek Anda
cd /usr/share/nginx/html/cashflow-web/js

# Buat file config.js (jika belum ada)
sudo nano config.js
```

Isi file `config.js` dengan kredensial Supabase Anda:

```javascript
// GANTI DENGAN KREDENSIAL SUPABASE ANDA
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'your-public-anon-key-here';

// Inisialisasi Klien Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Penting:** Gunakan **Public Anon Key**, bukan Service Role Key.

---

### 🔹 Langkah 5: Atur Izin File & SELinux

```bash
# Install utilitas SELinux jika belum ada
sudo dnf install policycoreutils-python-utils -y

# Atur konteks keamanan agar Nginx bisa membaca file proyek
sudo semanage fcontext -a -t httpd_sys_content_t "/usr/share/nginx/html/cashflow-web(/.*)?"
sudo restorecon -Rv /usr/share/nginx/html/cashflow-web

# Set izin file agar dapat dibaca oleh Nginx
sudo chmod -R 755 /usr/share/nginx/html/cashflow-web
```

---

### 🔹 Langkah 6: Akses Dashboard

Akses dashboard Anda melalui URL:
`http://<IP_VPS_ANDA>/cashflow-web`

Login menggunakan akun admin yang telah Anda buat di Supabase.

---

### 🔐 (Opsional) Setup Domain + HTTPS dengan Certbot

Jika Anda ingin mengakses dashboard melalui domain (misal: `cashflow.domainanda.com`) dengan HTTPS.

**1. Buat Konfigurasi Nginx untuk Domain Anda**

```bash
sudo nano /etc/nginx/conf.d/cashflow.domainanda.com.conf
```

Isi dengan konfigurasi berikut (ganti `cashflow.domainanda.com` dengan domain Anda):

```nginx
server {
    listen 80;
    server_name cashflow.domainanda.com;

    root /usr/share/nginx/html/cashflow-web;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**2. Install Certbot dan Dapatkan Sertifikat SSL**

```bash
sudo dnf install certbot python3-certbot-nginx -y
sudo certbot --nginx -d cashflow.domainanda.com
```

Ikuti petunjuk di layar, pilih opsi untuk redirect otomatis dari HTTP ke HTTPS.

**3. Restart Nginx**
```bash
sudo systemctl restart nginx
```

Sekarang dashboard Anda dapat diakses dengan aman di `https://cashflow.domainanda.com`.

---

## 📬 Kontak

Untuk pertanyaan, saran, atau kontribusi, silakan buat *issue* atau *pull request* di repositori GitHub ini.